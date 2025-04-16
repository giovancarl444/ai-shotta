const { getNewTokens } = require('./scrapers/raydium');
const { rateToken } = require('./ai/tokenfilter'); // lowercase f
const { simulateTrade } = require('./simulator/snipeSimulator');

(async () => {
  const tokens = await getNewTokens();
  console.log(`📡 Scanning ${tokens.length} new tokens...`);

  for (let token of tokens.slice(0, 10)) {
    const name = token.name || "Unknown";
    const desc = token.baseMint || "No description";
    const socials = token.marketUrl || "No socials";

    const { score, reason } = await rateToken(name, desc, socials);

    if (score >= 6) {
      await simulateTrade(name, score);
    } else {
      console.log(`❌ Skipped ${name} [Score ${score}] - ${reason}`);
    }
  }

  console.log('✅ Simulation complete. Check CSV.');
})();
