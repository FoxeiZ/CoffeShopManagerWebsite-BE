import mongoose, { Schema } from "mongoose";

interface IMenuItem {
    name: string;
    type: string;
    price: number;
    isAvailable: boolean;
}

const MenuItemSchema = new Schema<IMenuItem>({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
});

export type { IMenuItem };
export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
