import dotenv from "dotenv";

dotenv.config();

export const env = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
};
