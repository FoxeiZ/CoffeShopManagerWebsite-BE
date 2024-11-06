import mongoose, { Schema } from "mongoose";

interface IWarehouseItem {
    name: string;
    price: number;
    quant: number;
    unit: string;
}

interface IWarehouse {
    customerName: string;
    phoneNumber: string;
    importDate: string;
    values: IWarehouseItem[];
}

const WarehouseItemSchema = new Schema<IWarehouseItem>(
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
    { _id: false }
);

const WarehouseSchema = new Schema<IWarehouse>({
    customerName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    importDate: {
        type: String,
        required: true,
    },
    values: {
        type: [WarehouseItemSchema],
        required: true,
    },
});

export { IWarehouse, IWarehouseItem };
export default mongoose.model<IWarehouse>("Warehouse", WarehouseSchema);
