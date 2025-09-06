// models/Subscriber.js
import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema({
    chatId: { type: Number, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
