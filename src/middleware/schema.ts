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
    attributeIds: z.array(z.coerce.number().int().positive()).default([]).refine(ids => new Set(ids).size === ids.length, "Duplicate attributes are not allowed"),
    tags: z.array(z.string().trim().min(1, "Tag must be at least 1 character long").max(50, "Tag must be at most 50 characters long")).default([]).refine(tags => new Set(tags.map(tag => tag.toLowerCase())).size === tags.length, "Duplicate project tags are not allowed"),
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
    tags: true
}).strict();

export type CreatePositionDto = z.infer<typeof CreatePositionSchema>;

export const UpdatePositionSchema = PositionSchema.pick({
    title: true,
    description: true,
    company: true,
    level: true,
    maxProjects: true,
    attributeIds: true,
    tags: true,
    updatedAt: true
}).strict();

export type UpdatePositionDto = z.infer<typeof UpdatePositionSchema>;

export const DeletePositionsSchema = z.object({
    positions: z.array(SelectedSchema).min(1),
})

export type DeletePositionsDto = z.infer<typeof DeletePositionsSchema>;

const StringAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("STRING"),
    value: z.string().trim().min(1, "Value must be at least 1 character long").max(50, "Value must be at most 50 characters long"),
});

const NumberAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("NUMBER"),
    value: z.coerce.number(),
});

const BooleanAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("BOOLEAN"),
    value: z.boolean(),
});

const TextAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("TEXT"),
    value: z.string().trim().min(1, "Value must be at least 1 character long").max(500, "Value must be at most 500 characters long"),
});

const ImageAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("IMAGE"),
    value: z.url("Image must be a valid URL"),
});

const DateAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("DATE"),
    value: z.coerce.date(),
});

const PeriodAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("PERIOD"),
    value: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
    }).refine(({startDate, endDate}) => startDate <= endDate,
        {
            message: "End date must be after start date",
            path: ["endDate"],
        }
     ),
});

const SelectAttribute = z.object({
    attributeId: z.number().int().positive(),
    type: z.literal("SELECT"),
    value: z.coerce.number().int().positive(),
})

const AttributeValueSchema = z.discriminatedUnion("type", [
    StringAttribute,
    NumberAttribute,
    TextAttribute,
    BooleanAttribute,
    ImageAttribute,
    DateAttribute,
    PeriodAttribute,
    SelectAttribute
])

export const ProfileSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    phone: z.string().trim().max(30, "Phone number must be at most 30 characters").nullable().default(null),
    location: z.string().nullable().default(null),
    photoUrl: z.string().nullable().default(null),
    headline: z.string().trim().max(100, "Headline must be at most 100 characters").nullable().default(null),
    aboutMe: z.string().trim().max(2000, "About Me must be at most 2000 characters").nullable().default(null),

    attributeValues: z.array(AttributeValueSchema).refine(values => new Set(values.map(v => v.attributeId)).size === values.length, {
        "message": "Duplicate attribute values are not allowed",
    })
})

export type ProfileDto = z.infer<typeof ProfileSchema>;