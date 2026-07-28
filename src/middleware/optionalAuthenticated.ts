import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import prisma from "../prisma.js";
import type { Role } from "../../generated/prisma/enums.js";

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
    id: number;
    role: Role;
}

const optionalAuthenticated: RequestHandler = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization!;
        const token = authHeader.split(" ")[1]!;

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
        })

        if(user) {
            if(user.isBlocked){
                res.status(403).json({error: "User is blocked. Please contact customer support"});
                return;
            }

            req.user = user;
        }
        next();
    } catch(_) {
        next();
    } 
}

export default optionalAuthenticated;
