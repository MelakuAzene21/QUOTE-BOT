// index.js
import { startBot } from "./bot.js";

async function main() {
    try {
        // Start the Telegram bot and get the Express app
        const { app } = await startBot();

        // Add health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                message: 'Quote Bot is running',
                timestamp: new Date().toISOString()
            });
        });

        // Add root endpoint
        app.get('/', (req, res) => {
            res.send('🚀 Quote Bot is running and connected to Telegram!');
        });

        // Start the Express server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✅ Server listening on port ${PORT}`);
            console.log(`🌐 Health check available at: /health`);

            // Log webhook URL for debugging
            if (process.env.RENDER_EXTERNAL_URL) {
                console.log(`🔗 Webhook URL: ${process.env.RENDER_EXTERNAL_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);
            }
        });

    } catch (err) {
        console.error("❌ Failed to start application:", err);
        process.exit(1);
    }
}

main();