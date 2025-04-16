const fs = require('fs');
const axios = require('axios');
const path = require('path');

const queuePath = path.join(__dirname, 'data', 'snipingQueue.json');
const logPath = path.join(__dirname, 'logs', 'sniperLog.csv');

// Make sure logs folder exists
if (!fs.existsSync(path.dirname(logPath))) {
  fs.mkdirSync(path.dirname(logPath));
}

function readQueue() {
  const raw = fs.readFileSync(queuePath, 'utf8');
  return JSON.parse(raw);
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function logResult(entry) {
  const exists = fs.existsSync(logPath);
  const line = `${entry.token},${entry.status},${entry.aiScore},${entry.reason},${new Date().toISOString()}\n`;
  if (!exists) {
    fs.writeFileSync(logPath, 'Token,Status,AI Score,Reason,Time\n');
  }
  fs.appendFileSync(logPath, line);
}

async function rateToken(tokenName, tokenAddress) {
  const prompt = `You are a memecoin sniper bot. Evaluate this token:
Name: ${tokenName}
Address: ${tokenAddress}

Rate it from 1–10 for sniper potential. Justify your answer in one sentence.`;
  
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: "llama3",
    prompt: prompt,
    stream: false
  });

  const reply = response.data.response;
  const score = parseInt(reply.match(/\d+/)?.[0] || '0');
  return { score, reason: reply };
}

async function runSniper() {
  const queue = readQueue();

  for (let token of queue) {
    if (token.status !== 'pending') continue;

    console.log(`🎯 Evaluating ${token.token}...`);
    const { score, reason } = await rateToken(token.token, token.address);
    token.aiScore = score;
    token.reason = reason;

    if (score >= 8) {
      token.status = 'sniped';
      console.log(`✅ Sniped ${token.token} — Score ${score}`);
    } else {
      token.status = 'skipped';
      console.log(`🚫 Skipped ${token.token} — Score ${score}`);
    }

    logResult(token);
  }

  writeQueue(queue);
  console.log(`💾 Queue updated. Log saved to logs/sniperLog.csv`);
}

setInterval(runSniper, 10000); // runs every 10 seconds
runSniper();
