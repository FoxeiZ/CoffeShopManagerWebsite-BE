import { Response } from "express";
import BaseError from "../types/error";

function handleError(err: BaseError | Error | any, res?: Response) {
    const cb = res
        ? (err: any) =>
              res
                  .status(err.errorCode)
                  .json({ result: "error", message: err.message })
        : console.log;
    cb(err);
}

export { handleError };
