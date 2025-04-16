require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { enrichToken } = require('./fetchMetadata');
const { scoreToken } = require('./scoring/scoreToken');
const { simulateSnipe } = require('./simulation/simulateSnipes');

const queuePath = path.join(__dirname, 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

async function processQueue() {
  const queue = readQueue();
  let updated = false;

  for (let token of queue) {
    if (token.status !== 'pending') continue;

    console.log(`🔍 Processing ${token.token}...`);

    // Ensure retry tracking and status
    token.retryCount = token.retryCount || 0;
    token.metadataStatus = token.metadataStatus || 'missing';

    // 1. Try to enrich
    if (!token.symbol) {
      const enriched = await enrichToken(token);

      if (enriched.enriched) {
        token = Object.assign(token, enriched);
        token.metadataStatus = 'complete';
        updated = true;
      } else {
        token.retryCount++;
        token.metadataStatus = 'retrying';
        console.log(`⏳ Retry #${token.retryCount} for ${token.token}`);
      }
    }

    // 2. Score even if enrichment failed
    if (token.aiScore === undefined) {
      token.aiScore = scoreToken(token);
      updated = true;
    }

    // 3. Simulate even without perfect data
    if (token.aiScore >= 70 && token.status === 'pending') {
      const result = simulateSnipe(token);
      token.status = result.success ? 'sniped' : 'skipped';
      token.simulatedProfit = result.profit;
      updated = true;
    } else if (token.status === 'pending') {
      token.status = 'skipped';
    }
  }

  if (updated) {
    writeQueue(queue);
    console.log('✅ Queue updated.');
  } else {
    console.log('⏸ Nothing new to process.');
  }
}

setInterval(processQueue, 5000);
console.log('🚀 Snipe Engine started...');
