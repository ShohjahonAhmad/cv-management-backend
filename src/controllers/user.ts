import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import type { UpdateUserBlockDto, UpdateUserRoleDto } from "../middleware/schema.js";

export const getUsers: RequestHandler = async (req, res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 10);

    const users = await prisma.user.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
            createdAt: 'desc'
        }
    });

    const total = await prisma.user.count();

    const totalPages = Math.ceil(total / pageSize)

    res.json({users, page, pageSize, total, totalPages});
}

export const updateUserRole: RequestHandler = async (req, res, next) => {
    const { users, role } = req.body as UpdateUserRoleDto;

    const changeCount = await prisma.user.updateMany({
        data: {
            role,
        }, where: {
            OR: users.map((user) => ({
                id: user.id,
                updatedAt: user.updatedAt
            }))
        }
    })

    const conflicts = users.length - changeCount.count;

    const message =
        conflicts === 0
            ? `All ${changeCount.count} users were updated successfully.`
            : `${changeCount.count} of ${users.length} users were updated successfully. ${conflicts} users were skipped because they had been modified by another administrator.`;

    res.json({ message });
}

export const updateUserBlock: RequestHandler = async (req, res, next) => {
    const {users, isBlocked } = req.body as UpdateUserBlockDto;

    const changeCount = await prisma.user.updateMany({
        data: {
            isBlocked,
        }, where: {
            OR: users.map((user) => ({
                id: user.id,
                updatedAt: user.updatedAt,
            }))
        }
    })

    const conflicts = users.length - changeCount.count;

    const message =
        conflicts === 0
            ? `All ${changeCount.count} users were updated successfully.`
            : `${changeCount.count} of ${users.length} users were updated successfully. ${conflicts} users were skipped because they had been modified by another administrator.`;

    res.json({ message });
}