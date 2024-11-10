import {
    Role,
    RoleDefinitions,
    Permission,
    isValidRole,
    getAllPermissions,
} from "../types/role";

function hasPermission(
    userRole: string | Role,
    requiredPermission: Permission
): boolean {
    const userRoleEnum =
        typeof userRole === "string"
            ? isValidRole(userRole)
                ? (userRole as Role)
                : null
            : userRole;

    if (!userRoleEnum) {
        return false;
    }

    const roleDef = RoleDefinitions[userRoleEnum];

    if (
        userRoleEnum === Role.Admin ||
        roleDef.permissions.includes(Permission.MANAGE_ALL)
    ) {
        return true;
    }

    return getAllPermissions(userRoleEnum).includes(requiredPermission);
}

function hasAllPermissions(
    userRole: string | Role,
    requiredPermissions: Permission[]
): boolean {
    const userRoleEnum =
        typeof userRole === "string"
            ? isValidRole(userRole)
                ? (userRole as Role)
                : null
            : userRole;

    if (!userRoleEnum) {
        return false;
    }

    if (userRoleEnum === Role.Admin) {
        return true;
    }

    return requiredPermissions.every((permission) =>
        hasPermission(userRoleEnum, permission)
    );
}

function hasRequiredRole(
    userRole: string | Role,
    requiredRole: string | Role
): boolean {
    const userRoleEnum =
        typeof userRole === "string"
            ? isValidRole(userRole)
                ? (userRole as Role)
                : null
            : userRole;

    const requiredRoleEnum =
        typeof requiredRole === "string"
            ? isValidRole(requiredRole)
                ? (requiredRole as Role)
                : null
            : requiredRole;

    if (!userRoleEnum || !requiredRoleEnum) {
        return false;
    }

    if (userRoleEnum === Role.Admin) {
        return true;
    }

    const requiredPermissions = RoleDefinitions[requiredRoleEnum].permissions;

    return hasAllPermissions(userRoleEnum, requiredPermissions);
}

function compareManagerRoles(
    userRole: string | Role,
    requiredRole: string | Role
): boolean {
    const userRoleEnum =
        typeof userRole === "string"
            ? isValidRole(userRole)
                ? (userRole as Role)
                : null
            : userRole;

    const requiredRoleEnum =
        typeof requiredRole === "string"
            ? isValidRole(requiredRole)
                ? (requiredRole as Role)
                : null
            : requiredRole;

    if (!userRoleEnum || !requiredRoleEnum) {
        return false;
    }

    if (userRoleEnum === Role.Admin) {
        return true;
    }

    const userDef = RoleDefinitions[userRoleEnum];
    const requiredDef = RoleDefinitions[requiredRoleEnum];

    if (!userDef.isManager || !requiredDef.isManager) {
        return false;
    }

    return hasAllPermissions(userRoleEnum, requiredDef.permissions);
}

export {
    hasPermission,
    hasAllPermissions,
    hasRequiredRole,
    compareManagerRoles,
};
