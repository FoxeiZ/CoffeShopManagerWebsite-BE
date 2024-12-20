import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import AuthRoutes from "./routes/AuthRoutes";
import CustomerRoutes from "./routes/CustomerRoutes";
import EmployeeRoutes from "./routes/EmployeeRoutes";
import SellRoutes from "./routes/SellRoutes";
import ProductRoutes from "./routes/ProductRoutes";
import WarehouseRoutes from "./routes/WarehouseRoutes";
import SupplierRoutes from "./routes/SupplierRoutes";
import MenuRoutes from "./routes/MenuRoutes";

dotenv.config();

const app: Express = express();

// env
const dbUser = process.env.DB_USER || "";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "";
const hostname = process.env.DB_HOSTNAME || "";

const port = process.env.PORT || 8000;

// setup phase
const specs = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Coffeeshop Manager API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    servers: [
        {
            url: `http://localhost:${port}`,
        },
    ],
    apis: ["./routes/*.ts"],
});
app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(specs, { explorer: true })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.use("/auth", AuthRoutes);
app.use("/customer", CustomerRoutes);
app.use("/employee", EmployeeRoutes);
app.use("/product", ProductRoutes);
app.use("/sell", SellRoutes);
app.use("/warehouse", WarehouseRoutes);
app.use("/supplier", SupplierRoutes);
app.use("/menu", MenuRoutes);

console.log(
    `mongodb${
        hostname == "127.0.0.1" ? "" : "+srv"
    }://${dbUser}:${dbPassword}@${hostname}/${dbName}`
);
mongoose
    .connect(
        `mongodb${
            hostname == "127.0.0.1" ? "" : "+srv"
        }://${dbUser}:${dbPassword}@${hostname}/${dbName}`,
        {
            authSource: "admin",
        }
    )
    .then(() => {
        app.listen(port, () =>
            console.log(
                `[server]: Server is running at http://localhost:${port}`
            )
        );
    })
    .catch((e) => console.log("Cannot connect to MongoDB server, " + e));
