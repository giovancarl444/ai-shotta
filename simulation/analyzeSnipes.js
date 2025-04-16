const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function analyzeCompletedSnipes(queue) {
  const completed = queue.filter(t => t.status === 'completed');

  if (completed.length === 0) {
    console.log('⚠️ No completed snipes to analyze.');
    return;
  }

  let wins = 0;
  let losses = 0;
  let totalROI = 0;

  completed.forEach(token => {
    const buyPrice = token.buyPrice || (Math.random() * 0.005 + 0.001); // Random small buy price
    const sellPrice = token.sellPrice || (Math.random() * 0.01 + 0.001); // Random sell price

    const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
    totalROI += profitPercent;

    if (profitPercent > 0) wins++;
    else losses++;

    console.log(`📊 ${token.token} | ROI: ${profitPercent.toFixed(2)}%`);
  });

  const total = wins + losses;
  console.log('\n🔎 Summary:');
  console.log(`✅ Wins: ${wins}`);
  console.log(`❌ Losses: ${losses}`);
  console.log(`📈 Win Rate: ${(wins / total * 100).toFixed(2)}%`);
  console.log(`💰 Avg ROI: ${(totalROI / total).toFixed(2)}%`);
}

const queue = readQueue();
analyzeCompletedSnipes(queue);
