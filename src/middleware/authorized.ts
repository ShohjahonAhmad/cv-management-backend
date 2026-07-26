import type { RequestHandler } from "express";
import { Role } from "../../generated/prisma/enums.js";

const authorized = (roles: Role[]): RequestHandler => {
    return  (req, res, next) => {
        if(!roles.includes(req.user.role)){
            res.status(403).json({error: "Forbidden"});
            return;
        }

        next();
    };
}

export default authorized;