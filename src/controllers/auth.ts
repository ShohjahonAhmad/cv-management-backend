import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import type { User } from "../../generated/prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL;

export const authCallback: RequestHandler = async (req, res) => {
    const user = req.user as User;

    const token = jwt.sign({
        id: user.id,
        role: user.role,
    }, JWT_SECRET, {expiresIn: "24h"})

    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
}


export const getMe: RequestHandler = async (req, res) => {
    const me = await prisma.user.findUnique({where: {id: req.user.id}});

    res.json(me)///
}