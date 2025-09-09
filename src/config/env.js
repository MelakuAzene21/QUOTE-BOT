import dotenv from "dotenv";

dotenv.config();

export const env = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    MONGO_URI: process.env.MONGO_URI,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL
};
