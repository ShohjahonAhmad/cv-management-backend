import type {RequestHandler} from "express";
import prisma from "../prisma.js";
import { AttributeCategory, AttributeType, Prisma } from "../../generated/prisma/client.js";
import type { DeleteAttributesDto} from "../middleware/schema.js";

export const getAttributes: RequestHandler = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 10);
    const filter = req.query.filter?.toString() ;
    const search = req.query.search?.toString() ;

    const where: Prisma.AttributeWhereInput = {};

    if (search) {
        where.name = {
            startsWith: search,
            mode: "insensitive",
        };
    }

    if (filter) {
        where.category = filter as AttributeCategory;
    }

    const attributes = await prisma.attribute.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
            updatedAt: "desc"
        },
        where,
        include: {
            attributeOptions: {
                orderBy: {
                    order: 'asc'
                }
            }
        }
    })

    const total = await prisma.attribute.count({where});

    const totalPages = Math.ceil(total / pageSize);

    res.json({attributes, page, pageSize, total, totalPages});
}

export const createAttribute: RequestHandler = async (req, res) => {
    try {
        const {name, description, category, type, attributeOptions} = req.body;
        const data: Prisma.AttributeCreateInput = {
            name, 
            description,
            category,
            type,
        }

        if(type === AttributeType.SELECT) {
            data.attributeOptions = {
                create: attributeOptions.map((value:string, index: number) => ({
                    value,
                    order: index,
                })),
            };
        }

        const attribute = await prisma.attribute.create({data, include: {attributeOptions: true}});

        res.status(201).json({attribute, message: "Attribute created successfully"});
    } catch (err) {
        console.error(err);
        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code === "P2002"){
                res.status(409).json({error: "Attribute with this name already exists"});
                return;
            }
        }

        res.status(500).json({error: "Internal server error"});
    }
}

export const deleteAttribute: RequestHandler = async (req, res) => {
    const {attributes} = req.body as DeleteAttributesDto;

    const changeCount = await prisma.attribute.deleteMany({
        where: {
            OR: attributes.map((attribute) => ({
                id: attribute.id,
                updatedAt: attribute.updatedAt
            }))
        }
    })

    const conflicts = attributes.length - changeCount.count;

    const message = conflicts === 0
        ? `All ${changeCount.count} attributes were deleted successfully.`
        : `${changeCount.count} of ${attributes.length} attributes were deleted successfully. ${conflicts} attributes were skipped because they had been modified by another administrator.`;

    res.json({message, conflicts, changeCount: changeCount.count, count: attributes.length});
}

export const updateAttribute: RequestHandler = async (req, res) => {
    try {
        const { updatedAt, attributeOptions, ...data } = req.body;
        const id = Number(req.params.id);

        await prisma.$transaction(async (tx) => {
            const result = await tx.attribute.updateMany({
                where: {
                    id,
                    updatedAt,
                },
                data,
            });

            if (result.count === 0) {
                throw new Error("CONFLICT");
            }

            if (attributeOptions) {
                const existingOptions = await tx.attributeOption.findMany({
                    where: {
                        attributeId: id,
                    },
                    select: {
                        id: true,
                    },
                });

                const existingIds = existingOptions.map(option => option.id);
                const incomingIds = attributeOptions
                    .filter((option: any) => option.id !== undefined)
                    .map((option: any) => option.id);

                await tx.attributeOption.deleteMany({
                    where: {
                        id: {
                            in: existingIds.filter(
                                existingId => !incomingIds.includes(existingId)
                            ),
                        },
                    },
                });

                for (let i = 0; i < attributeOptions.length; i++) {
                    const option = attributeOptions[i];

                    if (option.id) {
                        await tx.attributeOption.update({
                            where: {
                                id: option.id,
                            },
                            data: {
                                value: option.value,
                                order: i,
                            },
                        });
                    } else {
                        await tx.attributeOption.create({
                            data: {
                                attributeId: id,
                                value: option.value,
                                order: i,
                            },
                        });
                    }
                }
            }
        });

        res.json({
            message: "Attribute updated successfully",
        });

    } catch (err) {
        if (err instanceof Error && err.message === "CONFLICT") {
            return res.status(409).json({
                error: "The attribute was modified by another user before your changes could be saved.",
            });
        }

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") {
                return res.status(409).json({
                    error: "Attribute with this name already exists.",
                });
            }
        }

        console.error(err);

        res.status(500).json({
            error: "Internal server error",
        });
    }
};