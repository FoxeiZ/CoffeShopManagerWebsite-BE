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

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Get auth service status
 *     description: Get auth service status
 *     responses:
 *       200:
 *         description: Auth service is up and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Auth service is up and running
 */
AuthRouter.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Auth service is up and running",
    });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     description: Create a new user account with the provided information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 example: password123
 *               confirmTOS:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Account created
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 */
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
const AccountForbidden = new BaseAuthError(
    "Account not verified or Account is disabled",
    403
);
const WrongPassword = new BaseAuthError("Wrong password", 401);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to an account
 *     description: Authenticate the user with the provided email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized, wrong password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Wrong password
 *       403:
 *         description: Forbidden, account not verified or disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Account not verified or Account is disabled
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Account not found
 */
AuthRouter.post("/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    AccountModel.findOne({ email })
        .then(async (account) => {
            if (!account) {
                throw AccountNotFound;
            }

            if (!account.isVerified) {
                throw AccountForbidden;
            }

            if (account.password === undefined || account.password === null) {
                throw WrongPassword;
            }

            const matchPassword = await compare(password, account.password);
            if (!matchPassword) {
                throw WrongPassword;
            }

            if (!account.isActive) {
                throw AccountForbidden;
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
