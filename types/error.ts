export default class BaseError extends Error {
    errorCode: number;
    constructor(message: string, errorCode: number = 400) {
        super(message);
        this.name = "BaseError";
        this.errorCode = errorCode;
    }
}
