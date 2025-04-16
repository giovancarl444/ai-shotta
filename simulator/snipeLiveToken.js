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

function mockSnipe(token) {
  // Simulated snipe logic – replace later with real tx call
  const success = Math.random() < 0.9; // 90% mock success
  return success ? 'sniped' : 'failed';
}

function logResult(token, result) {
  console.log(`${result === 'sniped' ? '🚀' : '❌'} ${token.token} (${token.address}) - ${result.toUpperCase()}`);
}

function run() {
  const queue = readQueue();

  let updated = 0;

  for (const token of queue) {
    if (token.status === 'pending' && token.score >= 80) {
      const result = mockSnipe(token);
      token.status = result;
      token.snipedAt = new Date().toISOString();
      logResult(token, result);
      updated++;
    }
  }

  if (updated > 0) {
    writeQueue(queue);
    console.log(`✅ Attempted to snipe ${updated} token(s).`);
  } else {
    console.log(`⚠️ No high-score pending tokens found to snipe.`);
  }
}

run();
