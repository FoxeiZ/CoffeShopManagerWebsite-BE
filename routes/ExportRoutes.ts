import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";

import ExportModel, { IExportItem } from "../models/ExportModel";
import BaseError from "../types/error";
import { handleError } from "../helpers/errors";

import RoleAuth from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import { checkEmptyFields } from "../helpers/general";

const ExportRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Export
 *     description: Export related endpoints
 * /export:
 *   get:
 *     summary: Get export service status
 *     description: Get export service status
 *     tags:
 *       - Export
 *     responses:
 *       200:
 *         description: Export service is up and running
 */
ExportRoutes.get("/", (res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Export service is up and running",
    });
});

/**
 * @swagger
 * /export/add:
 *   post:
 *     summary: Add a new export entry
 *     description: Create a new export entry with the provided information.
 *     tags:
 *       - Export
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Jane Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               importDate:
 *                 type: string
 *                 example: "2023-10-10"
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Product A"
 *                     price:
 *                       type: number
 *                       example: 10.5
 *                     quant:
 *                       type: number
 *                       example: 100
 *                     unit:
 *                       type: string
 *                       example: "kg"
 *     responses:
 *       200:
 *         description: Export added successfully
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
 *                   example: Export added successfully
 *       400:
 *         description: Missing required fields
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
 *                   example: "Missing required fields: customerName, phoneNumber, importDate, values"
 */
ExportRoutes.post(
    "/add",
    limiter,
    RoleAuth("WarehouseEmployee"),
    (req: Request, res: Response) => {
        const requiredFields = [
            "customerName",
            "phoneNumber",
            "importDate",
            "values",
        ];

        if (checkEmptyFields(req.body, requiredFields)) {
            res.status(400).json({
                result: "error",
                message: `Missing required fields: ${requiredFields
                    .filter((field) => !(field in req.body))
                    .join(", ")}`,
            });
            return;
        }

        const { customerName, phoneNumber, importDate, values } = req.body;
        ExportModel.create({
            customerName,
            phoneNumber,
            importDate,
            values,
        })
            .then(() => {
                res.json({
                    result: "success",
                    message: "Export added successfully",
                });
            })
            .catch((err) => handleError(err, res));
    }
);

/**
 * @swagger
 * /export/get/:id:
 *   get:
 *     summary: Get an export by id
 *     description: Get an export by id
 *     tags:
 *       - Export
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the export
 *     responses:
 *       200:
 *         description: Export found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 exportItem:
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
 *                     importDate:
 *                       type: string
 *                       example: 2020-11-01T00:00:00.000Z
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Coffee
 *                           price:
 *                             type: number
 *                             example: 10.99
 *                           quant:
 *                             type: number
 *                             example: 2
 *                           unit:
 *                             type: string
 *                             example: kg
 *       404:
 *         description: Export not found
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
ExportRoutes.get("/get/:id", (req: Request, res: Response) => {
    ExportModel.findById(req.params.id)
        .then((exportItem) => {
            if (!exportItem) {
                res.status(404).json({
                    result: "error",
                    message: "Not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                exportItem,
            });
        })
        .catch((err) => handleError(err, res));
});

/**
 * @swagger
 * /export/update/{id}:
 *   put:
 *     summary: Update an export by id
 *     description: Update the details of an export entry by its id.
 *     tags:
 *       - Export
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the export to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: Jane Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               importDate:
 *                 type: string
 *                 example: "2023-10-10"
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Product A"
 *                     price:
 *                       type: number
 *                       example: 10.5
 *                     quant:
 *                       type: number
 *                       example: 100
 *                     unit:
 *                       type: string
 *                       example: "kg"
 *     responses:
 *       200:
 *         description: Export updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 exportItem:
 *                   type: object
 *       404:
 *         description: Export not found
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
ExportRoutes.put("/update/:id", (req: Request, res: Response) => {
    ExportModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    })
        .then((exportItem) => {
            if (!exportItem) {
                res.status(404).json({
                    result: "error",
                    message: "Not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                exportItem,
            });
        })
        .catch((err) => handleError(err, res));
});

/**
 * @swagger
 * /export/delete/:id:
 *   delete:
 *     summary: Delete an export by id
 *     description: Delete an export by id
 *     tags:
 *       - Export
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the export
 *     responses:
 *       200:
 *         description: Export deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 exportItem:
 *                   type: object
 *       404:
 *         description: Export not found
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
ExportRoutes.delete("/delete/:id", (req: Request, res: Response) => {
    ExportModel.findByIdAndDelete(req.params.id)
        .then((exportItem) => {
            if (!exportItem) {
                res.status(404).json({
                    result: "error",
                    message: "Not found",
                });
            } else {
                res.status(200).json({
                    result: "success",
                    exportItem,
                });
                return;
            }
        })
        .catch((err) => handleError(err, res));
});

/**
 * @swagger
 * /export/list:
 *   get:
 *     summary: List exports with pagination
 *     description: Retrieve a paginated list of exports.
 *     tags:
 *       - Export
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
 *         description: The number of exports per page
 *     responses:
 *       200:
 *         description: A paginated list of exports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 exports:
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
 *                       importDate:
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
ExportRoutes.get("/list", async (req: Request, res: Response) => {
    const [page, limit] = [
        parseInt(req.query.page as string, 10),
        parseInt(req.query.limit as string, 10),
    ];

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
        const exportItems = await ExportModel.find()
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await ExportModel.countDocuments();

        res.status(200).json({
            result: "success",
            exportItems,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (err) {
        handleError(err, res);
    }
});

export default ExportRoutes;
