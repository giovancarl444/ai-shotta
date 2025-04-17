// snipeEngine.js
require('dotenv').config();

const { readQueue, writeQueue, updateQueueEntry } = require('./utils/queue');
const { logEvent } = require('./utils/logger');
const states = require('./constants/queueStates');
const instantEnrich = require('./enrichment/instantEnrich');
const { scoreToken } = require('./scoring/scoreToken');
const { simulateSnipe } = require('./simulation/simulateSnipes');

// Max enrichment retries before skipping
const MAX_ENRICH_RETRIES = parseInt(process.env.ENRICH_MAX_RETRIES, 10) || 3;

/**
 * Main processing loop: enrichment, scoring, simulation
 */
async function processQueue() {
  logEvent('info', 'Snipe engine: starting queue processing');
  let queue = readQueue();
  let updated = false;

  // 1) Enrichment phase
  for (const entry of queue) {
    if (![states.DETECTED, states.RETRY_LATER].includes(entry.status)) continue;
    const addr = entry.address;
    const retries = entry.retryCount || 0;

    // If exceeded retries, skip permanently
    if (entry.status === states.RETRY_LATER && retries >= MAX_ENRICH_RETRIES) {
      updateQueueEntry(addr, { status: states.SKIPPED });
      logEvent('warn', `Max enrich retries reached for ${addr}, skipping`);
      updated = true;
      continue;
    }

    logEvent('info', `Enrichment phase for ${addr} (retry #${retries})`);
    try {
      const enriched = await instantEnrich(addr);
      if (enriched) {
        updateQueueEntry(addr, { ...enriched, status: states.ENRICHED, retryCount: 0 });
        logEvent('info', `Enriched ${addr}`);
      } else {
        updateQueueEntry(addr, { retryCount: retries + 1, status: states.RETRY_LATER });
        logEvent('warn', `Enrichment retry #${retries + 1} for ${addr}`);
      }
      updated = true;
    } catch (err) {
      // Treat unhandled errors as retry
      updateQueueEntry(addr, { retryCount: retries + 1, status: states.RETRY_LATER });
      logEvent('error', `Enrichment error for ${addr}: ${err.message} (retrying)`);
      updated = true;
    }
  }

  // Reload queue with updated statuses
  queue = readQueue();

  // 2) Scoring phase
  for (const entry of queue) {
    if (entry.status !== states.ENRICHED) continue;
    const addr = entry.address;
    logEvent('info', `Scoring phase for ${addr}`);
    try {
      const aiScore = await scoreToken(entry);
      updateQueueEntry(addr, { aiScore, status: states.SCORED });
      logEvent('info', `Scored ${addr}: ${aiScore}`);
      updated = true;
    } catch (err) {
      updateQueueEntry(addr, { status: states.SKIPPED });
      logEvent('error', `Scoring error for ${addr}: ${err.message}, skipping`);
      updated = true;
    }
  }

  // Reload queue for simulation
  queue = readQueue();

  // 3) Simulation phase
  for (const entry of queue) {
    if (entry.status !== states.SCORED) continue;
    const addr = entry.address;
    logEvent('info', `Simulation phase for ${addr}`);
    try {
      const result = await simulateSnipe(entry);
      const nextStatus = result.success ? states.READY : states.SKIPPED;
      updateQueueEntry(addr, { simulatedProfit: result.profit, status: nextStatus });
      logEvent('info', `Simulated ${addr}: ${nextStatus} (profit: ${result.profit})`);
      updated = true;
    } catch (err) {
      updateQueueEntry(addr, { status: states.SKIPPED });
      logEvent('error', `Simulation error for ${addr}: ${err.message}, skipping`);
      updated = true;
    }
  }

  if (updated) {
    writeQueue(readQueue());
    logEvent('info', '✅ Queue updated');
  } else {
    logEvent('info', '⏸ Nothing new to process');
  }
}

// Schedule processing
envInterval = parseInt(process.env.PROCESS_INTERVAL_MS, 10) || 5000;
setInterval(processQueue, envInterval);
logEvent('info', 'Snipe engine started');
