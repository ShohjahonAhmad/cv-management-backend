import { AttributeType, type Attribute, type AttributeValue } from "../../generated/prisma/client.js";

export default function hasValue(value: AttributeValue & {attribute: Attribute}): boolean {
    switch(value.attribute.type) {
        case AttributeType.STRING:
            return value.stringValue !== null && value.stringValue.trim() !== "";
        case AttributeType.NUMBER:
            return value.numericValue !== null;
        case AttributeType.SELECT:
            return value.optionId !== null;
        case AttributeType.BOOLEAN:
            return value.booleanValue !== null;
        case AttributeType.DATE:
            return value.dateValue !== null;
        case AttributeType.PERIOD:
            return value.periodStart !== null && value.periodEnd !== null;
        case AttributeType.TEXT:
            return value.textValue !== null && value.textValue.trim() !== "";
        case AttributeType.IMAGE:
            return value.imageUrl !== null && value.imageUrl.trim() !== "";
        default:
            throw new Error(`Unsupported attribute type: ${value.attribute.type}`);
    }
}