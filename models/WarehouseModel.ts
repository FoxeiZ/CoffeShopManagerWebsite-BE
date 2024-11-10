import mongoose, { Schema } from "mongoose";

interface IWarehouseItem {
    name: string;
    updateName?: string;
    price: number;
    updatePrice?: number;
    quant: number;
    updateQuant?: number;
    unit: string;
    updateUnit?: string;
}

interface IWarehouse {
    customerName: string;
    updateCustomerName?: string;
    phoneNumber: string;
    updatePhoneNumber?: string;
    importDate: string;
    updateImportDate?: string;
    values: IWarehouseItem[];
}

const WarehouseItemSchema = new Schema<IWarehouseItem>({
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
});

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

const WarehouseItemModel = mongoose.model<IWarehouseItem>(
    "WarehouseItem",
    WarehouseItemSchema
);
const WarehouseModel = mongoose.model<IWarehouse>("Warehouse", WarehouseSchema);

export type { IWarehouse, IWarehouseItem };
export default WarehouseModel;
export { WarehouseItemModel };
