// utils/queue.js
const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.resolve(__dirname, '../data/snipingQueue.json');

/**
 * Read and parse the sniping queue.
 * @returns {Array<Object>}
 */
function readQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  const raw = fs.readFileSync(QUEUE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    // If corrupted, start fresh
    return [];
  }
}

/**
 * Overwrite the queue file with the given array.
 * @param {Array<Object>} queue 
 */
function writeQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

/**
 * Update a single entry in the queue by address.
 * Merges the provided fields into the existing entry.
 * @param {string} address 
 * @param {Object} updates 
 */
function updateQueueEntry(address, updates) {
  const queue = readQueue();
  const idx = queue.findIndex(e => e.address === address);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    writeQueue(queue);
  }
}

module.exports = { readQueue, writeQueue, updateQueueEntry };
