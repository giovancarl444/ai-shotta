require('dotenv').config();
const { readQueue, writeQueue } = require('./utils/queue');
const states                    = require('./constants/queueStates');
const scoreToken                = require('./scoring/scoreToken');
const simulateSnipes            = require('./simulation/simulateSnipes');

const INTERVAL = parseInt(process.env.PROCESS_INTERVAL_MS, 10) || 5000;
let busy = false;

async function tick() {
  if (busy) return;
  busy = true;

  const queue = readQueue();

  // 1) Score all DETECTED tokens
  for (const item of queue.filter(t => t.status === states.DETECTED)) {
    try {
      const { score } = await scoreToken(item.address);
      item.score  = score;
      item.status = states.READY;
    } catch (err) {
      console.error(`Error scoring ${item.address}:`, err.message);
    }
  }

  // 2) Simulate all READY tokens
  for (const item of queue.filter(t => t.status === states.READY)) {
    try {
      const result = await simulateSnipes(item.address);
      item.result = result;
      item.status = states.COMPLETED;
    } catch (err) {
      console.error(`Error simulating ${item.address}:`, err.message);
    }
  }

  writeQueue(queue);
  busy = false;
}

console.info('🔁 Snipe engine started');
setInterval(tick, INTERVAL);
tick();
