import { Router, Request, Response } from "express";
import { handleError } from "../helpers/errors";
import { checkEmptyFields } from "../helpers/general";
import { Permission, Role } from "../types/role";
import { requireRole, requirePermission } from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import MenuItemModel, { IMenuItem } from "../models/MenuModels";

const MenuRoutes = Router();

// Get menu service status
MenuRoutes.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Menu service is up and running",
    });
});

// Add new menu item
MenuRoutes.post(
    "/add",
    limiter,
    requireRole(Role.EmployeeManager),
    async (req: Request, res: Response) => {
        const requiredFields = ["name", "type", "price"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { name, type, price, isAvailable } = req.body;

        const menuItem = new MenuItemModel({
            name,
            type,
            price,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
        });

        try {
            await menuItem.save();
            res.status(200).json({
                result: "success",
                message: "Menu item added successfully",
                menuItem,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

// Get menu item by ID
MenuRoutes.get(
    "/get/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const menuItem = await MenuItemModel.findById(id).exec();
            if (!menuItem) {
                res.status(404).json({
                    result: "error",
                    message: "Menu item not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                menuItem,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

// Get paginated list of menu items
MenuRoutes.get(
    "/list",
    limiter,
    requirePermission(Permission.VIEW_MENU_ITEMS),
    async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (page < 1 || limit < 1) {
                res.status(400).json({
                    result: "error",
                    message: "Page and limit must be positive numbers",
                });
                return;
            }

            const skipIndex = (page - 1) * limit;

            const items = await MenuItemModel.find()
                .skip(skipIndex)
                .limit(limit)
                .exec();

            const total = await MenuItemModel.countDocuments();

            res.status(200).json({
                result: "success",
                items,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

// Update menu item
MenuRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const menuItem = await MenuItemModel.findById(id).exec();
            if (!menuItem) {
                res.status(404).json({
                    result: "error",
                    message: "Menu item not found",
                });
                return;
            }

            const { name, type, price, isAvailable } = req.body;
            if (name !== undefined) menuItem.name = name;
            if (type !== undefined) menuItem.type = type;
            if (price !== undefined) menuItem.price = price;
            if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

            await menuItem.save();
            res.status(200).json({
                result: "success",
                message: "Menu item updated successfully",
                menuItem,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

// Delete menu item
MenuRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const menuItem = await MenuItemModel.findByIdAndDelete(id).exec();
            if (!menuItem) {
                res.status(404).json({
                    result: "error",
                    message: "Menu item not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                message: "Menu item deleted successfully",
                menuItem,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

// Get all menu items
MenuRoutes.get(
    "/all",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        try {
            const items = await MenuItemModel.find().exec();
            res.status(200).json({
                result: "success",
                items,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

export default MenuRoutes;
