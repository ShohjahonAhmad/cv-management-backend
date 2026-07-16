import type { RequestHandler } from "express";
import prisma from "../prisma.js";
import type { ProfileDto } from "../middleware/schema.js";
import supabase from "../config/supabase.js";
import { extensionMap } from "../middleware/multer.js";
import { id } from "zod/locales";

export const getProfile: RequestHandler = async (req, res) => {
    const profile = await prisma.user.findUnique({
        where: {
            id: req.user.id
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            headline: true,
            aboutMe: true,
            email: true,
            phone: true,
            location: true,
            photoUrl: true,
            attributeValues: {
                orderBy: {
                    attribute: {
                        name: 'asc'
                    }
                },
                include: {
                    attribute:{
                        include: {
                            attributeOptions: true,
                        },
                    },
                    option: true,
                }
            }
        }
    })

    res.json({profile})
}

export const updateProfile: RequestHandler = async (req, res) => {
    const {id} = req.user;
    const { attributeValues, ...data } = req.body as ProfileDto;

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            data,
            where: {id}
        });

        await tx.attributeValue.deleteMany({
            where: {
                candidateId: id
            }
        });

        await tx.attributeValue.createMany({
            data: attributeValues.map((attribute) => {
                const { attributeId } = attribute;
                const attributeValue = {
                    candidateId: id,
                    attributeId,
                }
                switch(attribute.type) {
                    case "STRING":
                        return {
                            ...attributeValue,
                            stringValue: attribute.value,
                        }
                    case "NUMBER": 
                        return {
                            ...attributeValue,
                            numericValue: attribute.value,
                        }
                    case "BOOLEAN":
                        return {
                            ...attributeValue,
                            booleanValue: attribute.value,
                        }
                    case "SELECT":
                        return {
                            ...attributeValue,
                            optionId: attribute.value,
                        }
                    case "DATE":
                        return {
                            ...attributeValue,
                            dateValue: attribute.value,
                        }
                    case "PERIOD":
                        return {
                            ...attributeValue,
                            periodStart: attribute.value.startDate,
                            periodEnd: attribute.value.endDate,
                        }
                    case "TEXT":
                        return {
                            ...attributeValue,
                            textValue: attribute.value,
                        }
                    case "IMAGE": 
                        return {
                            ...attributeValue,
                            imageUrl: attribute.value,
                        }
                    default:
                        throw new Error(`Unsupported attribute type: ${attribute}`);
                }
            })
        })
    });

    res.json({message: "Profile updated successfully"});
}

export const uploadAvatar: RequestHandler = async (req, res) => {
    const file = req.file;

    if(!file) {
        res.status(400).json({error: "No file uploaded"});
        return;
    }

    if(!extensionMap.has(file.mimetype)) {
        res.status(400).json({error: "Unsupported image format"});
        return;
    }

    const name = crypto.randomUUID();
    const extension = extensionMap.get(file.mimetype);

    const path = `${req.user.id}-${name}${extension}`;

    const {error} = await supabase.storage.from("avatars").upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
    });

    if(error) {
        res.status(500).json({error: error.message});
        return;
    }

    const {data} = supabase.storage.from("avatars").getPublicUrl(path);

    await prisma.user.update({
        where: {id: req.user.id},
        data: {photoUrl: data.publicUrl}
    });

    res.json({
        success: true,
        photoUrl: data.publicUrl,
    });
}