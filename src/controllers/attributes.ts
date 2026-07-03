import type {RequestHandler} from "express";
import prisma from "../prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { DeleteAttributesDto, UpdateAttributeDto } from "../middleware/schema.js";

export const getAttributes: RequestHandler = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 10);
    const search = req.query.search?.toString() ;
    const where = {
        ...(search && {
            name: {
                startsWith: search,
                mode: "insensitive" as const
            }
        })
    }

    const attributes = await prisma.attribute.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
            updatedAt: "desc"
        },
        where
    })

    const total = await prisma.attribute.count({where});

    const totalPages = Math.ceil(total / pageSize);

    res.json({attributes, page, pageSize, total, totalPages});
}

export const createAttribute: RequestHandler = async (req, res) => {
    try {
        const {name, description, category, type} = req.body;

        const attribute = await prisma.attribute.create({
            data: {
                name,
                description,
                category,
                type
            }
        })

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
        const {updatedAt, ...data} = req.body;
        const id = Number(req.params.id as string);
        
        const result = await prisma.attribute.updateMany({
            data,
            where: {
                id,
                updatedAt
            }
        })

        if(result.count === 0) {
            return res.status(409).json({
                error: "The attribute was modified by another user before your changes could be saved."
            });
        }

        res.json({message: "Attribute updated successfully"});
    } catch(err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if(err.code === "P2002"){
                res.status(409).json({
                    error: "Attribute with this name already exists."
                })
            }
        }

        res.status(500).json({error: "Internal server error"});
    }
}