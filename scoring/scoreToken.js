// scoring/scoreToken.js
const {
  liquidityFilter,
  honeypotFilter,
  socialSignalFilter,
  technicalIndicatorFilter
} = require('../filters');
const weights = require('./weights.json');
const { logEvent } = require('../utils/logger');

/**
 * Compute a combined score for a token entry.
 * - Immediately skips if honeypot detected.
 * - Runs all filters, multiplies by weights, and sums.
 * @param {Object} entry  A queue entry with at least { address }
 * @returns {number}      The final score (0–100 scale)
 */
async function scoreToken(entry) {
  logEvent('info', `Scoring token ${entry.address}`);

  // 1) Honeypot check (immediate skip)
  const { honeypot } = await honeypotFilter(entry);
  if (honeypot) {
    logEvent('warn', `Honeypot detected – skipping ${entry.address}`);
    return 0;
  }

  // 2) Run each filter
  const { liquidityScore }       = await liquidityFilter(entry);
  const { socialScore }          = await socialSignalFilter(entry);
  const { technicalScore }       = await technicalIndicatorFilter(entry);

  // 3) Combine via weights
  const rawScore =
    (weights.liquidity  * liquidityScore) +
    (weights.social     * socialScore) +
    (weights.technical  * technicalScore);

  const finalScore = Number(rawScore.toFixed(2));
  logEvent('info', `Score for ${entry.address}: ${finalScore}`);

  return finalScore;
}

module.exports = { scoreToken };
