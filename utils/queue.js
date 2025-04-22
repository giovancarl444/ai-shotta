// utils/queue.js
const fs   = require('fs');
const path = require('path');
const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
}

module.exports = { readQueue, writeQueue };
