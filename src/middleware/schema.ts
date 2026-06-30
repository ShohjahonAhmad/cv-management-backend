import z from "zod";
import { Provider, Role } from "../../generated/prisma/enums.js";

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

export const SelectedUserSchema = z.object({
    id: z.number().int().positive(),
    updatedAt: z.coerce.date(),
});

export const UpdateUserRoleSchema = z.object({
    role: z.enum(Role),
    users: z.array(SelectedUserSchema).min(1),
});

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;

export const UpdateUserBlockSchema = z.object({
    isBlocked: z.boolean(),
    users: z.array(SelectedUserSchema).min(1),
});

export type UpdateUserBlockDto = z.infer<typeof UpdateUserBlockSchema>

