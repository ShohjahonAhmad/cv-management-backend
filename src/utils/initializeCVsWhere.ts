import { CVStatus, type Prisma, Role } from "../../generated/prisma/client.js";

export default function initializeCVsWhere(role: Role, id: number): Prisma.CVWhereInput {
    const where: Prisma.CVWhereInput = {};

    switch(role) {
        case Role.CANDIDATE:
            where.candidateId = id;
            break;

        case Role.RECRUITER:
        case Role.ADMIN: 
            where.status = CVStatus.PUBLISHED;
            break;
        
        default: 
            throw new Error("Invalid user role");
    }

    return where;
}