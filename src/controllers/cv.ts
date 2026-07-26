import prisma from "../prisma.js";
import getValue from "../utils/getValue.js";
import hasValue from "../utils/hasValues.js";
import type { RequestHandler } from "express";
import type { CVDto } from "../middleware/schema.js";
import initializeCVsWhere from "../utils/initializeCVsWhere.js";
import { CVStatus, Prisma, Role } from "../../generated/prisma/client.js";

export const getCVs: RequestHandler = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 50);
    const search = req.query.search?.toString().trim();
    const tsQuery = search?.split(/\s+/).join(" & ");
    const where: Prisma.CVWhereInput = initializeCVsWhere(req.user.role, req.user.id);

    if(tsQuery) {
        where.OR = [
            {
                candidate: {
                    firstName: {search: tsQuery}
                },
            },
            {
                candidate: {
                    lastName: {search: tsQuery}
                }
            },
            {
                position: {
                    title: {search: tsQuery}
                }
            }
        ]
    };
    const [cvs, totalCount] = await prisma.$transaction([
        prisma.cV.findMany({
            where,
            include: {
                position: {
                    select: { title: true, company: true, level: true },
                },
                candidate: {
                    select: { firstName: true, lastName: true, photoUrl: true },
                },
            },
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy: {
                publishedAt: "desc",
            },
        }),
        prisma.cV.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
        cvs,
        page,
        pageSize,
        totalPages,
        totalCount,
    });
}

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
        where: {id},
        include: {
            position: {
                include: {
                    positionAttributes: true
                }
            },
            candidate: true
        }
    });

    if(!cv) {
        res.status(404).json({error: "CV not found"});
        return;
    }

    if(req.user.role === Role.CANDIDATE && req.user.id !== cv.candidateId) {
        res.status(403).json({error: "You are not allowed to view this CV"});
        return;
    }

    const attributeValues = await prisma.$transaction(async (tx) => {
        const existing = await tx.attributeValue.findMany({
            where: {
                candidateId: cv.candidateId,
                attributeId: {in: cv.position.positionAttributes.map(attr => attr.attributeId)}
            },
            include: {
                attribute: {
                    include: {
                        attributeOptions: true
                    }
                },
            }
        })

        const missing = cv.position.positionAttributes.filter(attr => !existing.some(value => value.attributeId === attr.attributeId));

        if(missing.length > 0){
            await tx.attributeValue.createMany({
                data: missing.map(attr => ({
                    candidateId: cv.candidateId,
                    attributeId: attr.attributeId
                })),
                skipDuplicates: true,
            })

            return tx.attributeValue.findMany({
                where: {
                    candidateId: cv.candidateId,
                    attributeId: {
                        in: cv.position.positionAttributes.map(a => a.attributeId)
                    },
                },
                include: {
                    attribute: {
                        include: {
                            attributeOptions: true
                        }
                    },
                }
            });
        }

        return existing
    })

    const canEdit = req.user.role === Role.ADMIN || req.user.id === cv.candidateId;
    res.json({cv, attributeValues, readOnly: !canEdit});
}

export const updateCV: RequestHandler = async (req, res, next) => {
    try {
        const where: Prisma.CVWhereInput = {
            id: Number(req.params.id),
            ...(req.user.role === Role.ADMIN
                ? {}
                : { candidateId: req.user.id }),
        };
        const cv = await prisma.cV.findFirst({
            where
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
                        candidateId: cv.candidateId,
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
            status: CVStatus.PUBLISHED,
            publishedAt: new Date()
        }
    })

    res.json({message: "CV published successfully"})
}