import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export default function (req: Request, res: Response, next: NextFunction) {
    const { JWT_SECRET } = process.env;
    let authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, JWT_SECRET!, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.body.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}
