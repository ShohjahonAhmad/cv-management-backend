import { AttributeType, type Prisma } from "../../generated/prisma/client.js"
import type { AttributeValueDto } from "../middleware/schema.js"

export default function getValue(value: AttributeValueDto) : Prisma.AttributeValueUpdateInput {
    switch(value.type) {
        case AttributeType.STRING: 
            return {stringValue: value.value}
        case AttributeType.NUMBER:
            return {numericValue: value.value}
        case AttributeType.SELECT:{
            if(value.value === null) {
                return {option: {disconnect: true}}
            }

            return {option: {connect: {id: value.value}}}
        }
        case AttributeType.BOOLEAN:
            return {booleanValue: value.value}
        case AttributeType.DATE: {
            if(value.value === null) {
                return {dateValue: null}
            }

            const date = new Date(value.value);
            date.setHours(12, 0, 0, 0);

            return {
                dateValue: date
            }
        }
        case AttributeType.PERIOD: {
            if(!value.value || !value.value.startDate || !value.value.endDate){
                return {periodStart: null, periodEnd: null}
            }
            const periodStart = new Date(value.value.startDate);
            const periodEnd = new Date(value.value.endDate);
            periodStart.setHours(12, 0, 0, 0);
            periodEnd.setHours(12, 0, 0, 0);

            return {periodEnd, periodStart}
        }
        case AttributeType.TEXT:
            return {textValue: value.value}
        case AttributeType.IMAGE:
            return {imageUrl: value.value}
        default: 
            throw new Error(`Unsupported attribute type: ${value}`);
    }
}
