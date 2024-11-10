import mongoose, { Schema } from "mongoose";

interface IAccount {
    email: string;
    password: string;
    name: string;
    role: string;
    avatarPath: string;
    isVerified: boolean;
    isActive: boolean;
    isFirstTime: boolean;
    createdAt: Date;
}

const AccountSchema = new Schema<IAccount>({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    avatarPath: {
        type: String,
        default: "",
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    isFirstTime: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export default mongoose.model<IAccount>("Account", AccountSchema);
