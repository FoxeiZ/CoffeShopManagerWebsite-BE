import { Router, Request, Response } from "express";
import { handleError } from "../helpers/errors";
import { checkEmptyFields } from "../helpers/general";
import { Permission, Role } from "../types/role";
import { requireRole, requirePermission } from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import SupplierModel, { ISupplier } from "../models/SupplierModels";

const SupplierRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Supplier
 *     description: Supplier related endpoints
 * /supplier:
 *   get:
 *     summary: Get supplier service status
 *     description: Get supplier service status
 *     tags:
 *       - Supplier
 *     responses:
 *       200:
 *         description: Supplier service is up and running
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
 *                   example: Supplier service is up and running
 */
SupplierRoutes.get("/", (res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Supplier service is up and running",
    });
});

/**
 * @swagger
 * /supplier/add:
 *   post:
 *     summary: Add new supplier
 *     description: Add a new supplier to the system
 *     tags:
 *       - Supplier
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: ABC Supplies
 *               field:
 *                 type: string
 *                 example: Coffee Beans
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *     responses:
 *       200:
 *         description: Supplier added successfully
 *       400:
 *         description: Missing required fields
 */
SupplierRoutes.post(
    "/add",
    limiter,
    requireRole(Role.EmployeeManager),
    async (req: Request, res: Response) => {
        const requiredFields = ["name", "field", "phone", "address"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { name, field, phone, address } = req.body;

        const supplier = new SupplierModel({
            name,
            field,
            phone,
            address,
        });

        try {
            await supplier.save();
            res.status(200).json({
                result: "success",
                message: "Supplier added successfully",
                supplier,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

/**
 * @swagger
 * /supplier/get/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     description: Retrieve a supplier by their ID
 *     tags:
 *       - Supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier found
 *       404:
 *         description: Supplier not found
 */
SupplierRoutes.get(
    "/get/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const supplier = await SupplierModel.findById(id).exec();
            if (!supplier) {
                res.status(404).json({
                    result: "error",
                    message: "Supplier not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                supplier,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

/**
 * @swagger
 * /supplier/list:
 *   get:
 *     summary: Get paginated list of suppliers
 *     description: Retrieve a paginated list of suppliers
 *     tags:
 *       - Supplier
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of suppliers retrieved successfully
 *       400:
 *         description: Invalid page or limit parameters
 */
SupplierRoutes.get(
    "/list",
    limiter,
    requirePermission(Permission.VIEW_SUPPLIERS),
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

            const suppliers = await SupplierModel.find()
                .skip(skipIndex)
                .limit(limit)
                .exec();

            const total = await SupplierModel.countDocuments();

            res.status(200).json({
                result: "success",
                suppliers,
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

/**
 * @swagger
 * /supplier/update/{id}:
 *   put:
 *     summary: Update supplier
 *     description: Update an existing supplier's information
 *     tags:
 *       - Supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               field:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       404:
 *         description: Supplier not found
 */
SupplierRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const supplier = await SupplierModel.findById(id).exec();
            if (!supplier) {
                res.status(404).json({
                    result: "error",
                    message: "Supplier not found",
                });
                return;
            }

            const { name, field, phone, address } = req.body;
            if (name) supplier.name = name;
            if (field) supplier.field = field;
            if (phone) supplier.phone = phone;
            if (address) supplier.address = address;

            await supplier.save();
            res.status(200).json({
                result: "success",
                message: "Supplier updated successfully",
                supplier,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

/**
 * @swagger
 * /supplier/delete/{id}:
 *   delete:
 *     summary: Delete supplier
 *     description: Delete a supplier from the system
 *     tags:
 *       - Supplier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 */
SupplierRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const supplier = await SupplierModel.findByIdAndDelete(id).exec();
            if (!supplier) {
                res.status(404).json({
                    result: "error",
                    message: "Supplier not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                message: "Supplier deleted successfully",
                supplier,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

/**
 * @swagger
 * /supplier/all:
 *   get:
 *     summary: Get all suppliers
 *     description: Retrieve all suppliers without pagination
 *     tags:
 *       - Supplier
 *     responses:
 *       200:
 *         description: List of all suppliers retrieved successfully
 */
SupplierRoutes.get(
    "/all",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        try {
            const suppliers = await SupplierModel.find().exec();
            res.status(200).json({
                result: "success",
                suppliers,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

export default SupplierRoutes;
