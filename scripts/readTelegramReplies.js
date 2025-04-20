// scripts/readTelegramReplies.js
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
let lastUpdateId = 0;

async function checkMessages() {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
    const updates = res.data.result;

    for (const update of updates) {
      if (!update.message) continue;

      const msg = update.message;
      lastUpdateId = update.update_id;

      const text = msg.text.trim();
      console.log(`📩 Telegram replied: ${text}`);

      if (text.startsWith('/gpt_key ')) {
        const key = text.split(' ')[1];
        fs.appendFileSync('.env', `\nOPENAI_API_KEY=${key}`);
        console.log('✅ GPT key saved from Telegram.');
      }

      if (text === '/approve_live_snipe') {
        fs.writeFileSync('approval.json', JSON.stringify({ approved: true }));
        console.log('✅ Live snipe approved via Telegram.');
      }
    }
  } catch (err) {
    console.error("❌ Error checking Telegram replies:", err.message);
  }
}

setInterval(checkMessages, 5000);
