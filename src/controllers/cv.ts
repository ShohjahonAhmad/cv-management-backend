import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import { AttributeType, CVStatus, Prisma, type AttributeValue, type Attribute } from "../../generated/prisma/client.js";
import type { CVDto } from "../middleware/schema.js";
import getValue from "../utils/getValue.js";

export const createCV: RequestHandler = async (req, res, next) => {
    const positionId = Number(req.params.positionId);
    const candidateId = req.user.id;
    
    try {
        const cv = await prisma.$transaction(async (tx) => {
            const cv = await tx.cV.create({
                data: {
                    candidateId,
                    positionId,
                },
            });

            const positionAttributes = await tx.positionAttribute.findMany({
                where: {positionId: cv.positionId}
            });

            const attributeValues = await tx.attributeValue.findMany({
                    where: {candidateId: cv.candidateId, attributeId: {in: positionAttributes.map(attr => attr.attributeId)}}
            });
    
            const missingAttributes = positionAttributes.filter(attr => (
                !attributeValues.some(value => value.attributeId === attr.attributeId)
            ));
        
            await tx.attributeValue.createMany({
                data: missingAttributes.map(attr => ({
                    candidateId: cv.candidateId,
                    attributeId: attr.attributeId,   
                })),
                skipDuplicates: true
            });

            return cv;
        })

        res.status(201).json({cv})
    } catch(err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code === 'P2003'){
                res.status(404).json({error: "Position not found"});
                return;
            }

            if(err.code === 'P2002') {
                const cv = await prisma.cV.findUnique({
                    where: {
                        candidateId_positionId: {
                            candidateId,
                            positionId
                        },
                    }
                })

                res.json({cv});
                return;
            }
        }

        next(err)
    }
}

export const getCVById: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    const cv = await prisma.cV.findUnique({
        where: {
            id,
        },
        include: {
            position: {
                include: {
                    positionAttributes: true
                }
            },
            candidate: {
                include: {
                    attributeValues: {
                        include: {
                            attribute: {
                                include: {
                                    attributeOptions: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if(!cv) {
        res.status(404).json({error: "CV not found"});
        return;
    }

    const attributeValues = cv?.candidate.attributeValues.filter((value) => cv.position.positionAttributes.some((attr) => attr.attributeId === value.attributeId));

    cv.candidate.attributeValues = [];

    res.json({cv, attributeValues});
}

export const updateCV: RequestHandler = async (req, res, next) => {
    try {
        const cv = await prisma.cV.findFirst({
            where: {
                id: Number(req.params.id),
                candidateId: req.user.id,
            },
        });
        
        if (!cv) {
            res.status(404).json({
                error: "CV not found",
            });
            return;
        }

        const {attributeValues} = req.body as CVDto;

        await prisma.$transaction(attributeValues.map((value) => 
            prisma.attributeValue.update({
                where: {
                    candidateId_attributeId: {
                        candidateId: req.user.id,
                        attributeId: value.attributeId
                    }
                },
                data: getValue(value)
        }))) 

        res.json({message: "CV updated successfully"})
    } catch(err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code === 'P2025'){
                res.status(404).json({error: "Attribute value not found"});
                return;
            }
        }
        next(err)
    }
}

export const publishCV: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    const cv = await prisma.cV.findUnique({
        where: {
            id,
        },
        include: {
            position: {
                include: {
                    positionAttributes: true
                }
            },
            candidate: {
                include: {
                    attributeValues: {
                        include: {
                            attribute: true
                        }
                    }
                }
            }
        }
    });

    if(!cv) {
        res.status(404).json({error: "CV not found"});
        return;
    }

    if(cv.status === CVStatus.PUBLISHED) {
        res.status(400).json({error: "CV is already published"});
        return;
    }


    const requiredValues = cv.position.positionAttributes.map(positionAttribute =>
        cv.candidate.attributeValues.find(
            value => value.attributeId === positionAttribute.attributeId
        )
    );

    if (requiredValues.some(value => !value)) {
        return res.status(400).json({
            error: "CV is missing required attributes",
        });
    }

    for(const value of requiredValues) {
        if (!hasValue(value!)){
            res.status(400).json({error: value!.attribute.name});
            return;
        }
    }

    await prisma.cV.update({
        where: {
            id,
        },
        data: {
            status: CVStatus.PUBLISHED
        }
    })

    res.json({message: "CV published successfully"})
}

function hasValue(value: AttributeValue & {attribute: Attribute}): boolean {
    switch(value.attribute.type) {
        case AttributeType.STRING:
            return value.stringValue !== null && value.stringValue.trim() !== "";
        case AttributeType.NUMBER:
            return value.numericValue !== null;
        case AttributeType.SELECT:
            return value.optionId !== null;
        case AttributeType.BOOLEAN:
            return value.booleanValue !== null;
        case AttributeType.DATE:
            return value.dateValue !== null;
        case AttributeType.PERIOD:
            return value.periodStart !== null && value.periodEnd !== null;
        case AttributeType.TEXT:
            return value.textValue !== null && value.textValue.trim() !== "";
        case AttributeType.IMAGE:
            return value.imageUrl !== null && value.imageUrl.trim() !== "";
        default:
            throw new Error(`Unsupported attribute type: ${value.attribute.type}`);
    }
}