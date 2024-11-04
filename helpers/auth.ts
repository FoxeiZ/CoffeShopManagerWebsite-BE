enum Role {
    Admin = "Admin",
    Employee = "Employee",
    Manager = "Manager",
    Customer = "Customer",
}

const RoleLevel = {
    [Role.Admin]: 4,
    [Role.Manager]: 3,
    [Role.Employee]: 2,
    [Role.Customer]: 1,
} as const;

function isValidRole(role: string): role is Role {
    return Object.values(Role).includes(role as Role);
}

function hasPermission(
    userRole: string | Role,
    requiredRole: string | Role
): boolean {
    // Chuyển đổi và validate input
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

    return RoleLevel[userRoleEnum] >= RoleLevel[requiredRoleEnum];
}

export { hasPermission };
