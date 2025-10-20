# Quote Bot 🤖

A Telegram bot that delivers inspiring quotes to users through an interactive interface. Users can request random quotes, browse quotes by category, and subscribe to receive daily quotes.

## 📋 Features

- **Random Quotes**: Get inspirational quotes on demand
- **Category-based Quotes**: Browse quotes by categories (Motivation, Love, Life, Science, Funny)
- **Daily Quote Subscription**: Receive a daily quote at 9:00 AM (Africa/Nairobi timezone)
- **Beautiful Quote Images**: Quotes are delivered as aesthetically designed images
- **Interactive Interface**: Easy-to-use buttons and commands
- **Webhook Support**: Optimized for deployment on platforms like Render

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB (with Mongoose)
- Telegram Bot API
- Canvas for image generation
- Axios for API requests
- Node-cron for scheduling

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quote-bot.git
   cd quote-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MONGO_URI=your_mongodb_connection_string
   RENDER_EXTERNAL_URL=your_deployment_url (for webhook setup)
   ```

## 🏃‍♂️ Running the Bot

### Development Mode
```bash
npm run dev
```
This uses Node.js watch mode to automatically restart the server when files change.

### Production Mode
```bash
npm start
```

## 📱 Bot Commands

- `/start` - Start the bot and see the main menu
- `/quote` - Get a random quote
- `/quote <category>` - Get a quote from a specific category (e.g., `/quote motivation`)
- `/subscribe` - Subscribe to daily quotes
- `/unsubscribe` - Unsubscribe from daily quotes
- `/help` - Show help and available commands

## 🗂️ Project Structure

```
quote-bot/
├── src/
│   ├── api/
│   │   └── quotes.js         # Quote API integration
│   ├── config/
│   │   └── env.js            # Environment configuration
│   ├── models/
│   │   └── Subscriber.js     # MongoDB model for subscribers
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── quoteImage.js     # Quote image generation
│   ├── bot.js               # Telegram bot implementation
│   └── index.js             # Application entry point
├── .env                     # Environment variables (create this)
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation
```

## 🔄 API Integration

The bot integrates with two quote APIs:
- **ZenQuotes API**: For random quotes
- **Quotable API**: For category-based quotes

## 📝 Deployment

This bot is designed to be deployed on platforms like Render that support webhooks. The webhook URL is automatically configured based on the `RENDER_EXTERNAL_URL` environment variable.

### Deployment Steps

1. Set up a MongoDB database (Atlas recommended)
2. Deploy to Render or similar platform
3. Set the required environment variables
4. The bot will automatically set up the webhook on startup

## 🔒 Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `MONGO_URI`: MongoDB connection string
- `RENDER_EXTERNAL_URL`: The URL of your deployed application (for webhook)

## 📊 Health Check

The application provides a health check endpoint at `/health` that returns the current status of the bot.

## 📜 License

ISC

---

Made with ❤️ for spreading daily inspiration