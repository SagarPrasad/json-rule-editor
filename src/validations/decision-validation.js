export const validateOutcome = (outcome) => {
    const error = {};

    if (!outcome.value) {
        error.value = 'Please specify the outcome value';
    }

    return error;
};

const isEmpty = (val) => {
    return !val || !val.trim();
};

const fieldValidationByType = (value, type, operator) => {
    switch(type) {
        case 'equality':
            return ["equals", "not_equals"].includes(operator);
        case 'numeric':
            return ["less_than", "less_than_equals", "greater_than", "greater_than_equals", "between"].includes(operator);
        case 'string':
            if (["empty", "not_empty"].includes(operator)) return true;
            return ["empty", "not_empty", "starts_with", "ends_with", "matches"].includes(operator);
        case 'meta':
            return ["exists", "not_exists"].includes(operator);
        case 'joiner':
            return ["and", "or", "not"].includes(operator);
        case 'collection':
            return ["contains_any", "contains_all", "in", "not_in"].includes(operator);
        default:
            return true;
    }
};

export const validateAttribute = (attribute, attributes) => {
    const error = {};
    if (isEmpty(attribute.operator)) {
        error.operator = 'Please specify the operator type';
    }
    if (!["empty", "not_empty"].includes(attribute.operator)) {
        if (isEmpty(attribute.value)) {
            error.value = 'Please specify the attribute value';
        } else {
            if (attribute.name) {
                const attProps = attributes.find(att => att.name === attribute.name);
                if (attProps && attProps.type) {
                    if (!fieldValidationByType(attribute.value, attProps.type, attribute.operator)) {
                        error.value = 'Please specify the valid attribute value';
                    }
                }
            }
        }
    }

    if (isEmpty(attribute.name)) {
        error.name = 'Please specify the attribute name';
    }

    return error;
};



export default function decisionValidations(node = {}, outcome) {
    const error = { node: {}, outcome: {} };
    error.outcome = validateOutcome(outcome);
    const validCase = node.children && node.children.length > 0;

    if (!validCase) {
        error.formError = 'Please specify at least one condition';
    } else if (Object.keys(error.outcome).length > 0) {
        error.formError = 'Please specify valid output values';
    }
    return error;
}
