import type { RequestHandler } from "express";
import validateLevel from "../utils/validateLevel.js";
import type { Prisma } from "../../generated/prisma/client.js";
import prisma from "../prisma.js";
import { isCompleted } from "../utils/isCompleted.js";

export const getHomePositions: RequestHandler = async (req, res) => {
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
    const name = req.user?.firstName || "Guest";

    res.json({positions, page, pageSize, total, totalPages, name});
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

    const totalRequiredAttributes = position.positionAttributes.length;
    
    if(req.user?.id === undefined) {
        res.json({
            position,
            completedRequiredAttributes: 0,
            totalRequiredAttributes,
            missingAttributes: position.positionAttributes.map((pa) => pa.attribute)
        });
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