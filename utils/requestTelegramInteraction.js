// utils/requestTelegramInteraction.js
const notifyTelegram = require('./notifyTelegram');
const axios = require('axios');
require('dotenv').config();

let lastHandledId = 0;

module.exports = async function requestTelegramInteraction(question, waitFor = 'any') {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;

  // Ask the user
  await notifyTelegram(`❓ ${question}\n\n🧠 Reply with your answer below...`);

  console.log(`⏳ Waiting for response to: "${question}"`);

  while (true) {
    await new Promise(r => setTimeout(r, 4000));

    const res = await axios.get(`${url}?offset=${lastHandledId + 1}`);
    const updates = res.data.result;

    for (let update of updates) {
      const msg = update.message;
      if (!msg || msg.chat.id.toString() !== CHAT_ID) continue;

      lastHandledId = update.update_id;

      const text = msg.text.trim();
      if (!text) continue;

      console.log(`📩 Received: ${text}`);
      return text; // ← THIS is your response to continue logic
    }
  }
};
