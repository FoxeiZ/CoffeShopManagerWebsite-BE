import mongoose, { Schema } from "mongoose";

interface ISellItem {
    name: string;
    price: number;
    quant: number;
    unit: string;
}

interface ISell {
    customerName: string;
    phoneNumber: string;
    sellDate: string;
    voucher?: string;
    values: ISellItem[];
}

const SellModel = new Schema<ISell>({
    customerName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    sellDate: {
        type: String,
        required: true,
    },
    voucher: {
        type: String,
    },
    values: [
        {
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quant: {
                type: Number,
                required: true,
            },
            unit: {
                type: String,
                required: true,
            },
        },
    ],
});

export type { ISell, ISellItem };
export default mongoose.model<ISell>("Sell", SellModel);
