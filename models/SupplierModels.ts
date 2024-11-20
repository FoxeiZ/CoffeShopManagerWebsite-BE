import mongoose, { Schema } from "mongoose";

interface ISupplier {
    name: string;
    field: string;
    phone: string;
    address: string;
}

const SupplierSchema = new Schema<ISupplier>({
    name: {
        type: String,
        required: true,
    },
    field: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
});

export type { ISupplier };
export default mongoose.model<ISupplier>("Supplier", SupplierSchema);
