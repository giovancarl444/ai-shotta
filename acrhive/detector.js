require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

let offset = 0;

const queuePath = path.join(__dirname, 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  const raw = fs.readFileSync(queuePath, 'utf8');
  return JSON.parse(raw);
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

async function fetchNewTokens(limit = 10) {
  const url = `https://public-api.birdeye.so/defi/tokenlist?limit=20&offset=${offset}`;
  offset = (offset + 20) % 1000; // Rotate through 0–980

  console.log(`🔍 Scanning offset ${offset}...`);

  const res = await axios.get(url, {
    headers: {
      'accept': 'application/json',
      'X-API-KEY': process.env.BIRDEYE_API_KEY
    }
  });

  const all = res.data.data.tokens || [];

  const sorted = all
    .filter(t => t.name && t.address && t.name.length <= 15)
    .slice(0, limit);

  return sorted.map(t => ({
    token: t.name,
    address: t.address,
    detectedAt: new Date().toISOString(),
    status: 'pending'
  }));
}

async function runDetector() {
  const queue = readQueue();
  const newTokens = await fetchNewTokens();

  let added = 0;

  newTokens.forEach(token => {
    const exists = queue.find(q => q.address === token.address);
    if (!exists) {
      queue.push(token);
      added++;
    }
  });

  if (added > 0) {
    console.log(`🆕 Added ${added} new tokens to queue.`);
    writeQueue(queue);
  } else {
    console.log(`🔁 No new tokens found.`);
  }
}

setInterval(runDetector, 1200); // 1 call per second = max API usage
runDetector();
