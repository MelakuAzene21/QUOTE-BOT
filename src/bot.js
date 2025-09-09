// bot.js
import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { getRandomQuote, getQuoteByCategory } from "./api/quotes.js";
import { generateQuoteImage } from "./utils/quoteImage.js";
import cron from "node-cron";
import { Subscriber } from "./models/Subscriber.js";
import express from "express";

// Create Express app for webhook handling
const app = express();
app.use(express.json()); // For parsing application/json
console.log('✅ Webhook set to: ',env.RENDER_EXTERNAL_URL);

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

    // Initialize bot with webhook option (no polling)
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
        polling: false, // Disable polling
        onlyFirstMatch: true // Only use the first matching handler
    });

    // Set up webhook endpoint
    const webhookPath = `/webhook/${env.TELEGRAM_BOT_TOKEN}`;

    app.post(webhookPath, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    // Set webhook on startup
    try {
        const webhookUrl = `${env.RENDER_EXTERNAL_URL}${webhookPath}`;
        await bot.setWebHook(webhookUrl);
        console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (error) {
        console.error('❌ Failed to set webhook:', error);
    }

    console.log("🚀 Quote Bot is running with webhooks...");

    // /start command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;

        bot.sendMessage(
            chatId,
            "🌟 *Welcome to Quote Generator Bot!*\n\n✨ Get inspired with beautiful quotes from various categories\n🎯 Choose from Motivation, Love, Life, Science, and Funny quotes\n📅 Subscribe for daily quotes at 9:00 AM\n\n*What would you like to do?*",
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎲 Random Quote", callback_data: "quote" },
                            { text: "🎯 Categories", callback_data: "category_menu" }
                        ],
                        [
                            { text: "📅 Subscribe", callback_data: "subscribe" },
                            { text: "❌ Unsubscribe", callback_data: "unsubscribe" }
                        ],
                        [
                            { text: "❓ Help & Commands", callback_data: "help" }
                        ]
                    ],
                },
            }
        );
    });

    // Handle button clicks
    bot.on("callback_query", async (query) => {
        const chatId = query.message.chat.id;
        const action = query.data;

        if (action === "quote") {
            await bot.sendChatAction(chatId, "typing");
            const { content, author } = await getRandomQuote();
            const imageBuffer = await generateQuoteImage(content, author);
            await bot.sendPhoto(chatId, imageBuffer, {
                caption: `🎲 *Random Quote*\n\n📝 "${content}"\n\n— *${author}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 Another Random", callback_data: "quote" },
                            { text: "🎯 Categories", callback_data: "category_menu" }
                        ],
                        [
                            { text: "🏠 Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action === "category_menu") {
            await bot.sendMessage(chatId, "🎯 *Choose a Quote Category:*\n\n✨ Select from our curated collection of inspiring quotes!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "💪 Motivation", callback_data: "category:motivation" },
                            { text: "❤️ Love", callback_data: "category:love" }
                        ],
                        [
                            { text: "🌿 Life", callback_data: "category:life" },
                            { text: "🔬 Science", callback_data: "category:science" }
                        ],
                        [
                            { text: "😂 Funny", callback_data: "category:funny" }
                        ],
                        [
                            { text: "🔙 Back to Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action.startsWith("category:")) {
            const category = action.split(":")[1];
            await bot.sendChatAction(chatId, "typing");
            const { content, author } = await getQuoteByCategory(category);
            const imageBuffer = await generateQuoteImage(content, author);
            
            const categoryEmojis = {
                motivation: "💪",
                love: "❤️",
                life: "🌿",
                science: "🔬",
                funny: "😂"
            };
            
            const emoji = categoryEmojis[category] || "🎯";
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            await bot.sendPhoto(chatId, imageBuffer, {
                caption: `${emoji} *${categoryName} Quote*\n\n📝 "${content}"\n\n— *${author}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 Another Quote", callback_data: `category:${category}` },
                            { text: "🎲 Random", callback_data: "quote" }
                        ],
                        [
                            { text: "🔙 Back to Categories", callback_data: "category_menu" },
                            { text: "🏠 Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action === "subscribe") {
            await bot.sendChatAction(chatId, "typing");
            await Subscriber.updateOne({ chatId }, { chatId }, { upsert: true });
            bot.sendMessage(chatId, "🎉 *Successfully Subscribed!*\n\n📅 You'll receive daily inspirational quotes at 9:00 AM (Africa/Nairobi time)\n\n✨ Get ready to be inspired every morning!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🏠 Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action === "unsubscribe") {
            await bot.sendChatAction(chatId, "typing");
            await Subscriber.deleteOne({ chatId });
            bot.sendMessage(chatId, "😢 *Unsubscribed Successfully*\n\nYou won't receive daily quotes anymore.\n\n💡 You can always subscribe again anytime!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📅 Subscribe Again", callback_data: "subscribe" },
                            { text: "🏠 Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action === "help") {
            await bot.sendMessage(chatId, "❓ *Help & Commands Guide*\n\n*Available Commands:*\n\n🎲 `/quote` - Get a random quote\n🎯 `/quote <category>` - Get quote by category\n📅 `/subscribe` - Subscribe to daily quotes\n❌ `/unsubscribe` - Unsubscribe from daily quotes\n❓ `/help` - Show this help message\n\n*Available Categories:*\n💪 Motivation\n❤️ Love\n🌿 Life\n🔬 Science\n😂 Funny\n\n*Examples:*\n• `/quote motivation`\n• `/quote love`\n• `/quote funny`\n\n*Features:*\n✨ Beautiful quote images\n🎯 Category-based quotes\n📅 Daily subscription\n🔄 Interactive buttons\n\n*Need more help?* Just use the buttons below!", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎲 Try Random Quote", callback_data: "quote" },
                            { text: "🎯 Browse Categories", callback_data: "category_menu" }
                        ],
                        [
                            { text: "🏠 Main Menu", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else if (action === "main_menu") {
            await bot.sendMessage(chatId, "🌟 *Welcome to Quote Generator Bot!*\n\n✨ Get inspired with beautiful quotes from various categories\n🎯 Choose from Motivation, Love, Life, Science, and Funny quotes\n📅 Subscribe for daily quotes at 9:00 AM\n\n*What would you like to do?*", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎲 Random Quote", callback_data: "quote" },
                            { text: "🎯 Categories", callback_data: "category_menu" }
                        ],
                        [
                            { text: "📅 Subscribe", callback_data: "subscribe" },
                            { text: "❌ Unsubscribe", callback_data: "unsubscribe" }
                        ],
                        [
                            { text: "❓ Help & Commands", callback_data: "help" }
                        ]
                    ],
                },
            });
        }

        // Acknowledge button press (removes loading animation on button)
        bot.answerCallbackQuery(query.id);
    });

    // Listen for all messages
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;

        // ✅ If the message is not text (voice, audio, video, etc.)
        if (!msg.text) {
            return bot.sendMessage(
                chatId,
                "⚠️ *I can only understand text messages.*\n\nPlease use the interactive buttons below to get started!",
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🎲 Random Quote", callback_data: "quote" },
                                { text: "🎯 Categories", callback_data: "category_menu" }
                            ],
                            [
                                { text: "📅 Subscribe", callback_data: "subscribe" },
                                { text: "❌ Unsubscribe", callback_data: "unsubscribe" }
                            ],
                            [
                                { text: "❓ Help & Commands", callback_data: "help" }
                            ]
                        ],
                    },
                }
            );
        }

        // ✅ If the message is text but not recognized
        if (
            msg.text !== "🎲 Random Quote" &&
            msg.text !== "🎯 Categories" &&
            msg.text !== "📅 Subscribe" &&
            msg.text !== "❌ Unsubscribe" &&
            msg.text !== "❓ Help & Commands" &&
            !msg.text.startsWith("/start") &&
            !msg.text.startsWith("/quote") &&
            !msg.text.startsWith("/subscribe") &&
            !msg.text.startsWith("/unsubscribe") &&
            !msg.text.startsWith("/help")
        ) {
            return bot.sendMessage(
                chatId,
                "🤔 *I didn't understand that message.*\n\n💡 Try using the buttons below or type `/help` to see all available commands!",
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🎲 Random Quote", callback_data: "quote" },
                                { text: "🎯 Categories", callback_data: "category_menu" }
                            ],
                            [
                                { text: "📅 Subscribe", callback_data: "subscribe" },
                                { text: "❌ Unsubscribe", callback_data: "unsubscribe" }
                            ],
                            [
                                { text: "❓ Help & Commands", callback_data: "help" }
                            ]
                        ],
                    },
                }
            );
        }
    });

    // /quote command (supports optional category: /quote Motivation)
    bot.onText(/\/quote(?:\s+(\w+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        await bot.sendChatAction(chatId, "typing");

        const maybeCategory = match && match[1] ? match[1] : null;
        const useCategory = maybeCategory ? maybeCategory.toLowerCase() : null;

        const { content, author } = useCategory
            ? await getQuoteByCategory(useCategory)
            : await getRandomQuote();
        const imageBuffer = await generateQuoteImage(content, author);

        const categoryEmojis = {
            motivation: "💪",
            love: "❤️",
            life: "🌿",
            science: "🔬",
            funny: "😂"
        };

        const emoji = useCategory ? (categoryEmojis[useCategory] || "🎯") : "🎲";
        const captionPrefix = useCategory
            ? `${emoji} *${useCategory.charAt(0).toUpperCase()}${useCategory.slice(1)} Quote*`
            : "🎲 *Random Quote*";

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `${captionPrefix}\n\n📝 "${content}"\n\n— *${author}*`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 Another Quote", callback_data: useCategory ? `category:${useCategory}` : "quote" },
                        { text: "🎯 Categories", callback_data: "category_menu" }
                    ],
                    [
                        { text: "🏠 Main Menu", callback_data: "main_menu" }
                    ]
                ]
            }
        });
    });

    // /help command
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, "❓ *Help & Commands Guide*\n\n*Available Commands:*\n\n🎲 `/quote` - Get a random quote\n🎯 `/quote <category>` - Get quote by category\n📅 `/subscribe` - Subscribe to daily quotes\n❌ `/unsubscribe` - Unsubscribe from daily quotes\n❓ `/help` - Show this help message\n\n*Available Categories:*\n💪 Motivation\n❤️ Love\n🌿 Life\n🔬 Science\n😂 Funny\n\n*Examples:*\n• `/quote motivation`\n• `/quote love`\n• `/quote funny`\n\n*Features:*\n✨ Beautiful quote images\n🎯 Category-based quotes\n📅 Daily subscription\n🔄 Interactive buttons\n\n*Need more help?* Just use the buttons below!", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎲 Try Random Quote", callback_data: "quote" },
                        { text: "🎯 Browse Categories", callback_data: "category_menu" }
                    ],
                    [
                        { text: "🏠 Main Menu", callback_data: "main_menu" }
                    ]
                ]
            }
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
                    caption: `📅 *Daily Quote*\n\n📝 "${content}"\n\n— *${author}*`,
                    parse_mode: 'Markdown'
                });
            } catch (error) {
                console.error(`Failed to send daily quote to ${sub.chatId}:`, error.message);
            }
        }
    }, {
        timezone: "Africa/Nairobi"
    });

    return { bot, app };
}