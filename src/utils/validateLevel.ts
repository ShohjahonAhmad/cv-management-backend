import { PositionLevel } from "../../generated/prisma/client.js";

export default function validateLevel(rawLevel?: string) : PositionLevel | undefined {
    return Object.values(PositionLevel).includes(rawLevel as PositionLevel) ? rawLevel as PositionLevel : undefined;
}