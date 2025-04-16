const fs = require('fs');
const path = require('path');
const { scoreToken } = require('../scoring/scoreToken');

const queuePath = path.join(__dirname, 'data', 'snipingQueue.json');

function readQueue() {
  if (!fs.existsSync(queuePath)) return [];
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

function writeQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
}

function processQueue() {
  const queue = readQueue();
  let processed = 0;

  const updatedQueue = queue.map(token => {
    if (token.status !== 'pending') return token;

    const scored = scoreToken(token);
    const enriched = {
      ...token,
      score: scored,
      status: scored >= 70 ? 'ready' : 'skipped',
    };
    processed++;
    console.log(`⚙️ Processed ${token.token}: ${scored} => ${enriched.status}`);
    return enriched;
  });

  writeQueue(updatedQueue);
  console.log(`✅ Done. Processed ${processed} new token(s).`);
}

processQueue();
