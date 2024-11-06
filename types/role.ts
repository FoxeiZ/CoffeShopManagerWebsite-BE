// Define the base roles
enum Role {
    Admin = "Admin",
    Employee = "Employee",
    Accounting = "Accounting",
    WarehouseManager = "WarehouseManager",
    EmployeeManager = "EmployeeManager",
    Customer = "Customer",
}

// Define all possible permissions
enum Permission {
    // Admin permissions
    MANAGE_ALL = "manage_all",

    // Manager general permissions
    VIEW_ALL_REPORTS = "view_all_reports",

    // Warehouse specific permissions
    MANAGE_WAREHOUSE = "manage_warehouse",
    MANAGE_INVENTORY = "manage_inventory",
    VIEW_WAREHOUSE_REPORTS = "view_warehouse_reports",

    // Employee management permissions
    MANAGE_EMPLOYEES = "manage_employees",
    MANAGE_SCHEDULES = "manage_schedules",
    VIEW_EMPLOYEE_RECORDS = "view_employee_records",

    // Employee permissions
    VIEW_OWN_PROFILE = "view_own_profile",
    SUBMIT_REPORTS = "submit_reports",

    // Customer permissions
    VIEW_PRODUCTS = "view_products",
    PLACE_ORDERS = "place_orders",
}

// Define role structure
interface RoleDefinition {
    isManager: boolean;
    permissions: Permission[];
}

// Define permissions for each role
const RoleDefinitions: Record<Role, RoleDefinition> = {
    [Role.Admin]: {
        isManager: false, // Admin is special and not considered a manager
        permissions: [Permission.MANAGE_ALL], // Admin has special all-access permission
    },
    [Role.Accounting]: {
        isManager: true,
        permissions: [
            Permission.VIEW_ALL_REPORTS,
            Permission.VIEW_EMPLOYEE_RECORDS,
            Permission.VIEW_WAREHOUSE_REPORTS,
        ],
    },
    [Role.WarehouseManager]: {
        isManager: true,
        permissions: [
            Permission.MANAGE_WAREHOUSE,
            Permission.MANAGE_INVENTORY,
            Permission.VIEW_WAREHOUSE_REPORTS,
            Permission.VIEW_ALL_REPORTS,
        ],
    },
    [Role.EmployeeManager]: {
        isManager: true,
        permissions: [
            Permission.MANAGE_EMPLOYEES,
            Permission.MANAGE_SCHEDULES,
            Permission.VIEW_EMPLOYEE_RECORDS,
            Permission.VIEW_ALL_REPORTS,
        ],
    },
    [Role.Employee]: {
        isManager: false,
        permissions: [Permission.VIEW_OWN_PROFILE, Permission.SUBMIT_REPORTS],
    },
    [Role.Customer]: {
        isManager: false,
        permissions: [Permission.VIEW_PRODUCTS, Permission.PLACE_ORDERS],
    },
};

// Type guard to check if a string is a valid Role
function isValidRole(role: string): role is Role {
    return Object.values(Role).includes(role as Role);
}

export { Role, RoleDefinition, Permission, RoleDefinitions, isValidRole };
