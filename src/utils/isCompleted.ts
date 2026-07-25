import { AttributeType, type AttributeValue } from "../../generated/prisma/client.js"

export function isCompleted (type : AttributeType, attributeValue: AttributeValue) {
    switch(type) {
        case AttributeType.STRING:
            return attributeValue.stringValue != null
        case AttributeType.NUMBER:
            return attributeValue.numericValue != null
        case AttributeType.BOOLEAN:
            return attributeValue.booleanValue != null
        case AttributeType.SELECT:
            return attributeValue.optionId != null
        case AttributeType.DATE:    
            return attributeValue.dateValue != null
        case AttributeType.PERIOD:
            return attributeValue.periodStart != null && attributeValue.periodEnd != null
        case AttributeType.TEXT:
            return attributeValue.textValue != null;
        case AttributeType.IMAGE:
            return attributeValue.imageUrl != null;
    }
}