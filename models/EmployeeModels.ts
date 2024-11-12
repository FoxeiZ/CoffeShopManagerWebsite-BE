import mongoose, { Schema, Types } from "mongoose";

import CheckinModels, { ICheckin, CheckinSchema } from "./CheckinModels";

interface IEmployee {
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
    isActive: boolean;
    isVerified: boolean;
    isFirstTime: boolean;
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
        ref: "Checkin",
    },
});

export type { IEmployee };
export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
