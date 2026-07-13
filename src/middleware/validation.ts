import type { RequestHandler } from "express";
import type z from "zod";
import { CreateAttributeSchema, CreatePositionSchema, DeleteAttributeSchema, DeletePositionsSchema, UpdateAttributeSchema, UpdatePositionSchema, UpdateUserBlockSchema, UpdateUserRoleSchema } from "./schema.js";

export const validateReqUser: RequestHandler = (req, res, next) => {
    if(!req.user){
        res.status(401).json({
            message: "Authentication required."
        });
        return;
    }

    next();
}

const validateBody = (schema: z.ZodType<any>): RequestHandler => (req, res, next) =>{
    const result = schema.safeParse(req.body);
    console.log(result);
    if(!result.success) {
        res.status(400).json({error: result.error.issues.map(e => e.message).join(", ")});
        return;
    }

    req.body = result.data;

    next()
}

export const UpdateUsersRole = validateBody(UpdateUserRoleSchema);
export const UpdateUsersBlock = validateBody(UpdateUserBlockSchema);
export const CreateAttribute = validateBody(CreateAttributeSchema);
export const DeleteAttribute = validateBody(DeleteAttributeSchema);
export const UpdateAttribute = validateBody(UpdateAttributeSchema);
export const CreatePosition = validateBody(CreatePositionSchema);
export const UpdatePosition = validateBody(UpdatePositionSchema);
export const DeletePositions = validateBody(DeletePositionsSchema);