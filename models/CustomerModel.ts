import mongoose, { Schema } from "mongoose";

interface ICustomer {
    name: string;
    email: string;
    phoneNumber: string;
    birthDate: string;
    sex: string;
    address: string;
    isActive?: boolean;
}

const CustomerSchema = new Schema<ICustomer>({
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
    birthDate: {
        type: String,
        required: true,
    },
    sex: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
