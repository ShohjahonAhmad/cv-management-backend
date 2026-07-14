import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import type { ProjectTagWhereInput } from "../../generated/prisma/models.js";

export const getTags: RequestHandler = async (req, res) => {
    const search = req.query.search?.toString() || "";

    const where: ProjectTagWhereInput = {};

    if(search) {
        where.name = {
            startsWith: search,
            mode: "insensitive"
        }
    }

    const tags = await prisma.projectTag.findMany({
        where,
        take: 20
    });

    res.json({tags})
}