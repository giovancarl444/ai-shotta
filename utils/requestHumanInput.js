// utils/requestHumanInput.js
const notifyTelegram = require('./notifyTelegram');
const fs = require('fs');

module.exports = async function requestHumanInput({ prompt, type, waitForFile }) {
  const message = `🤖 OpenHands needs your input:\n\n📝 ${prompt}\n\n📨 Reply with: /${type} ...`;

  // Log request (optional)
  const requestLog = {
    type,
    prompt,
    status: 'waiting',
    timestamp: new Date().toISOString()
  };
  const logPath = 'pending-requests.json';
  const existing = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath)) : [];
  fs.writeFileSync(logPath, JSON.stringify([...existing, requestLog], null, 2));

  // Notify you via Telegram
  await notifyTelegram(message);

  // Wait for file update (poll loop)
  if (waitForFile) {
    console.log(`⏳ Waiting for human input in ${waitForFile}...`);
    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      if (fs.existsSync(waitForFile)) {
        const content = fs.readFileSync(waitForFile, 'utf-8');
        if (content.includes(type)) break;
      }
    }
    console.log(`✅ Input received, continuing...`);
  }
};
