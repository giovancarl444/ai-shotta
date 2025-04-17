const instantEnrich = require('../enrichment/instantEnrich');
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

const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', () => {
  console.log('✅ Connected to PumpPortal');
  const payload = {
    method: 'subscribeNewToken',
  };
  ws.send(JSON.stringify(payload));
  setTimeout(() => {
    ws.emit('message', JSON.stringify({
      method: 'newToken',
      data: {
        name: 'TestToken',
        address: 'FAKE1234567890123456789012345678901234567890'
      }
    }));
  }, 3000);  
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'newToken' && msg.data) {
      const token = msg.data;
      const queue = readQueue();
  
      const alreadyExists = queue.find(t => t.address === token.address);
      if (!alreadyExists) {
        (async () => {
          const enriched = await instantEnrich(token.address || address);
          if (enriched) {
            queue.push({
              ...enriched,
              detectedAt: new Date().toISOString(),
              status: 'enriched',
              source: 'pump.fun' // or 'moralis'
            });
            console.log(`✅ Instantly enriched ${enriched.symbol}`);
          } else {
            queue.push({
              address: token.address || address,
              detectedAt: new Date().toISOString(),
              status: 'retryLater',
              source: 'pump.fun' // or 'moralis'
            });
            console.warn(`❌ Enrich failed, will retry later`);
          }
          writeQueue(queue);
        })();
    
        
        writeQueue(queue);
        console.log(`🆕 Sniped new token: ${token.name} (${token.address})`);
        console.log('📡 Incoming message:', msg);
      }
    }
  });
  

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err.message);
});
