import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { Role, RoleDefinitions, Permission } from "../../types/role";
import { hasPermission, hasRequiredRole } from "./../../helpers/auth";

const verifyToken = (req: Request, res: Response) => {
    const { JWT_SECRET } = process.env;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.sendStatus(401);
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET!);
        return decoded;
    } catch (err) {
        return;
    }
};

function requireRole(roleName: string | Role) {
    return function (req: Request, res: Response, next: NextFunction) {
        const user = verifyToken(req, res) as any;

        if (!user) {
            res.sendStatus(401);
            return;
        }

        if (hasRequiredRole(user.role, roleName)) {
            next();
        } else {
            res.status(403).json({
                error: "Insufficient role permissions",
            });
        }
    };
}

function requirePermission(permission: Permission) {
    return function (req: Request, res: Response, next: NextFunction) {
        const user = verifyToken(req, res) as any;

        if (!user) {
            res.sendStatus(401);
            return;
        }

        if (hasPermission(user.role, permission)) {
            next();
        } else {
            res.status(403).json({
                error: "Insufficient permissions",
            });
        }
    };
}

function requirePermissions(permissions: Permission[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        const user = verifyToken(req, res) as any;

        if (!user) {
            res.sendStatus(401);
            return;
        }

        const hasAllRequired = permissions.every((permission) =>
            hasPermission(user.role, permission)
        );

        if (hasAllRequired) {
            next();
        } else {
            res.status(403).json({
                error: "Insufficient permissions",
            });
        }
    };
}

function requireManager() {
    return function (req: Request, res: Response, next: NextFunction) {
        const user = verifyToken(req, res) as any;

        if (!user) {
            res.sendStatus(401);
            return;
        }

        const roleDefinition = RoleDefinitions[user.role as Role];

        if (roleDefinition?.isManager || user.role === Role.Admin) {
            next();
        } else {
            res.status(403).json({
                error: "Manager access required",
            });
        }
    };
}

export { requireRole, requirePermission, requirePermissions, requireManager };
