// utils/notifyTelegram.js
const axios = require('axios');
require('dotenv').config();

module.exports = async function notifyTelegram(message) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: `🤖 AI Shotta Alert:\n\n${message}`,
    });
    console.log("✅ Message sent to Telegram");
  } catch (err) {
    console.error("❌ Failed to send Telegram message:", err.message);
  }
};
