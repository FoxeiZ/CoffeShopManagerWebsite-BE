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

/**
 * @swagger
 * /product/list:
 *   get:
 *     summary: List products with pagination
 *     description: Retrieves a list of products with pagination support.
 *     tags:
 *       - Product
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid page or limit
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/count:
 *   get:
 *     summary: Get the count of all products
 *     description: Get the count of all products
 *     tags:
 *       - Product
 *     responses:
 *       200:
 *         description: Count of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: number
 *                   example: 100
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/search/{search}:
 *   get:
 *     summary: Search a product by name
 *     description: Search a product by name
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Products found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/add:
 *   post:
 *     summary: Add a new product
 *     description: Add a new product
 *     tags:
 *       - Product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Apple iPhone 13
 *               price:
 *                 type: number
 *                 example: 999.99
 *               quantity:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Product added successfully
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
 *                   example: Product added successfully
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *                   example: Missing required fields
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/update/:id:
 *   put:
 *     summary: Update a product
 *     description: Update a product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the product
 *               price:
 *                 type: number
 *                 description: The new price of the product
 *               quantity:
 *                 type: number
 *                 description: The new quantity of the product
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *                   example: Missing required fields
 *       404:
 *         description: Product not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/delete/:id:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the product to delete
 *     responses:
 *       200:
 *         description: The product was deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f2b7f5c3f4f4f4f4f4f4f4f4
 *                     name:
 *                       type: string
 *                       example: Product 1
 *                     price:
 *                       type: number
 *                       example: 10.99
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: The product was not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Retrieve a product by ID
 *     description: Retrieve a single product by its ID
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the product to retrieve
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f2b7f5c3f4f4f4f4f4f4f4f4
 *                     name:
 *                       type: string
 *                       example: Product 1
 *                     price:
 *                       type: number
 *                       example: 10.99
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: Product not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/update/:id:
 *   put:
 *     summary: Update a product
 *     description: Update a product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the product
 *               price:
 *                 type: number
 *                 description: The new price of the product
 *               quantity:
 *                 type: number
 *                 description: The new quantity of the product
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 1234567890
 *                     name:
 *                       type: string
 *                       example: iPhone 12
 *                     price:
 *                       type: number
 *                       example: 999
 *                     quantity:
 *                       type: number
 *                       example: 10
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
 *                   example: Missing required fields
 *       404:
 *         description: Product not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/delete/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Product id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 product:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f88d9a85a4d3a0040a7a6a7
 *                     name:
 *                       type: string
 *                       example: Apple iPhone 12
 *                     price:
 *                       type: number
 *                       example: 999
 *                     quantity:
 *                       type: number
 *                       example: 0
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       example: 2020-10-22T14:30:18.000Z
 *                     updatedAt:
 *                       type: string
 *                       example: 2020-10-22T14:30:18.000Z
 *       404:
 *         description: Product not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
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

/**
 * @swagger
 * /product/set-availability:
 *   post:
 *     summary: Update product availability
 *     description: Update product availability
 *     tags:
 *       - Product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Product id
 *                 example: 5faa5e5e5e5e5e5e5e5e5e5e
 *               isAvailable:
 *                 type: boolean
 *                 description: Is product available
 *                 example: true
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: Product updated successfully
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
 *                   example: Missing required fields
 *       404:
 *         description: Product not found
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
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
ProductRoutes.post(
    "/set-availability",
    limiter,
    requireManager,
    (req: Request, res: Response) => {
        const requiredFields = ["id", "isAvailable"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { id, isAvailable } = req.body;
        ProductModel.findByIdAndUpdate(id)
            .then((product) => {
                if (!product) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }

                product.isAvailable = isAvailable;
                product.save();
            })
            .catch((err) => handleError(err, res));
    }
);

export default ProductRoutes;
