import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";

import ProductModel from "../models/ProductModel";
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

const ProductRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product:
 *   get:
 *     summary: Get product service status
 *     description: Get product service status
 *     tags:
 *       - Product
 *     responses:
 *       200:
 *         description: Product service is up and running
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
 *                   example: Product service is up and running
 */
ProductRoutes.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Product service is up and running",
    });
});

ProductRoutes.get(
    "/list",
    limiter,
    requirePermission(Permission.VIEW_PRODUCTS),
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
            const products = await ProductModel.find()
                .skip(skipIndex)
                .limit(limit)
                .exec();

            res.status(200).json({
                result: "success",
                products,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

ProductRoutes.get(
    "/count",
    limiter,
    requirePermission(Permission.VIEW_PRODUCTS),
    async (req: Request, res: Response) => {
        try {
            const count = await ProductModel.countDocuments();
            res.status(200).json({
                result: "success",
                count,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

ProductRoutes.get(
    "/search/:search",
    limiter,
    requirePermission(Permission.VIEW_PRODUCTS),
    async (req: Request, res: Response) => {
        const { search } = req.params;
        try {
            const products = await ProductModel.find({
                name: { $regex: search, $options: "i" },
            }).exec();
            res.status(200).json({
                result: "success",
                products,
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

ProductRoutes.post(
    "/add",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        const requiredFields = ["name", "price", "quantity"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { name, price, quantity } = req.body;
        const product = new ProductModel({
            name,
            price,
            quantity,
        });
        product
            .save()
            .then((product) => {
                res.status(200).json({
                    result: "success",
                    message: "Product added successfully",
                    product,
                });
            })
            .catch((error) => {
                handleError(error, res);
            });
    }
);

ProductRoutes.put(
    "/update/:id",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        ProductModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    product,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

ProductRoutes.delete(
    "/delete/:id",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        ProductModel.findByIdAndDelete(req.params.id)
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                } else {
                    res.status(200).json({
                        result: "success",
                        product,
                    });
                    return;
                }
            })
            .catch((err) => handleError(err, res));
    }
);

ProductRoutes.get("/:id", (req: Request, res: Response) => {
    ProductModel.findById(req.params.id)
        .then((product) => {
            if (!product) {
                res.status(404).json({
                    result: "error",
                    message: "Not found",
                });
                return;
            }
            res.status(200).json({
                result: "success",
                product,
            });
        })
        .catch((err) => {
            handleError(err, res);
        });
});

ProductRoutes.put(
    "/update/:id",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        ProductModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    product,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

ProductRoutes.delete(
    "/delete/:id",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        ProductModel.findByIdAndDelete(req.params.id)
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                } else {
                    res.status(200).json({
                        result: "success",
                        product,
                    });
                    return;
                }
            })
            .catch((err) => handleError(err, res));
    }
);

export default ProductRoutes;
