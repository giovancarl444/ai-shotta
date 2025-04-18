#!/usr/bin/env node
// scripts/manageQueue.js

require('dotenv').config();
const { readQueue, writeQueue } = require('../utils/queue');
const states = require('../constants/queueStates');

async function migrate() {
  const q = readQueue().map(item =>
    item.status === states.PENDING
      ? { ...item, status: states.DETECTED }
      : item
  );
  writeQueue(q);
  console.log('✅ Migrated all PENDING → DETECTED');
}

async function cleanup() {
  const cutoff = Date.now() - (parseInt(process.env.CLEANUP_MAX_AGE_MS) || 24*3600*1000);
  const before = readQueue().length;
  const pruned = readQueue().filter(item => {
    if (item.status === states.SKIPPED) return false;
    if (item.status === states.DETECTED && new Date(item.detectedAt).getTime() < cutoff)
      return false;
    return true;
  });
  writeQueue(pruned);
  console.log(`✅ Cleaned up ${before - pruned.length} entries`);
}

const cmd = process.argv[2];
if (cmd === 'migrate') migrate();
else if (cmd === 'cleanup') cleanup();
else {
  console.error('Usage: node manageQueue.js [migrate|cleanup]');
  process.exit(1);
}
