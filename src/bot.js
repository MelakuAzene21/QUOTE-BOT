import TelegramBot from "node-telegram-bot-api";
import { env } from "./config/env.js";
import { getRandomQuote, getCategoryQuote } from "./api/quotes.js";
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

        const { content, author } = await getRandomQuote();
        const imageBuffer = await generateQuoteImage(content, author);

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `📝 Here’s your quote!`,
        });
    });


    // Inside /categories <name> command
    bot.onText(/\/categories (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const category = match[1];

        // Show typing animation
        await bot.sendChatAction(chatId, "typing");

        const { content, author } = await getCategoryQuote(category);
        const imageBuffer = await generateQuoteImage(content, author);

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `📌 ${category.toUpperCase()} Quote`,
        });
    });

    // Guide for categories
    bot.onText(/\/categories$/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "📚 Available categories:\n" +
            "➡️ /categories life\n" +
            "➡️ /categories love\n" +
            "➡️ /categories wisdom"
        );
    });

    return bot;
}
