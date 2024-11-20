import mongoose, { Schema, Types } from "mongoose";

import CheckinModels, { ICheckin, CheckinSchema } from "./CheckinModels";

interface IEmployee {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
    isActive: boolean;
    isVerified: boolean;
    isFirstTime: boolean;
    birthDate: string;
    sex: string;
    address: string;
    checkins: Types.DocumentArray<ICheckin & Document>;
}

const EmployeeSchema = new Schema<IEmployee>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },
    isFirstTime: {
        type: Boolean,
        required: true,
        default: true,
    },
    checkins: {
        type: [CheckinSchema],
        default: [],
    },
    birthDate: {
        type: String,
        required: true,
    },
    sex: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
});

export type { IEmployee };
export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
