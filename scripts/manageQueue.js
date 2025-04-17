// scripts/manageQueue.js

const fs   = require('fs');
const path = require('path');
const queuePath = path.resolve(__dirname, '..', 'data', 'snipingQueue.json');

/**
 * Migrate all `pending` → `detected`.
 */
function migrate() {
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  let changed = false;
  queue.forEach(e => {
    if (e.status === 'pending') {
      e.status = 'detected';
      delete e.score;
      e.source = e.source || 'manual';
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
    console.log('✅ Migrated pending → detected');
  } else {
    console.log('⏸ Nothing to migrate');
  }
}

/**
 * Remove all non-`detected` or `retryLater` entries
 * (i.e. cleaned out tokens we’ve already processed or skipped).
 */
function cleanup() {
  const valid = new Set(['detected', 'retryLater']);
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const filtered = queue.filter(e => valid.has(e.status));
  fs.writeFileSync(queuePath, JSON.stringify(filtered, null, 2));
  console.log(`✅ Cleaned queue: kept ${filtered.length}/${queue.length} entries`);
}

// Read command from CLI
const cmd = process.argv[2];
if (cmd === 'migrate') {
  migrate();
} else if (cmd === 'cleanup') {
  cleanup();
} else {
  console.log('Usage: node manageQueue.js <migrate|cleanup>');
  process.exit(1);
}
