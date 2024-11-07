import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";

import CustomerModel from "../models/CustomerModel";
import { handleError } from "../helpers/errors";

import {
    requireRole,
    requirePermission,
    requirePermissions,
    requireManager,
} from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import { checkEmptyFields } from "../helpers/general";
import { Role } from "../types/role";

const CustomerRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer:
 *   get:
 *     summary: Get customer service status
 *     description: Get customer service status
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: Customer service is up and running
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
 *                   example: Customer service is up and running
 */
CustomerRoutes.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Customer service is up and running",
    });
});

CustomerRoutes.post(
    "/add",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        const requiredFields = ["name", "phoneNumber"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }
        const { name, phoneNumber } = req.body;
        const customer = new CustomerModel({
            name,
            phoneNumber,
        });
        customer
            .save()
            .then((customer) => {
                res.status(200).json({
                    result: "success",
                    message: "Customer added successfully",
                    customer,
                });
            })
            .catch((error) => {
                handleError(res, error);
            });
    }
);

CustomerRoutes.get(
    "/get/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        CustomerModel.findById(req.params.id)
            .then((customer) => {
                if (!customer) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    customer,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

CustomerRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        CustomerModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
            .then((customer) => {
                if (!customer) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    customer,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

CustomerRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        CustomerModel.findByIdAndDelete(req.params.id)
            .then((customer) => {
                if (!customer) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    customer,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

CustomerRoutes.get(
    "/list",
    limiter,
    requireRole(Role.Employee),
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

        if (page < 1 || limit < 1) {
            res.status(400).json({
                result: "error",
                message: "Page and limit must be greater than 0",
            });
            return;
        }

        if (limit > 100) {
            res.status(400).json({
                result: "error",
                message: "Limit must be less than 100",
            });
            return;
        }

        const customers = await CustomerModel.find()
            .skip(skipIndex)
            .limit(limit)
            .exec();

        const count = await CustomerModel.countDocuments();

        res.status(200).json({
            result: "success",
            customers,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalItems: count,
        });
    }
);

CustomerRoutes.get(
    "/search",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const search = req.query.search as string;
        if (!search) {
            res.status(400).json({
                result: "error",
                message: "Search query is required",
            });
            return;
        }

        const customers = await CustomerModel.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { phoneNumber: { $regex: search, $options: "i" } },
            ],
        }).exec();

        if (customers.length === 0) {
            res.status(404).json({
                result: "error",
                message: "Not found",
            });
            return;
        }

        res.status(200).json({
            result: "success",
            customers,
        });
    }
);
export default CustomerRoutes;
