import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";

import EmployeeModel, { IEmployee } from "../models/EmployeeModels";
import { handleError } from "../helpers/errors";

import {
    requireRole,
    requirePermission,
    requirePermissions,
    requireManager,
} from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import { checkEmptyFields } from "../helpers/general";
import { Permission, Role } from "../types/role";

const EmployeeRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Employee
 *     description: Employee related endpoints
 * /employee:
 *   get:
 *     summary: Get employee service status
 *     description: Get employee service status
 *     tags:
 *       - Employee
 *     responses:
 *       200:
 *         description: Employee service is up and running
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
 *                   example: Employee service is up and running
 */
EmployeeRoutes.get("/", (res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Employee service is up and running",
    });
});

EmployeeRoutes.post(
    "/add",
    limiter,
    requireRole(Role.EmployeeManager),
    async (req: Request, res: Response) => {
        const requiredFields = [
            "name",
            "email",
            "phoneNumber",
            "role",
            "password",
            "isActive",
            "isVerified",
            "isFirstTime",
        ];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const {
            name,
            email,
            phoneNumber,
            role,
            password,
            isActive,
            isVerified,
            isFirstTime,
        } = req.body;

        EmployeeModel.findOne({ email }).then((employee) => {
            if (employee) {
                res.status(400).json({
                    result: "error",
                    message: "Email already exists",
                });
                return;
            }
        });

        const employee = new EmployeeModel({
            name,
            email,
            phoneNumber,
            role,
            password: await hash(password, 10),
            isActive,
            isVerified,
            isFirstTime,
        });
        employee
            .save()
            .then((employee) => {
                res.status(200).json({
                    result: "success",
                    message: "Employee added successfully",
                    employee,
                });
            })
            .catch((err) => {
                res.status(500).json({
                    result: "error",
                    message: "Failed to add employee",
                    error: err,
                });
            });
    }
);

EmployeeRoutes.get(
    "/search/:search",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { search } = req.params;
        try {
            const employees = await EmployeeModel.find({
                name: { $regex: search, $options: "i" },
            }).exec();
            res.status(200).json({
                result: "success",
                employees,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.get(
    "/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const employee = await EmployeeModel.findById(id).exec();
            res.status(200).json({
                result: "success",
                employee,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { name, email, password } = req.body;
        try {
            const employee = await EmployeeModel.findById(id).exec();
            if (!employee) {
                res.status(404).json({
                    result: "error",
                    message: "Employee not found",
                });
                return;
            }
            if (name) employee.name = name;
            if (email) employee.email = email;
            if (password) employee.password = password;
            await employee.save();
            res.status(200).json({
                result: "success",
                message: "Employee updated successfully",
                employee,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const employee = await EmployeeModel.findByIdAndDelete(id).exec();
            if (!employee) {
                res.status(404).json({
                    result: "error",
                    message: "Employee not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                message: "Employee deleted successfully",
                employee,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.get(
    "/list",
    limiter,
    requirePermission(Permission.VIEW_EMPLOYEES),
    async (req: Request, res: Response) => {
        const [page, limit] = [
            parseInt(req.query.page as string, 10),
            parseInt(req.query.limit as string, 10),
        ];
        const skipIndex = (page - 1) * limit;

        if (isNaN(page) || isNaN(limit)) {
            res.status(400).json({
                result: "error",
                message: "Page and limit must be numbers",
            });
            return;
        }
        try {
            const employees = await EmployeeModel.find()
                .skip(skipIndex)
                .limit(limit)
                .exec();
            res.status(200).json({
                result: "success",
                employees,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.get(
    "/count",
    limiter,
    requirePermission(Permission.VIEW_EMPLOYEES),
    async (req: Request, res: Response) => {
        try {
            const count = await EmployeeModel.countDocuments().exec();
            res.status(200).json({
                result: "success",
                count,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

EmployeeRoutes.post(
    "/update-status",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        const requiredFields = ["id", "isActive"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { id, isActive } = req.body;
        EmployeeModel.findByIdAndUpdate(id)
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }

                product.isActive = isActive;
                product.save();
            })
            .catch((err) => handleError(err, res));
    }
);

EmployeeRoutes.post(
    "/verify",
    limiter,
    requireManager,
    async (req: Request, res: Response) => {
        const { id } = req.body;
        try {
            const employee = await EmployeeModel.findById(id).exec();
            if (!employee) {
                res.status(404).json({
                    result: "error",
                    message: "Employee not found",
                });
                return;
            }
            employee.isVerified = true;
            await employee.save();
            res.status(200).json({
                result: "success",
                message: "Employee verified successfully",
                employee,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

export default EmployeeRoutes;
