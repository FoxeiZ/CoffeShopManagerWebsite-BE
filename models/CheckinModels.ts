import mongoose, { Schema } from "mongoose";

interface ICheckin {
    checkinTime: Date;
    type: string;
    value: number;
}

const CheckinSchema = new Schema<ICheckin>({
    checkinTime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    type: {
        type: String,
        required: true,
        enum: ["in", "out"],
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
});

export type { ICheckin };
export { CheckinSchema };
export default mongoose.model<ICheckin>("Checkin", CheckinSchema);
