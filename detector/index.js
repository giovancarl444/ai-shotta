// detector/index.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function addTokenToQueue(address) {
  if (!address || address.length < 30) return;

  const queue = readQueue();
  const alreadyExists = queue.some(t => t.address === address);
  if (alreadyExists) return;

  const token = {
    address,
    status: 'pending',
    addedAt: new Date().toISOString()
  };

  queue.push(token);
  writeQueue(queue);

  console.log(`🟢 New token detected: ${address}`);
}

function connectPumpWebSocket() {
  const ws = new WebSocket('wss://api.pump.fun/live/token/listed');

  ws.on('open', () => {
    console.log('🔌 Connected to Pump.fun WebSocket');
  });

  ws.on('message', (data) => {
    try {
      const json = JSON.parse(data);
      const address = json?.token;
      addTokenToQueue(address);
    } catch (err) {
      console.error('[detector] JSON parse error:', err.message);
    }
  });

  ws.on('error', (err) => {
    console.error('[detector] WebSocket error:', err.message);
  });

  ws.on('close', () => {
    console.warn('[detector] Disconnected. Reconnecting in 3s...');
    setTimeout(connectPumpWebSocket, 3000);
  });
}

connectPumpWebSocket();
