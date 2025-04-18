const fs = require('fs');
const path = require('path');
const { instantEnrich } = require('../enrichment/instantEnrich');
const { scoreToken } = require('../scoring/scoreToken');
const { trackLearning } = require('../utils/trackLearning'); // ← new module

const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function mockSnipe(token) {
  const success = Math.random() < 0.9;
  const roi = parseFloat((Math.random() * 200 - 50).toFixed(2)); // -50% to +150%
  return { result: success ? 'sniped' : 'failed', roi };
}

function logResult(token, result, roi) {
  const symbol = token.symbol || token.token || '???';
  console.log(`${result === 'sniped' ? '🚀' : '❌'} ${symbol} (${token.address}) - ${result.toUpperCase()} | ROI: ${roi}%`);
}

async function run() {
  const queue = readQueue();
  let updated = 0;

  for (const token of queue) {
    if (token.status !== 'pending') continue;

    // Step 1: Enrich
    const enriched = await instantEnrich(token.address);
    if (!enriched) {
      token.status = 'skipped';
      token.reason = 'Failed to enrich';
      continue;
    }

    // Step 2: Score
    const score = await scoreToken({ ...token, ...enriched });
    token.score = score;
    token.enriched = enriched;

    // Step 3: Evaluate for sniping
    if (score >= 80) {
      const { result, roi } = mockSnipe(token);
      token.status = result;
      token.roi = roi;
      token.snipedAt = new Date().toISOString();
      trackLearning({ address: token.address, score, roi }); // ✅ new log
      logResult(token, result, roi);
      updated++;
    } else {
      token.status = 'scored';
    }
  }

  writeQueue(queue);

  if (updated > 0) {
    console.log(`✅ Attempted to snipe ${updated} token(s).`);
  } else {
    console.log(`⚠️ No tokens sniped (score < 80 or skipped).`);
  }
}

run();
