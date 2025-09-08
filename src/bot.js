// bot.js
import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { getRandomQuote } from "./api/quotes.js";
import { generateQuoteImage } from "./utils/quoteImage.js";
import cron from "node-cron";
import { Subscriber } from "./models/Subscriber.js";
export async function startBot() {
    try {
        // Connect to MongoDB with proper options
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 30000, // 30 second socket timeout
        });
        console.log("✅ Connected to MongoDB");

        // Handle connection events for better monitoring
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔁 MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);

        // Provide specific error messages for common issues
        if (error.code === 'ETIMEOUT') {
            console.error('💡 Tip: Check your internet connection and MongoDB Atlas whitelist settings');
        } else if (error.code === 'ENOTFOUND') {
            console.error('💡 Tip: Check your MongoDB connection string and cluster URL');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Tip: MongoDB server might be down or credentials are incorrect');
        }

        // Exit the process with error code
        process.exit(1);
    }


    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log("🚀 Quote Bot is running...");

    // /start command
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "👋 Hello! I am Quote Generator Bot.\n\n" +
            "Commands:\n" +
            "➡️ /quote - Get a random quote\n" +
            "➡️ /subscribe - Get daily quote\n" +
            "➡️ /unsubscribe - Stop daily quote"
        );
    });

    // /quote command
    bot.onText(/\/quote/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendChatAction(chatId, "typing");

        const { content, author } = await getRandomQuote();
        const imageBuffer = await generateQuoteImage(content, author);

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `📝 Here’s your quote!\n- ${author}`,
        });
    });

    // /subscribe command
    bot.onText(/\/subscribe/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            await Subscriber.updateOne(
                { chatId },
                { chatId },
                { upsert: true }
            );
            bot.sendMessage(chatId, "✅ You are subscribed! You'll receive daily quotes.");
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "⚠️ Subscription failed. Try again.");
        }
    });

    // /unsubscribe command
    bot.onText(/\/unsubscribe/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            await Subscriber.deleteOne({ chatId });
            bot.sendMessage(chatId, "❌ You are unsubscribed from daily quotes.");
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "⚠️ Unsubscription failed. Try again.");
        }
    });

    // Daily scheduled quotes at 9:00 AM Africa/Nairobi timezone
    cron.schedule("0 9 * * *", async () => {
        console.log("🚀 Sending daily quotes...");
        const subscribers = await Subscriber.find({});
        for (const sub of subscribers) {
            try {
                const { content, author } = await getRandomQuote();
                const imageBuffer = await generateQuoteImage(content, author);
                await bot.sendPhoto(sub.chatId, imageBuffer, {
                    caption: `📅 Daily Quote\n📝 ${content}\n- ${author}`,
                });
            } catch (error) {
                console.error(`Failed to send daily quote to ${sub.chatId}:`, error.message);
            }
        }
    }, {
        timezone: "Africa/Nairobi"
    });

    return bot;
}
