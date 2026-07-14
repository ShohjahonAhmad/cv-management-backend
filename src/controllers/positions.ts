import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { CreatePositionDto, DeletePositionsDto, UpdatePositionDto } from "../middleware/schema.js";

export const getPositions: RequestHandler = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 1);
    const search = req.query.search?.toString();

    const where: Prisma.PositionWhereInput = {};

    if(search) {
        where.title = {
            startsWith: search,
            mode: "insensitive"
        }
    }

    const positions = await prisma.position.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        orderBy: {
            updatedAt: "desc"
        },
        include: {
            positionAttributes: {
                select: {
                    attribute: true
                },
                orderBy: {
                    order: 'asc'
                }
            },
            positionProjectTags: {
                select: {
                    projectTag: true
                }
            }
        }
    });

    const total = await prisma.position.count({where});

    const totalPages = Math.ceil(total / pageSize);

    res.json({positions, page, pageSize, total, totalPages});
}

export const createPosition: RequestHandler = async (req, res) => {
    const {title, description, company, level, maxProjects, attributeIds, tags} = req.body as CreatePositionDto;

    const position = await prisma.position.create({
        data: {
            title,
            description,
            company,
            level,
            maxProjects,
            positionAttributes: {
                create: attributeIds.map((attributeId: number, index: number) => ({
                    attributeId,
                    order: index,
                }))
            },
            positionProjectTags: {
                create: tags.map((tag: string) => ({
                    projectTag: {
                        connectOrCreate: {
                            where: {name: tag},
                            create: {name: tag}
                        }
                    }
                }))

            }
        }
    })

    res.status(201).json({position, message: "Position created successfully"});
}

export const updatePosition: RequestHandler = async (req, res) => {
    const {tags, attributeIds, updatedAt, ...data} = req.body as UpdatePositionDto;
    const id = Number(req.params.id);

    const count = await prisma.$transaction(async (tx) => {
        const change = await tx.position.updateMany({
            where: {id, updatedAt},
            data,
        });

        if(change.count === 0) return 0;

        await tx.positionAttribute.deleteMany({
            where: {positionId: id},
        })


        await tx.positionAttribute.createMany({
            data: attributeIds.map((attributeId: number, index: number) => ({
                positionId: id,
                attributeId,
                order: index,
            }))
        })

        await tx.positionProjectTag.deleteMany({
            where: {positionId: id},
        })

        if(tags.length === 0) return change.count;

        await tx.projectTag.createMany({
            data: tags.map((tag: string) => ({name: tag})),
            skipDuplicates: true
        });

        const projectTags = await tx.projectTag.findMany({
            where: {
                name: {in: tags}
            },
            select: {id: true}
        });

        await tx.positionProjectTag.createMany({
            data: projectTags.map(tag => ({
                positionId: id,
                projectTagId: tag.id
            }))
        });

        return change.count;
    });

    res.json({
            changeCount: count,  
            message: 
                count === 1
                    ? "Position updated successfully"
                    : "Position was modified by another recruiter"
        });
}

export const deletePosition: RequestHandler = async (req, res) => {
    const {positions} = req.body as DeletePositionsDto;

    const change = await prisma.position.deleteMany({
        where: {
            OR: positions.map((position) => {
                return {
                    id: position.id,
                    updatedAt: position.updatedAt
                }
            })
        }
    });

    const conflicts = positions.length - change.count;

    const message  = conflicts === 0 ?
        `Successfully deleted ${change.count} position${change.count === 1 ? "" : "s"}.` :
        `${change.count} of ${positions.length} positions were deleted successfully. ${conflicts} position${conflicts === 1 ? "" : "s"} were skipped because they had been modified by another recruiter.`;
    
    res.json({message, conflicts, changeCount: change.count, count: positions.length}); 
}

export const duplicatePosition: RequestHandler = async (req, res) => {
    const id = Number(req.params.id);

    const position = await prisma.position.findUnique({
        where: {id},
        include: {
            positionAttributes: true,
            positionProjectTags: true,
        }
    });

    if(!position) {
        res.status(404).json({message: "Position not found"});
        return;
    }

    const duplicatedPosition = await prisma.position.create({
        data: {
            title: `${position.title} (Copy)`,
            description: position.description,
            company: position.company,
            level: position.level,
            maxProjects: position.maxProjects,
            positionAttributes: {
                create: position.positionAttributes.map((positionAttribute) => ({
                    attributeId: positionAttribute.attributeId,
                    order: positionAttribute.order,
                })),
            },
            positionProjectTags: {
                create: position.positionProjectTags.map((positionProjectTag) => ({
                    projectTag: {
                        connect: {id: positionProjectTag.projectTagId},
                    },
                })),
            }
        }
    });

    res.status(201).json({position: duplicatedPosition, message: "Position duplicated successfully"});
}