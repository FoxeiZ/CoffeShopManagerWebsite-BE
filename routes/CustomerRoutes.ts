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

/**
 * @swagger
 * /customer/add:
 *   post:
 *     summary: Add a customer
 *     description: Add a customer
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: 1234567890
 *     responses:
 *       200:
 *         description: Customer added successfully
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
 *                   example: Customer added successfully
 *                 customer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f6c7b72fa6f9a0017d5d5b4
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 1234567890
 */
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

/**
 * @swagger
 * /customer/get/{id}:
 *   get:
 *     summary: Get a customer by id
 *     description: Get a customer by id
 *     tags:
 *       - Customer
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the customer
 *     responses:
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 customer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 1234567890
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 1234567890
 */
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

/**
 * @swagger
 * /customer/update/{id}:
 *   put:
 *     summary: Update customer
 *     description: Update customer
 *     tags:
 *       - Customer
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer id
 *       - in: body
 *         name: customer
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: John Doe
 *             phoneNumber:
 *               type: string
 *               example: 1234567890
 *         description: Customer object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 customer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 1234567890
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 1234567890
 */
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

/**
 * @swagger
 * /customer/delete/:id:
 *   delete:
 *     summary: Delete customer
 *     description: Delete customer
 *     tags:
 *       - Customer
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Customer ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 customer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 1234567890
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 1234567890
 */
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

/**
 * @swagger
 * /customer/list:
 *   get:
 *     summary: List customers
 *     description: Retrieve a paginated list of customers
 *     tags:
 *       - Customer
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
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalItems:
 *                   type: integer
 *                   example: 100
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Page and limit must be numbers
 */
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

/**
 * @swagger
 * /customer/search:
 *   get:
 *     summary: Search customers by name or phone number
 *     description: Search customers by name or phone number
 *     tags:
 *       - Customer
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Search query is required
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Not found
 */
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
