const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');
const backupPath = path.join(__dirname, '..', 'data', 'snipingQueue_backup.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function backupQueue(original) {
  fs.writeFileSync(backupPath, JSON.stringify(original, null, 2));
}

function cleanQueue(queue) {
  const seen = new Set();
  const cleaned = [];

  for (const token of queue) {
    const key = token.address?.toLowerCase();
    if (!key || seen.has(key)) continue;
    if (!token.token || !token.address) continue;

    seen.add(key);
    cleaned.push(token);
  }

  return cleaned;
}

function run() {
  const queue = readQueue();
  const cleaned = cleanQueue(queue);

  console.log(`🧹 Found ${queue.length - cleaned.length} duplicate or empty rows.`);
  backupQueue(queue);
  writeQueue(cleaned);
  console.log(`✅ Cleaned queue written. Backup saved as snipingQueue_backup.json`);
}

run();
