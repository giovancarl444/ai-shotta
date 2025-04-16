const instantEnrich = require('../enrichment/instantEnrich');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

let seen = new Set();

async function fetchNewTokens() {
  try {
    const res = await axios.get('https://mainnet.g.alchemy.com/v2/placeholder-endpoint-if-moralis-doesnt-have-it', {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'accept': 'application/json'
      }
    });

    const tokens = res.data.result || [];
    const queue = readQueue();
    let added = 0;

    for (const token of tokens) {
      const address = token.token_address;
      if (!address || seen.has(address)) continue;

      seen.add(address);

      const exists = queue.find(q => q.address === address);
      if (!exists) {
        (async () => {
          const enriched = await instantEnrich(address);
        
          if (enriched) {
            queue.push({
              ...enriched,
              detectedAt: new Date().toISOString(),
              status: 'enriched',
              source: 'moralis'
            });
            console.log(`✅ Instantly enriched ${enriched.symbol || address}`);
          } else {
            queue.push({
              token: token.name || token.symbol || 'Unnamed',
              address: address,
              detectedAt: new Date().toISOString(),
              status: 'retryLater',
              source: 'moralis'
            });
            console.warn(`❌ Enrichment failed for ${address}, queued for retry`);
          }
        
          writeQueue(queue);
        })();        
        console.log(`🆕 Moralis token: ${token.name} (${address})`);
        added++;
      }
    }

    if (added > 0) writeQueue(queue);
  } catch (err) {
    console.error('❌ Moralis token fetch error:', err.message);
  }
}

setInterval(fetchNewTokens, 5000);
fetchNewTokens();
