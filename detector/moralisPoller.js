// detector/moralisPoller.js
require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.MORALIS_API_KEY;
const POLL_INTERVAL = 10000; // 10 seconds
const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');
let seen = new Set();

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function addToken(address, tokenData = {}) {
  if (!address || seen.has(address)) return;

  const queue = readQueue();
  const exists = queue.some(t => t.address === address);
  if (exists) return;

  const token = {
    address,
    status: 'pending',
    addedAt: new Date().toISOString(),
    source: 'moralis',
    ...tokenData
  };

  queue.push(token);
  seen.add(address);
  writeQueue(queue);
  console.log(`🟢 New token: ${token.symbol || 'Unknown'} (${address})`);
}

async function fetchTokensFromMoralis() {
  const url = `https://deep-index.moralis.io/api/v2.2/discovery/tokens?chain=solana&limit=20`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const token of data.result) {
      const address = token.token_address || token.address;
      addToken(address, {
        symbol: token.symbol,
        name: token.name
      });
    }

  } catch (err) {
    console.error(`[moralisPoller] Error: ${err.message}`);
  }
}

async function loop() {
  await fetchTokensFromMoralis();
  setTimeout(loop, POLL_INTERVAL);
}

console.log("🚀 Polling Moralis for new tokens every 10s...");
loop();
