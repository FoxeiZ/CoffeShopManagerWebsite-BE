function checkEmptyFields(requiredFields: string[], source: any) {
    if (!source) {
        return true;
    }

    if (requiredFields.some((field) => !(field in source))) {
        return true;
    }

    return false;
}

export { checkEmptyFields };
