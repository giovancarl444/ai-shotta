require('dotenv').config();
const WebSocket            = require('ws');
const { readQueue, writeQueue } = require('../utils/queue');
const { logEvent }         = require('../utils/logger');
const instantEnrich        = require('../enrichment/instantEnrich');
const states               = require('../constants/queueStates');

async function handleNewToken({ address, name }) {
  const queue = readQueue();
  if (queue.some(t => t.address === address)) return logEvent('info', `Already queued ${address}`);
  logEvent('info', `Detected new token: ${address}`);

  try {
    const enriched = await instantEnrich(address);
    const entry = enriched
      ? { ...enriched, detectedAt: new Date().toISOString(), status: states.ENRICHED, source: 'pump.fun' }
      : { token: name || address, address, detectedAt: new Date().toISOString(), status: states.RETRY_LATER, source: 'pump.fun' };

    queue.push(entry);
    writeQueue(queue);
    logEvent('info', `Queued ${entry.token} as ${entry.status}`);
  } catch (err) {
    logEvent('error', `Enrichment error for ${address}: ${err.message}`);
  }
}

function startWebSocket() {
  const url = process.env.PUMP_WS_URL || 'wss://pumpportal.fun/api/data';
  const ws  = new WebSocket(url);
  ws.on('open', () => {
    logEvent('info', 'Connected to Pump.fun WS');
    ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
  });

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.method === 'newToken') handleNewToken(msg.data);
    } catch (err) {
      logEvent('error', `WS parse error: ${err.message}`);
    }
  });

  ws.on('error', err => logEvent('error', `WS error: ${err.message}`));
}

startWebSocket();
