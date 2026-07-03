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

const authenticated: RequestHandler = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization!;
        const token = authHeader.split(" ")[1]!;

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        })

        if(!user) {
            console.log("salom")
            res.status(401).json({error: "User doesn't exist"});
            return;
        }

        if(user.isBlocked){
            console.log("salom")
            res.status(401).json({error: "User is blocked. Please contact customer support"});
            return;
        }

        req.user = user;

        next();
    } catch(err) {
        console.log(err)
        res.status(401).json({error: "Unauthenticated"})
    }
}

export default authenticated
