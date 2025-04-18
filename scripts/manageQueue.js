#!/usr/bin/env node
// scripts/manageQueue.js

require('dotenv').config();
const { readQueue, writeQueue } = require('../utils/queue');
const states = require('../constants/queueStates');

async function migrate() {
  const queue = readQueue();
  let changed = false;
  const now = Date.now();

  queue.forEach((item, i) => {
    if (item.status === states.PENDING) {
      queue[i].status = states.DETECTED;
      changed = true;
    }
  });

  if (changed) {
    writeQueue(queue);
    console.log('✅ Migrated all PENDING → DETECTED');
  } else {
    console.log('⚠️  No PENDING tokens to migrate');
  }
}

async function cleanup() {
  const queue = readQueue();
  const cutoff = Date.now() - (process.env.CLEANUP_MAX_AGE_MS || 24*3600*1000);
  const before = queue.length;
  // Remove entries DETECTED older than cutoff, or SKIPPED
  const pruned = queue.filter(item => {
    if (item.status === states.SKIPPED) return false;
    if (item.status === states.DETECTED && new Date(item.detectedAt).getTime() < cutoff) {
      return false;
    }
    return true;
  });
  if (pruned.length !== before) {
    writeQueue(pruned);
    console.log(`✅ Cleaned up ${before - pruned.length} old/skipped entries`);
  } else {
    console.log('⚠️  Nothing to clean up');
  }
}

(async () => {
  const cmd = process.argv[2];
  if (cmd === 'migrate') {
    await migrate();
  } else if (cmd === 'cleanup') {
    await cleanup();
  } else {
    console.error('Usage: manageQueue.js [migrate|cleanup]');
    process.exit(1);
  }
})();
