import mongoose, { Schema } from "mongoose";

// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    email: {
        type: String,
        unique: true,
    },
    password: String,
    name: String,
    role: String,
    avatarPath: String,
    isVerified: Boolean,
    isActive: Boolean,
    isFirstTime: Boolean,
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Account", AccountSchema);
