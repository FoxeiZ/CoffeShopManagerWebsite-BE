import mongoose, { Schema } from "mongoose";

interface IProduct {
    name: string;
    price: number;
    unit: string;
    description?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    isAvailable: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export type { IProduct };
export default mongoose.model<IProduct>("Product", ProductSchema);
