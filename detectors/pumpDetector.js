// detectors/pumpDetector.js
require('dotenv').config();
const WebSocket            = require('ws');
const { readQueue, writeQueue } = require('../utils/queue');
const { logEvent }         = require('../utils/logger');
const instantEnrich        = require('../enrichment/instantEnrich');
const states               = require('../constants/queueStates');

async function handleNewToken({ address, name }) {
  const queue = readQueue();
  if (queue.some(t => t.address === address)) return logEvent('info', `Token ${address} already in queue`);
  logEvent('info', `Detected new token ${address}`);
  try {
    const enriched = await instantEnrich(address);
    const entry = enriched
      ? {...enriched, detectedAt: new Date().toISOString(), status: states.ENRICHED, source: 'pump.fun' }
      : { token: name || address, address, detectedAt: new Date().toISOString(), status: states.RETRY_LATER, source: 'pump.fun' };
    queue.push(entry);
    writeQueue(queue);
    logEvent('info', `Queued ${entry.token} as ${entry.status}`);
  } catch (err) {
    logEvent('error', `Error enriching ${address}: ${err.message}`);
  }
}

function startWebSocket() {
  const ws = new WebSocket(process.env.PUMP_WS_URL || 'wss://pumpportal.fun/api/data');
  ws.on('open', () => {
    logEvent('info', '✅ Connected to PumpPortal WS');
    ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
    // DEV-only injection
    setTimeout(() => {
      const test = { method:'newToken', data:{ name:'DevToken', address:'DEVTKN1234567890' } };
      logEvent('info', '🧪 DEV injecting fake token', test);
      ws.emit('message', JSON.stringify(test));
    }, 3000);
  });

  ws.on('message', async raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.method === 'newToken' && msg.data?.address) {
        await handleNewToken(msg.data);
      }
    } catch (e) {
      logEvent('error', `WS parse error: ${e.message}`);
    }
  });

  ws.on('error', err => logEvent('error', `WS error: ${err.message}`));
}

startWebSocket();
