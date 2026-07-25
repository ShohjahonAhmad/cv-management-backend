import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import type { ProfileDto, SelectedAttributeDto } from "../middleware/schema.js";
import supabase from "../config/supabase.js";
import { extensionMap } from "../middleware/multer.js";
import { AttributeType, PositionLevel, Role, type AttributeValue, type Prisma } from "../../generated/prisma/client.js";
import { isCompleted } from "../utils/isCompleted.js";

const profileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    headline: true,
    aboutMe: true,
    email: true,
    phone: true,
    location: true,
    photoUrl: true,
    updatedAt: true,
    cvs: {include: {position: true}},
    attributeValues: {
        orderBy: {
            attribute: {
                name: 'asc'
            }
        },
        include: {
            attribute:{
                include: {
                    attributeOptions: true,
                },
            },
            option: true,
            
        }
    }
} satisfies Prisma.UserSelect;

export const getProfile: RequestHandler = async (req, res) => {
    const profile = await prisma.user.findUnique({
        where: {
            id: req.user.id
        },
        select: profileSelect
    })

    res.json({profile, readOnly: false});
}

export const updateProfile: RequestHandler = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if(req.user.role !== Role.ADMIN && req.user.id !== id) {
            res.status(403).json({error: "Forbidden"});
            return;
        }
        const { attributeValues, updatedAt, ...data } = req.body as ProfileDto;

        await prisma.$transaction(async (tx) => {
            const change = await tx.user.updateMany({
                data,
                where: {id, updatedAt}
            });

            if(change.count === 0) {
                throw new Error("conflict");
            }

            await tx.attributeValue.deleteMany({
                where: {
                    candidateId: id
                }
            });

            await tx.attributeValue.createMany({
                data: attributeValues.map((attribute) => {
                    const { attributeId } = attribute;
                    const attributeValue = {
                        candidateId: id,
                        attributeId,
                    }
                    switch(attribute.type) {
                        case "STRING":
                            return {
                                ...attributeValue,
                                stringValue: attribute.value,
                            }
                        case "NUMBER": 
                            return {
                                ...attributeValue,
                                numericValue: attribute.value,
                            }
                        case "BOOLEAN":
                            return {
                                ...attributeValue,
                                booleanValue: attribute.value,
                            }
                        case "SELECT":
                            return {
                                ...attributeValue,
                                optionId: attribute.value,
                            }
                        case "DATE":
                            if(attribute.value == null) {
                                return {
                                    ...attributeValue,
                                    dateValue: null,
                                }
                            }
                            const date = new Date(attribute.value);
                            date.setHours(12, 0, 0, 0);
                            return {
                                ...attributeValue,
                                dateValue: date,
                            }
                        case "PERIOD":
                            if(attribute.value == null || attribute.value.startDate == null || attribute.value.endDate == null) {
                                return {
                                    ...attributeValue,
                                    periodStart: null,
                                    periodEnd: null,
                                }
                            }
                            const periodStart = new Date(attribute.value.startDate);
                            const periodEnd = new Date(attribute.value.endDate);
                            periodStart.setHours(12, 0, 0, 0);
                            periodEnd.setHours(12, 0, 0, 0);
                            return {
                                ...attributeValue,
                                periodStart,
                                periodEnd,
                            }
                        case "TEXT":
                            return {
                                ...attributeValue,
                                textValue: attribute.value,
                            }
                        case "IMAGE": 
                            return {
                                ...attributeValue,
                                imageUrl: attribute.value,
                            }
                        default:
                            throw new Error(`Unsupported attribute type: ${attribute}`);
                    }
                })
            })
        });

        res.json({message: "Profile updated successfully"});
    } catch(err) {
        if(err instanceof Error && err.message === "conflict") {
            res.status(409).json({error: "Profile has been updated by another user. Please refresh and try again."});
            return;
        }

        next(err);
    }
}

export const getProfileById: RequestHandler = async (req, res) => {
    const userId = Number(req.params.id);
    if(req.user.role === Role.CANDIDATE && req.user.id !== userId) {
        res.status(403).json({error: "Forbidden"});
        return;
    }

    const profile = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: profileSelect
    });

    if(!profile) {
        res.status(404).json({error: "Profile not found"});
        return;
    }

    const canEdit = req.user.role === Role.ADMIN || req.user.id === userId;

    res.json({profile, readOnly: !canEdit});
}

export const uploadAvatar: RequestHandler = async (req, res) => {
    const file = req.file;

    if(!file) {
        res.status(400).json({error: "No file uploaded"});
        return;
    }

    if(!extensionMap.has(file.mimetype)) {
        res.status(400).json({error: "Unsupported image format"});
        return;
    }

    const name = crypto.randomUUID();
    const extension = extensionMap.get(file.mimetype);

    const path = `${req.user.id}-${name}${extension}`;

    const {error} = await supabase.storage.from("avatars").upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
    });

    if(error) {
        res.status(500).json({error: error.message});
        return;
    }

    const {data} = supabase.storage.from("avatars").getPublicUrl(path);

    await prisma.user.update({
        where: {id: req.user.id},
        data: {photoUrl: data.publicUrl}
    });

    res.json({
        success: true,
        photoUrl: data.publicUrl,
    });
}

export const uploadImageAttribute: RequestHandler = async (req, res) => {
    const file = req.file;
    const attributeValueId = Number(req.params.attributeValueId);

    if(!file) {
        res.status(400).json({error: "No file uploaded"});
        return;
    };

    if(!extensionMap.has(file.mimetype)) {
        res.status(400).json({error: "Unsupported image format"});
        return;
    };

    const name = crypto.randomUUID();
    const extension = extensionMap.get(file.mimetype);

    const path = `${req.user.id}-${name}${extension}`;

    const {error} = await supabase.storage.from("images").upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
    })

    if(error) {
        res.status(500).json({error: error.message});
        return;
    }

    const {data} = supabase.storage.from("images").getPublicUrl(path);

    await prisma.attributeValue.updateMany({
        where: {
            id: attributeValueId,
            candidateId: req.user.id
        }, 
        data: {
            imageUrl: data.publicUrl
        }
    })

    res.json({
        success: true,
        imageUrl: data.publicUrl,
    })
}

export const addAttributes: RequestHandler = async (req, res) => {
    const {attributeIds} = req.body as SelectedAttributeDto;

    const existingAttributes = await prisma.attribute.findMany({
        where: {
            id: {
                in: attributeIds
            }
        },
        select: {
            id: true
        }
    });

    if(existingAttributes.length !== attributeIds.length) {
        res.status(400).json({success: false, error: "Some attributes do not exist"});
        return;
    }
    const existingAttributeIds = existingAttributes.map((attribute) => attribute.id);

    const alreadyAddedAttributes = await prisma.attributeValue.findMany({
        where: {
            candidateId: req.user.id,
            attributeId: {
                in: existingAttributeIds
            }
        },
        select: {
            attributeId: true
        }
    });

    const alreadyAddedAttributeIds = new Set(alreadyAddedAttributes.map((attribute) => attribute.attributeId));

    const newAttributeIds = existingAttributeIds.filter((id) => !alreadyAddedAttributeIds.has(id));

    if (newAttributeIds.length === 0) {
        return res.json({
            success: true,
            count: 0,
        });
    }

    const {count} = await prisma.attributeValue.createMany({
        data: newAttributeIds.map((attributeId) => ({
            candidateId: req.user.id,
            attributeId,
        }))
    });

    res.json({
        success: true,
        count,
    });
}

export const searchAttributes: RequestHandler = async (req, res) => {
    const search = (req.query.search as string ?? "").trim();

    const where: Prisma.AttributeWhereInput = {
        attributeValues: {
            none: {
                candidateId: req.user.id
            }
        }
    };

    if(search){
        where.name = {
            contains: search,
            mode: "insensitive"
        }
    }

    const attributes = await prisma.attribute.findMany({
        where,
        take: 10,
        orderBy: {
            name: "asc"
        }
    });

    res.json({attributes});
}

function validateLevel(rawLevel?: string) : PositionLevel | undefined {
    return Object.values(PositionLevel).includes(rawLevel as PositionLevel) ? rawLevel as PositionLevel : undefined;
}

export const getPositions: RequestHandler = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 50);
    const sort = req.query.sort?.toString()?.trim() == "asc" ? "asc" : "desc";
    const search = req.query.search?.toString().trim();
    const level = validateLevel(req.query.level?.toString()?.trim());

    const where : Prisma.PositionWhereInput = {
    }

    if(search){
        where.OR = [
            {
                title: {
                    contains: search,
                    mode: "insensitive"
                }
            },
    
            {
                description: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        ]
    }

    if(level) {
        where.level = level;
    }

    const positions = await prisma.position.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        orderBy: {
            createdAt: sort
        },
        include: {
            positionProjectTags: {
                select: {
                    projectTag: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    positionAttributes: true,
                }
            }
        }
    });

    const total = await prisma.position.count({where});

    const totalPages = Math.ceil(total / pageSize);

    res.json({positions, page, pageSize, total, totalPages, name: req.user.firstName});
}

export const getPositionById: RequestHandler = async (req, res) => {
    const positionId = Number(req.params.id);

    const position = await prisma.position.findUnique({
        where: {
            id: positionId,
        },
        include: {
            positionProjectTags: {
                select: {
                    projectTag:{
                        select: {
                            name: true
                        }
                    }
                }
            },
            positionAttributes: {
                select: {
                    attribute: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            type: true,
                            attributeOptions: true,
                        }
                    }
                }
            }
        }
    });

    if(!position) {
        res.status(404).json({error: "Position not found"});
        return;
    }

    const userAttributeValues = await prisma.attributeValue.findMany({
        where: {
            candidateId: req.user.id,
            attributeId: {
                in: position.positionAttributes.map((pa) => pa.attribute.id) ?? []
            }
        },
        include: {
            attribute: true
        }
    })

    const completedRequiredAttributes = userAttributeValues.filter((av) => isCompleted(av.attribute.type, av)).length;
    const totalRequiredAttributes = position.positionAttributes.length;
    const missingAttributes = position.positionAttributes.filter((pa) => {
        const value = userAttributeValues.find((av) => av.attributeId === pa.attribute.id);

        return !value || !isCompleted(value.attribute.type, value);
    }).map((pa => pa.attribute));

    res.json({
        position,
        completedRequiredAttributes,
        totalRequiredAttributes,
        missingAttributes
    });
}