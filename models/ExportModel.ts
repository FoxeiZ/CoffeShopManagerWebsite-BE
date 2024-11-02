import mongoose, { Schema } from "mongoose";

interface IExportItem {
    name: string;
    price: number;
    quant: number;
    unit: string;
}

interface IExport {
    customerName: string;
    phoneNumber: string;
    importDate: string;
    values: IExportItem[];
}

const ExportItemSchema = new Schema<IExportItem>(
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

const ExportSchema = new Schema<IExport>({
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
        type: [ExportItemSchema],
        required: true,
    },
});

export default mongoose.model<IExport>("Export", ExportSchema);
