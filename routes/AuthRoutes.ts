import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";

import AccountModel from "../models/AccountModel";

const AuthRouter = Router();

class BaseAuthError extends Error {
    errorCode: number;
    constructor(message: string, errorCode: number = 400) {
        super(message);
        this.name = "BaseAuthError";
        this.errorCode = errorCode;
    }
}

function handleError(err: BaseAuthError | Error | any, res?: Response) {
    const cb = res
        ? (err: any) =>
              res
                  .status(err.errorCode)
                  .json({ result: "error", message: err.message })
        : console.log;
    cb(err);
}

const AccountExisted = new BaseAuthError("Account already exists", 400);
const PasswordTooShort = new BaseAuthError("Password too short", 400);
const PasswordsNotMatch = new BaseAuthError("Passwords do not match", 400);
const EmailNotValid = new BaseAuthError("Email not valid", 400);
const TOSNotAccepted = new BaseAuthError("Please accept TOS", 400);

AuthRouter.post("/register", (req: Request, res: Response) => {
    const { name, email, password, confirmPassword, confirmTOS } = req.body;
    AccountModel.findOne({ email })
        .then((account) => {
            if (account) {
                throw AccountExisted;
            }

            if (password !== confirmPassword) {
                throw PasswordsNotMatch;
            }

            if (!confirmTOS) {
                throw TOSNotAccepted;
            }

            if (!email || !password || !name) {
                throw EmailNotValid;
            }

            if (password.length < 8) {
                throw PasswordTooShort;
            }

            const JWT_SECRET = process.env.JWT_SECRET;

            if (!JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }

            hash(password, 10).then((hashPassword) => {
                AccountModel.findOne({ email }).then((account) => {
                    if (account) {
                        throw AccountExisted;
                    }
                    AccountModel.create({
                        email,
                        password: hashPassword,
                        name,
                        role: "user",
                        avatarPath: null,
                        isVerified: process.env.DEBUG,
                        isActive: process.env.DEBUG,
                        isFirstTime: true,
                    });
                });
            });
        })
        .then(() => {
            res.json({
                result: "success",
                message: "Account created",
            });
        })
        .catch((err) => handleError(err, res));
});

interface LoginResponse {
    result: string;
    message: string;
    data?: {
        token: string;
    };
}

const AccountNotFound = new BaseAuthError("Account not found", 404);
const AccountNotVerified = new BaseAuthError("Account not verified", 403);
const WrongPassword = new BaseAuthError("Wrong password", 401);
const AccountIsDisabled = new BaseAuthError("Account is disabled", 403);

AuthRouter.post("/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    AccountModel.findOne({ email })
        .then(async (account) => {
            if (!account) {
                throw AccountNotFound;
            }

            if (!account.isVerified) {
                throw AccountNotVerified;
            }

            if (account.password === undefined || account.password === null) {
                throw WrongPassword;
            }

            const matchPassword = await compare(password, account.password);
            if (!matchPassword) {
                throw WrongPassword;
            }

            if (!account.isActive) {
                throw AccountIsDisabled;
            }

            const JWT_SECRET = process.env.JWT_SECRET;

            if (!JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }

            jwt.sign(
                {
                    email: account.email,
                    name: account.name,
                    role: account.role,
                },
                JWT_SECRET,
                {
                    expiresIn: "1d",
                },
                (err: Error | null, token: string | undefined) => {
                    if (err) throw new Error(err.message);
                    res.json({
                        result: "success",
                        message: "Login success",
                        data: {
                            token,
                        },
                    } as LoginResponse);
                }
            );
        })
        .catch((err) => handleError(err, res));
});

export default AuthRouter;
