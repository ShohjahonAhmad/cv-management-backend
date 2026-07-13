import z from "zod";
import { AttributeCategory, AttributeType, PositionLevel, Provider, Role } from "../../generated/prisma/enums.js";
import { title } from "node:process";
import { de } from "zod/locales";
import { create } from "node:domain";

export const UserSchema = z.object({
    id: z.number().int().nonnegative(),
    email: z.email(),
    firstName: z.string(),
    lastName: z.string(),
    location: z.string().optional(),
    photoUrl: z.string().optional(),
    role: z.enum(Role),
    provider: z.enum(Provider),
    providerUserId: z.string(),
    isBlocked: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const SelectedSchema = z.object({
    id: z.number().int().positive(),
    updatedAt: z.coerce.date(),
});

export const UpdateUserRoleSchema = z.object({
    role: z.enum(Role),
    users: z.array(SelectedSchema).min(1),
});

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;

export const UpdateUserBlockSchema = z.object({
    isBlocked: z.boolean(),
    users: z.array(SelectedSchema).min(1),
});

export type UpdateUserBlockDto = z.infer<typeof UpdateUserBlockSchema>

export const AttributeOptionSchema = z.object({
    id: z.number().int().nonnegative("ID must be a non-negative integer").optional(),
    value: z.string().trim().min(1, "Option must be at least 1 character long").max(100, "Option must be at most 100 characters long"),
})

export type AttributeOption = z.infer<typeof AttributeOptionSchema>

export const AttributeSchema = z.object({
    id: z.number().int().nonnegative(),
    name: z.string().trim().min(3, "Name must be at least 3 characters long").max(50, "Name must be at most 50 characters long"),
    description: z.string().trim().max(500),
    category: z.enum(AttributeCategory),
    type: z.enum(AttributeType),
    attributeOptions: z.array(AttributeOptionSchema).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

export const CreateAttributeSchema = AttributeSchema.pick({
    name: true,
    description: true,
    category: true,
    type: true,
    attributeOptions: true,
}).strict().superRefine((data, ctx) => {
    if(data.type === AttributeType.SELECT) {
        if(!data.attributeOptions || data.attributeOptions.length === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["options"],
                message: "Select attributes require at least one option."
            })
        }
    } else if(data.attributeOptions && data.attributeOptions.length > 0) {
        ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "Only Select attribute may have options."
        })
    }
});

export const DeleteAttributeSchema = z.object({
    attributes: z.array(SelectedSchema).min(1),
})

export type DeleteAttributesDto = z.infer<typeof DeleteAttributeSchema>;

export const UpdateAttributeSchema = AttributeSchema.pick({
    name: true,
    description: true,
    category: true,
    updatedAt: true,
    attributeOptions: true,
    type: true
}).strict().superRefine((data, ctx) => {
    if(data.type === AttributeType.SELECT) {
        if(!data.attributeOptions || data.attributeOptions.length === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["options"],
                message: "Select attributes require at least one option."
            })
        }
    } else if(data.attributeOptions && data.attributeOptions.length > 0) {
        ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "Only Select attribute may have options."
        })
    }
});;

export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;

export const PositionSchema = z.object({
    id: z.number().int().nonnegative(),
    title: z.string().trim().min(3, "Title must be at least 3 characters long").max(100, "Title must be at most 100 characters long"),
    description: z.string().trim().max(1000, "Description must be at most 1000 characters long").nullable().default(null),
    company: z.string().trim().min(1, "Company is required").max(100, "Company must be at most 100 characters long"),
    level: z.enum(PositionLevel),
    maxProjects: z.coerce.number().int().min(1, "Maximum projects must be at least 1").default(3),
    attributeIds: z.array(z.number().int().positive()).default([]).refine(ids => new Set(ids).size === ids.length, "Duplicate attributes are not allowed"),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const CreatePositionSchema = PositionSchema.pick({
    title: true,
    description: true,
    company: true,
    level: true,
    maxProjects: true,
    attributeIds: true,
}).strict();

export type CreatePositionDto = z.infer<typeof CreatePositionSchema>;

export const UpdatePositionSchema = PositionSchema.pick({
    title: true,
    description: true,
    company: true,
    level: true,
    maxProjects: true,
    attributeIds: true,
    updatedAt: true
}).strict();

export type UpdatePositionDto = z.infer<typeof UpdatePositionSchema>;

export const DeletePositionsSchema = z.object({
    positions: z.array(SelectedSchema).min(1),
})

export type DeletePositionsDto = z.infer<typeof DeletePositionsSchema>;