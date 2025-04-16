const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function run() {
  const queue = readQueue();
  let flagged = 0;

  const updatedQueue = queue.map(token => {
    if (token.status === 'completed' && token.simulatedROI !== undefined) {
      const { simulatedROI, score } = token;

      // Example trigger logic: high score + ROI over 50%
      if (score >= 80 && simulatedROI > 50) {
        token.autoBuy = true;
        flagged++;
        console.log(`🚀 Flagged ${token.token} for live action (ROI: ${simulatedROI}%, Score: ${score})`);
      }
    }

    return token;
  });

  if (flagged > 0) {
    writeQueue(updatedQueue);
    console.log(`✅ Flagged ${flagged} token(s) for sniper action.`);
  } else {
    console.log(`⚠️ No tokens met the reaction criteria.`);
  }
}

run();
