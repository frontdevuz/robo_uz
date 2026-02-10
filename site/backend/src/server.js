import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN missing. Create .env from .env.example and set BOT_TOKEN.");
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(token, { polling: true });

app.get("/health", (req, res) => res.json({ ok: true }));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Salom! Men ROBOFUTURE botman. Yozing: /menu");
});

bot.onText(/\/menu/, (msg) => {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Robotlar", callback_data: "robots" }],
        [{ text: "Robo kelajak", callback_data: "future" }],
        [{ text: "Savatcha", callback_data: "cart" }]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, "Menyuni tanlang:", opts);
});

bot.on("callback_query", (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  if (query.data === "robots") {
    bot.sendMessage(chatId, "Robotlar: Atlas-Lite, Guardian-S, Nova-Care");
  } else if (query.data === "future") {
    bot.sendMessage(chatId, "Robo kelajak: AI + Etika + Xavfsiz aloqa");
  } else if (query.data === "cart") {
    bot.sendMessage(chatId, "Savatcha: Hozircha bo'sh. Demo effektlar frontendda.");
  }
  bot.answerCallbackQuery(query.id);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
