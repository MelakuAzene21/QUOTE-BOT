// index.js
import { startBot } from "./bot.js";
import http from "http";

async function main() {
    // Start the Telegram bot
    await startBot();

    // Create a minimal HTTP server
    const PORT = process.env.PORT || 5000;
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("🚀 Quote Bot is running and connected to Telegram!");
    });

    server.listen(PORT, () => {
        console.log(`✅ Server listening on port ${PORT}`);
    });
}

main().catch((err) => {
    console.error("❌ Failed to start application:", err);
});
