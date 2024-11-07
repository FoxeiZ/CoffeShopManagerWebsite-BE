import mongoose, { Schema } from "mongoose";

interface ICustomer {
    name: string;
    email: string;
    phoneNumber: string;
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
});

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
