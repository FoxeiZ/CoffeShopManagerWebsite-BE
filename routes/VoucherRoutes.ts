import { Router, Request, Response } from "express";
import VoucherModel from "../models/VoucherModels";
import { handleError } from "../helpers/errors";
import { requireRole } from "../middleware/auth/RoleAuth";
import limiter from "../middleware/RateLimiter";
import { checkEmptyFields } from "../helpers/general";
import { Role } from "../types/role";

const VoucherRoutes = Router();

VoucherRoutes.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        result: "success",
        message: "Voucher service is up and running",
    });
});

VoucherRoutes.get(
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
            const vouchers = await VoucherModel.find()
                .limit(limit)
                .skip(skip)
                .exec();
            const count = await VoucherModel.countDocuments();

            res.status(200).json({
                result: "success",
                vouchers,
                pagination: {
                    total: count,
                    limit,
                    page,
                    pages: Math.ceil(count / limit),
                },
            });
        } catch (err) {
            handleError(err, res);
        }
    }
);

VoucherRoutes.post(
    "/add",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        const requiredFields = ["name", "value", "exipryDate"];
        if (checkEmptyFields(requiredFields, req.body)) {
            res.status(400).json({
                result: "error",
                message: "Missing required fields",
            });
            return;
        }

        const { name, value, exipryDate } = req.body;
        VoucherModel.create({
            name,
            value,
            exipryDate,
        })
            .then(() => {
                res.status(200).json({
                    result: "success",
                    message: "Voucher added successfully",
                });
            })
            .catch((err) => handleError(err, res));
    }
);

VoucherRoutes.get(
    "/get/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        VoucherModel.findById(req.params.id)
            .then((voucher) => {
                if (!voucher) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    voucher,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

VoucherRoutes.delete(
    "/delete/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        VoucherModel.findByIdAndDelete(req.params.id)
            .then(() => {
                res.status(200).json({
                    result: "success",
                    message: "Voucher deleted successfully",
                });
            })
            .catch((err) => handleError(err, res));
    }
);

VoucherRoutes.put(
    "/update/:id",
    limiter,
    requireRole(Role.Employee),
    (req: Request, res: Response) => {
        VoucherModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
            .then((voucher) => {
                if (!voucher) {
                    res.status(404).json({
                        result: "error",
                        message: "Not found",
                    });
                    return;
                }
                res.status(200).json({
                    result: "success",
                    voucher,
                });
            })
            .catch((err) => handleError(err, res));
    }
);

export default VoucherRoutes;
