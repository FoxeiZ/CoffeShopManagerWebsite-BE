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

/**
 * @swagger
 * /employee/add:
 *   post:
 *     summary: Add a new employee
 *     description: Add a new employee
 *     tags:
 *       - Employee
 *     requestBody:
 *       description: Employee details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phoneNumber
 *               - role
 *               - password
 *               - isActive
 *               - isVerified
 *               - isFirstTime
 *             properties:
 *               name:
 *                 type: string
 *                 description: Employee name
 *               email:
 *                 type: string
 *                 description: Employee email
 *               phoneNumber:
 *                 type: string
 *                 description: Employee phone number
 *               role:
 *                 type: string
 *                 description: Employee role
 *               password:
 *                 type: string
 *                 description: Employee password
 *               isActive:
 *                 type: boolean
 *                 description: Is the employee active
 *               isVerified:
 *                 type: boolean
 *                 description: Is the employee verified
 *               isFirstTime:
 *                 type: boolean
 *                 description: Is this the first time the employee is logging in
 *     responses:
 *       200:
 *         description: Employee added successfully
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
 *                   example: Employee added successfully
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1234567890
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     phoneNumber:
 *                       type: string
 *                       example: 1234567890
 *                     role:
 *                       type: string
 *                       example: employee
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     isFirstTime:
 *                       type: boolean
 *                       example: true
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
 *         description: Internal server error
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
 *                   example: Failed to add employee
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/search/{search}:
 *   get:
 *     summary: Search employee by name
 *     description: Search employee by name
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: path
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Employees matching search query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to search employee
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/{id}:
 *   get:
 *     summary: Get employee by id
 *     description: Get employee by id
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Employee id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Employee found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: success
 *                 employee:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f9f1c10f35ad81d382a7a5c
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     role:
 *                       type: string
 *                       example: Employee
 *                     password:
 *                       type: string
 *                       example: hashed password
 *                     phoneNumber:
 *                       type: string
 *                       example: +1234567890
 *                     createdAt:
 *                       type: string
 *                       example: 2020-11-05T14:30:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       example: 2020-11-05T14:30:00.000Z
 *       404:
 *         description: Employee not found
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
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get employee
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/update/{id}:
 *   put:
 *     summary: Update employee
 *     description: Update employee with the provided information
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Employee id
 *         schema:
 *           type: string
 *         required: true
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
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Employee updated successfully
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
 *                   example: Employee updated successfully
 *                 employee:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f9f1c10f35ad81d382a7a5c
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     role:
 *                       type: string
 *                       example: Employee
 *                     password:
 *                       type: string
 *                       example: hashed password
 *                     phoneNumber:
 *                       type: string
 *                       example: +1234567890
 *                     createdAt:
 *                       type: string
 *                       example: 2021-01-01T01:01:01.000Z
 *                     updatedAt:
 *                       type: string
 *                       example: 2021-01-01T01:01:01.000Z
 *       404:
 *         description: Employee not found
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
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to update employee
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/delete/{id}:
 *   delete:
 *     summary: Delete an employee
 *     description: Delete an employee by id
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Employee id
 *     responses:
 *       200:
 *         description: Employee deleted successfully
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
 *                   example: Employee deleted successfully
 *                 employee:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 5f9f1c10f35ad81d382a7a5c
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     role:
 *                       type: string
 *                       example: Employee
 *                     password:
 *                       type: string
 *                       example: hashed password
 *                     phoneNumber:
 *                       type: string
 *                       example: +1234567890
 *                     createdAt:
 *                       type: string
 *                       example: 2021-01-01T01:01:01.000Z
 *                     updatedAt:
 *                       type: string
 *                       example: 2021-01-01T01:01:01.000Z
 *       404:
 *         description: Employee not found
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
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to delete employee
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/list:
 *   get:
 *     summary: Get list of employees
 *     description: Get list of employees
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of employees
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
 *                   example: List of employees
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 5f9f1c10f35ad81d382a7a5c
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       role:
 *                         type: string
 *                         example: Employee
 *                       password:
 *                         type: string
 *                         example: hashed password
 *                       phoneNumber:
 *                         type: string
 *                         example: +1234567890
 *                       createdAt:
 *                         type: string
 *                         example: 2021-01-01T01:01:01.000Z
 *                       updatedAt:
 *                         type: string
 *                         example: 2021-01-01T01:01:01.000Z
 *       500:
 *         description: Internal server error
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
 *                   example: Failed to get employees
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Something went wrong
 */
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

/**
 * @swagger
 * /employee/count:
 *   get:
 *     summary: Get the count of all employees
 *     description: Get the count of all employees
 *     tags:
 *       - Employee
 *     responses:
 *       200:
 *         description: Count of all employees
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
 *                   example: 10
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

/**
 * @swagger
 * /employee/update-status:
 *   post:
 *     summary: Update status of employee
 *     description: Update status of employee
 *     tags:
 *       - Employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 5f9f1c3f8b6a642f3c9f85d6
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Employee status updated successfully
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
 *                   example: Employee status updated successfully
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
 *                   example: Missing required fields
 *       404:
 *         description: Employee not found
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
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
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

/**
 * @swagger
 * /employee/verify:
 *   post:
 *     summary: Verify an employee
 *     description: Verify an employee
 *     tags:
 *       - Employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The id of the employee to verify
 *                 example: 60e0c1a2a3b8d3119943a98c
 *     responses:
 *       200:
 *         description: Employee verified successfully
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
 *                   example: Employee verified successfully
 *                 employee:
 *                   type: object
 *                   $ref: '#/components/schemas/Employee'
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
 *         description: Employee not found
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
 *                   example: Employee not found
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
