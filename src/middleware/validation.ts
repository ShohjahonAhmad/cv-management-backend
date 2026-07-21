import type { RequestHandler } from "express";
import z from "zod";
import { CreateAttributeSchema, CreatePositionSchema, CVSchema, DeleteAttributeSchema, DeletePositionsSchema, ProfileSchema, SelectedAttributeSchema, UpdateAttributeSchema, UpdatePositionSchema, UpdateUserBlockSchema, UpdateUserRoleSchema } from "./schema.js";

export const validateReqUser: RequestHandler = (req, res, next) => {
    if(!req.user){
        res.status(401).json({
            message: "Authentication required."
        });
        return;
    }

    next();
}

export const validatePositionId: RequestHandler = (req, res, next) => {
    const result = z.number().int().positive().safeParse(Number(req.params.positionId));

    if(!result.success) {
        res.status(400).json({error: result.error.issues.map(e => e.message).join(", ")});
        return;
    }

    next();
}

export const validateId: RequestHandler = (req, res, next) => {
    const result = z.number().int().positive().safeParse(Number(req.params.id));

    if(!result.success) {
        res.status(400).json({error: result.error.issues.map(e => e.message).join(", ")});
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
export const UpdateProfile = validateBody(ProfileSchema);
export const AddAttribute = validateBody(SelectedAttributeSchema);
export const UpdateCV = validateBody(CVSchema);