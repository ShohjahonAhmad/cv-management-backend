import type { RequestHandler } from "express";

const validateReqUser: RequestHandler = (req, res, next) => {
    if(!req.user){
        res.status(401).json({
            message: "Authentication required."
        });
        return;
    }

    next();
}

export default validateReqUser;