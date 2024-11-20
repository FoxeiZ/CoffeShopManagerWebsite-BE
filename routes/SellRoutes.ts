import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";

import SellModel from "../models/SellModel";
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
import VoucherModel from "../models/VoucherModels";

const SellRoutes = Router();

/**
 * @swagger
 * /sell:
 *   get:
 *     summary: Get sell service status
 *     description: Get sell service status
 *     tags:
 *       - Sell
 *     responses:
 *       200:
 *         description: Sell service is up and running
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
 *                   example: Sell service is up and running
 */
SellRoutes.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Sell service is up and running",
    });
});

/**
 * @swagger
 * /sell/list:
 *   get:
 *     summary: List all sell entries with pagination
 *     description: Retrieve a paginated list of sell entries.
 *     tags:
 *       - Sell
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         required: true
 *         description: The number of sell entries per page
 *     responses:
 *       200:
 *         description: A paginated list of sell entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 sellItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 5f9f1c9f336f08617c7e90a1
 *                       customerName:
 *                         type: string
 *                         example: John Doe
 *                       phoneNumber:
 *                         type: string
 *                         example: 0123456789
 *                       sellDate:
 *                         type: string
 *                         example: 2020-11-01T00:00:00.000Z
 *                       values:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Product A
 *                             price:
 *                               type: number
 *                               example: 10.5
 *                             quant:
 *                               type: number
 *                               example: 100
 *                             unit:
 *                               type: string
 *                               example: kg
 *                 total:
 *                   type: number
 *                   example: 100
 *                 limit:
 *                   type: number
 *                   example: 10
 *                 page:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Invalid request parameters
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
SellRoutes.get(
    "/list",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

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

        try {
            const sellItems = SellModel.find().limit(limit).skip(skip).exec();

            const count = await SellModel.countDocuments();

            res.status(200).json({
                result: "success",
                sellItems,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalItems: count,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

/**
 * @swagger
 * /sell/add:
 *   post:
 *     summary: Add a new sell item
 *     description: Add a new sell item
 *     tags:
 *       - Sell
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: 0123456789
 *               sellDate:
 *                 type: string
 *                 example: 2020-11-01T00:00:00.000Z
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Product A
 *                     price:
 *                       type: number
 *                       example: 10.5
 *                     quant:
 *                       type: number
 *                       example: 100
 *                     unit:
 *                       type: string
 *                       example: kg
 *     responses:
 *       200:
 *         description: The sell item was added successfully
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
 *                   example: Sell added successfully
 *       400:
 *         description: Invalid request parameters
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
 *                   example: Missing required fields
 */
SellRoutes.post(
    "/add",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const requiredFields = [
            "customerName",
            "phoneNumber",
            "sellDate",
            "values",
        ];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { customerName, phoneNumber, sellDate, values, voucher } =
            req.body;
        let discount = 0;

        if (voucher) {
            const voucherDoc = await VoucherModel.findById(voucher);
            if (voucherDoc) {
                discount = voucherDoc.value;
            }
        }

        const totalValue = values.reduce(
            (acc, item) => acc + item.price * item.quant,
            0
        );
        const finalValue = totalValue - discount;

        SellModel.create({
            customerName,
            phoneNumber,
            sellDate,
            values,
            voucher,
            finalValue,
        })
            .then(() => {
                res.status(200).json({
                    result: "success",
                    message: "Sell added successfully",
                });
            })
            .catch((err) => handleError(err, res));
    }
);

/**
 * @swagger
 * /sell/get/{id}:
 *   get:
 *     summary: Get a sell entry by id
 *     description: Retrieve a sell entry from the database using the provided id.
 *     tags:
 *       - Sell
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the sell entry
 *     responses:
 *       200:
 *         description: Sell entry found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 sellItem:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f9f1c9f336f08617c7e90a1
 *                     customerName:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 0123456789
 *                     sellDate:
 *                       type: string
 *                       example: 2020-01-01T00:00:00.000Z
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Product A
 *                           price:
 *                             type: number
 *                             example: 10.99
 *                           quant:
 *                             type: number
 *                             example: 10
 *       404:
 *         description: Sell entry not found
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
SellRoutes.get(
    "/get/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        SellModel.findById(req.params.id)
            .then((sellItem) => {
                if (!sellItem) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    sellItem,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

/**
 * @swagger
 * /sell/delete/{id}:
 *   delete:
 *     summary: Delete a sell entry by id
 *     description: Delete a sell entry in the database using the provided id.
 *     tags:
 *       - Sell
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the sell entry
 *     responses:
 *       200:
 *         description: Sell deleted successfully
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
 *                   example: Sell deleted successfully
 *       404:
 *         description: Sell entry not found
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
SellRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        SellModel.findByIdAndDelete(req.params.id)
            .then(() => {
                res.status(200).json({
                    result: "success",
                    message: "Sell deleted successfully",
                });
            })
            .catch((err) => handleError(err, res));
    }
);

/**
 * @swagger
 * /sell/update/{id}:
 *   put:
 *     summary: Update a sell entry by id
 *     description: Update a sell entry in the database using the provided id and data.
 *     tags:
 *       - Sell
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the sell entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: 123-456-7890
 *               sellDate:
 *                 type: string
 *                 example: 2020-01-01
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Product A
 *                     price:
 *                       type: number
 *                       example: 10.99
 *                     quant:
 *                       type: number
 *                       example: 10
 *                     unit:
 *                       type: string
 *                       example: kg
 *     responses:
 *       200:
 *         description: Sell updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 sellItem:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f9f1c5f86a7a707d0a7a1c5
 *                     customerName:
 *                       type: string
 *                       example: John Doe
 *                     phoneNumber:
 *                       type: string
 *                       example: 123-456-7890
 *                     sellDate:
 *                       type: string
 *                       example: 2020-01-01T00:00:00.000Z
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Product A
 *                           price:
 *                             type: number
 *                             example: 10.99
 *                           quant:
 *                             type: number
 *                             example: 10
 *                           unit:
 *                             type: string
 *                             example: kg
 *       404:
 *         description: Sell item not found
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
SellRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    async (req: Request, res: Response) => {
        const { voucher, values } = req.body;
        let discount = 0;

        if (voucher) {
            const voucherDoc = await VoucherModel.findById(voucher);
            if (voucherDoc) {
                discount = voucherDoc.value;
            }
        }

        const totalValue = values.reduce(
            (acc, item) => acc + item.price * item.quant,
            0
        );
        const finalValue = totalValue - discount;

        SellModel.findByIdAndUpdate(
            req.params.id,
            { ...req.body, finalValue },
            {
                new: true,
            }
        )
            .then((sellItem) => {
                if (!sellItem) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    sellItem,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

export default SellRoutes;
