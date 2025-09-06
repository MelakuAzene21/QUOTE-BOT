import TelegramBot from "node-telegram-bot-api";
import { env } from "./config/env.js";
import { getRandomQuote } from "./api/quotes.js";
import { generateQuoteImage } from "./utils/quoteImage.js";

export function startBot() {
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

    console.log("🚀 Quote Bot is running...");

    // /start command
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "👋 Hello! I am Quote Generator Bot.\n\n" +
            "Commands:\n" +
            "➡️ /quote - Get a random quote\n" +
            "➡️ /categories - Choose category (life, love, wisdom)"
        );
    });

    // Inside /quote command
    bot.onText(/\/quote/, async (msg) => {
        const chatId = msg.chat.id;

        // Show typing animation
        await bot.sendChatAction(chatId, "typing");
        // Send a loading message
        const loadingMsg = await bot.sendMessage(chatId, "⏳ Generating your quote...");
        // Replace loader with final image
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        const { content, author } = await getRandomQuote();
        const imageBuffer = await generateQuoteImage(content, author);

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `📝 Here’s your quote!`,
        });
    });

   
    return bot;
}
