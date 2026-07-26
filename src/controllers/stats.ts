import  type { RequestHandler } from "express";
import prisma from "../prisma.js";
import { Role } from "../../generated/prisma/client.js";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
export const getStats: RequestHandler = async(req, res, next) => {
    const [
        totalNewCVs,
        totalPositions,
        totalCandidates,
        totalRecruiters,
        totalCVs,
    ] = await Promise.all([
        prisma.cV.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - ONE_DAY_MS),
                },
            },
        }),
        prisma.position.count(),
        prisma.user.count({
            where: { role: Role.CANDIDATE },
        }),
        prisma.user.count({
            where: { role: Role.RECRUITER },
        }),
        prisma.cV.count(),
    ]);

    res.json({totalNewCVs, totalPositions, totalCandidates, totalRecruiters, totalCVs});
}