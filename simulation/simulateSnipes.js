const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');
const resultPath = path.join(__dirname, '..', 'data', 'snipingResults.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function appendResults(results) {
  let existing = [];
  if (fs.existsSync(resultPath)) {
    existing = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  }
  fs.writeFileSync(resultPath, JSON.stringify([...existing, ...results], null, 2));
}

function simulateSnipe(token) {
  const profit = Math.random() > 0.5 
    ? Math.random() * 500 
    : -Math.random() * 100; // Gain or loss
  return {
    ...token,
    simulatedAt: new Date().toISOString(),
    estimatedProfitUSD: parseFloat(profit.toFixed(2)),
    result: profit >= 0 ? '✅ PROFIT' : '❌ LOSS'
  };
}

function run() {
  const queue = readQueue();
  const ready = queue.filter(t => t.status === 'ready');

  if (ready.length === 0) {
    console.log('🔁 No tokens ready to simulate.');
    return;
  }

  const results = [];
  for (const token of ready) {
    const simulation = simulateSnipe(token);
    console.log(`🎯 Simulated ${token.token}: ${simulation.result} ($${simulation.estimatedProfitUSD})`);

    // Update original token status
    token.status = 'simulated';
    results.push(simulation);
  }

  appendResults(results);
  writeQueue(queue);
  console.log(`✅ Simulated ${results.length} tokens.`);
}

run();
