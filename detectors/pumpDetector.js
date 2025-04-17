// detectors/pumpDetector.js
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const { readQueue, writeQueue } = require('../utils/queue');
const { logEvent } = require('../utils/logger');
const states = require('../constants/queueStates');
const instantEnrich = require('../enrichment/instantEnrich');

// Shared handler for new tokens
async function handleNewToken(address) {
  const queue = readQueue();
  if (queue.some(t => t.address === address)) {
    logEvent('info', `Token ${address} already in queue`);
    return;
  }

  logEvent('info', `Handling new token ${address}`);
  const enriched = await instantEnrich(address);

  if (enriched) {
    const entry = {
      ...enriched,
      detectedAt: new Date().toISOString(),
      status: states.ENRICHED,
      source: 'pump.fun',
      lastUpdated: new Date().toISOString()
    };
    queue.push(entry);
    logEvent('info', `Queued enriched token ${enriched.symbol || address}`);
  } else {
    const entry = {
      address,
      detectedAt: new Date().toISOString(),
      status: states.RETRY_LATER,
      source: 'pump.fun',
      lastUpdated: new Date().toISOString()
    };
    queue.push(entry);
    logEvent('warn', `Enrich failed, queued ${address} for retry later`);
  }

  writeQueue(queue);
}

// 1) WebSocket subscription
function startWebSocket() {
  const ws = new WebSocket('wss://pumpportal.fun/api/data');

  ws.on('open', () => {
    logEvent('info', 'Connected to PumpPortal WS');
    ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
  });

  ws.on('message', async raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.method === 'newToken' && msg.data?.address) {
        await handleNewToken(msg.data.address);
      }
    } catch (err) {
      logEvent('error', `WS message parse error: ${err.message}`);
    }
  });

  ws.on('error', err => logEvent('error', `WS error: ${err.message}`));
}

// 2) HTTP‑poll fallback
targetURL = 'https://frontend-api.pump.fun/coins/currently-live';
function startHttpPoll() {
  setInterval(async () => {
    try {
      const res = await axios.get(targetURL);
      const list = Array.isArray(res.data) ? res.data : res.data.coins || [];
      for (const token of list) {
        const addr = token.address || token.tokenAddress;
        if (addr) await handleNewToken(addr);
      }
    } catch (err) {
      logEvent('error', `HTTP poll error: ${err.message}`);
    }
  }, 5000);
}

// Bootstrap
(async () => {
  startWebSocket();
  startHttpPoll();
})();
