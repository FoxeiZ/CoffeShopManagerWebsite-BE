import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { hasPermission } from "../../helpers/auth";

export default function (roleName: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        const { JWT_SECRET } = process.env;
        let authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            jwt.verify(token, JWT_SECRET!, (err, user: any) => {
                if (err) {
                    return res.sendStatus(403);
                }
                if (hasPermission(user.role, roleName)) {
                    req.body.user = user;
                    next();
                } else {
                    res.sendStatus(401);
                }
            });
        } else {
            res.sendStatus(401);
        }
    };
}
