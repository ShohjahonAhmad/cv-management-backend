import type { RequestHandler } from "express";
import { Role } from "../../generated/prisma/enums.js";

const authorized = (role: Role): RequestHandler => {
    return  (req, res, next) => {
        if(role !== req.user.role){
            res.status(403).json({error: "Forbidden"});
            return;
        }

        next();
    };
}

export default authorized;