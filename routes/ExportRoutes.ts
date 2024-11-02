import { Router, Request, Response } from "express";
import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";

import AccountModel from "../models/AccountModel";

const AuthRouter = Router();
