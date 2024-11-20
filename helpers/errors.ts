import { Response } from "express";
import BaseError from "../types/error";

function handleError(err: BaseError | Error | any, res?: Response) {
    const cb = res
        ? (err: any) => {
              if (err instanceof BaseError) {
                  res.status(err.errorCode).json({
                      result: "error",
                      message: err.message,
                  });
              } else if (err instanceof Error) {
                  res.status(500).json({
                      result: "error",
                      message: err.message,
                  });
              } else {
                  res.status(500).json({
                      result: "error",
                      message: "An error occurred",
                  });
              }
          }
        : console.log;
    cb(err);
}

export { handleError };
