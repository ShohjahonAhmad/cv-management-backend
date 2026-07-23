import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import type { DeleteUserDto, UpdateUserBlockDto, UpdateUserRoleDto } from "../middleware/schema.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const getUsers: RequestHandler = async (req, res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.take) || 10);
    const search = req.query.search?.toString().trim();
    const tsQuery = search?.split(/\s+/).join(" | ");

    const where : Prisma.UserWhereInput = {}

    if(tsQuery) {
        where.OR =[
            {
                firstName: { search: tsQuery }
            }, 
            {
                lastName: { search: tsQuery }
            }, 
            {
                email: { search: tsQuery }
            }
        ]
    }

    const users = await prisma.user.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where,
        orderBy: {
            createdAt: 'desc'
        }
    });

    const total = await prisma.user.count({where});

    const totalPages = Math.ceil(total / pageSize)

    res.json({users, page, pageSize, total, totalPages});
}

export const updateUserRole: RequestHandler = async (req, res, next) => {
    const { users, role } = req.body as UpdateUserRoleDto;

    const change = await prisma.user.updateMany({
        data: {
            role,
        }, where: {
            OR: users.map((user) => ({
                id: user.id,
                updatedAt: user.updatedAt
            }))
        }
    })
    const conflicts = users.length - change.count;

    res.json({ conflicts, changeCount: change.count, count: users.length });
}

export const updateUserBlock: RequestHandler = async (req, res, next) => {
    const {users, isBlocked } = req.body as UpdateUserBlockDto;

    const change = await prisma.user.updateMany({
        data: {
            isBlocked,
        }, where: {
            OR: users.map((user) => ({
                id: user.id,
                updatedAt: user.updatedAt,
            }))
        }
    })
    const conflicts = users.length - change.count;

    res.json({ conflicts, changeCount: change.count, count: users.length });
}

export const deleteUsers: RequestHandler = async (req, res, next) => {
    const {users} = req.body as DeleteUserDto;

    const change = await prisma.user.deleteMany({
        where: {
            OR: users.map((user) => ({
                id: user.id,
                updatedAt: user.updatedAt,
            }))
        }
    })
    const conflicts = users.length - change.count;

    res.json({ conflicts, changeCount: change.count, count: users.length });
}