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
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const bot = new TelegramBot(token, { polling: true });

const events = [];
const sseClients = new Set();
const MAX_EVENTS = 200;

function pushEvent(type, payload) {
  const evt = {
    id: Date.now(),
    type,
    payload,
    ts: new Date().toISOString()
  };
  events.unshift(evt);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  const data = `data: ${JSON.stringify(evt)}\n\n`;
  for (const res of sseClients) res.write(data);
}

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/status", (req, res) => res.json({ ok: true, events: events.slice(0, 20) }));
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "hello", ts: new Date().toISOString() })}\n\n`);
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping", ts: new Date().toISOString() })}\n\n`);
  }, 15000);
  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Salom! Men ROBOFUTURE botman. Yozing: /menu");
  pushEvent("start", { chat: msg.chat.id, from: msg.from?.username || msg.from?.first_name || "user" });
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
  pushEvent("menu", { chat: msg.chat.id });
});

bot.on("callback_query", (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  if (query.data === "robots") {
    bot.sendMessage(chatId, "Robotlar: Atlas-Lite, Guardian-S, Nova-Care");
    pushEvent("robots", { chat: chatId });
  } else if (query.data === "future") {
    bot.sendMessage(chatId, "Robo kelajak: AI + Etika + Xavfsiz aloqa");
    pushEvent("future", { chat: chatId });
  } else if (query.data === "cart") {
    bot.sendMessage(chatId, "Savatcha: Hozircha bo'sh. Demo effektlar frontendda.");
    pushEvent("cart", { chat: chatId });
  }
  bot.answerCallbackQuery(query.id);
});

bot.on("message", (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    pushEvent("message", { chat: msg.chat.id, text: msg.text.slice(0, 200) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
