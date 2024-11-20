import mongoose, { Schema } from "mongoose";

interface IVoucher {
    name: string;
    value: number;
    exipryDate: Date;
}

const VoucherSchema = new Schema<IVoucher>({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    exipryDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export default mongoose.model<IVoucher>("Voucher", VoucherSchema);
