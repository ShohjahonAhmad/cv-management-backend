import z from "zod";
import { AttributeCategory, AttributeType, Provider, Role } from "../../generated/prisma/enums.js";

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

export const AttributeSchema = z.object({
    id: z.number().int().nonnegative(),
    name: z.string().trim().min(3, "Name must be at least 3 characters long").max(50, "Name must be at most 50 characters long"),
    description: z.string().trim().max(500),
    category: z.enum(AttributeCategory),
    type: z.enum(AttributeType),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

export const CreateAttributeSchema = AttributeSchema.pick({
    name: true,
    description: true,
    category: true,
    type: true
}).strict();

export const DeleteAttributeSchema = z.object({
    attributes: z.array(SelectedSchema).min(1),
})

export type DeleteAttributesDto = z.infer<typeof DeleteAttributeSchema>;

export const UpdateAttributeSchema = AttributeSchema.pick({
    name: true,
    description: true,
    category: true,
    updatedAt: true,
}).strict();

export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;
