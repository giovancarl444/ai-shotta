// filters/technicalIndicatorFilter.js
require('dotenv').config();
const { logEvent } = require('../utils/logger');
const { Connection, PublicKey } = require('@solana/web3.js');

// same RPC setup as liquidityFilter
const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

/**
 * Compute a simple technical score based on recent volume:
 * - Fetch the largest token account’s previous balance,
 *   compare it to current for a volume spike.
 */
async function technicalIndicatorFilter(entry) {
  logEvent('info', `Running technicalIndicatorFilter for ${entry.address}`);
  try {
    const mint = new PublicKey(entry.address);

    // Example: reuse getTokenLargestAccounts
    const resp = await connection.getTokenLargestAccounts(mint);
    const current = resp.value[0];
    // TODO: fetch previous snapshot from cache or history
    const previousAmount = 0; // placeholder

    const info = await connection.getParsedAccountInfo(current.address);
    const currentAmount = info.value.data.parsed.info.tokenAmount.uiAmount || 0;

    // raw spike ratio
    const spike = previousAmount > 0 ? (currentAmount - previousAmount) / previousAmount : 0;
    // normalize to [0,1] (e.g. 0%→0, 100%→1)
    const technicalScore = Math.min(Math.max(spike, 0), 1);

    logEvent('info', `Technical for ${entry.address}: spike ${spike.toFixed(3)} → score ${technicalScore.toFixed(3)}`);
    return { technicalScore };
  } catch (err) {
    logEvent('error', `technicalIndicatorFilter error: ${err.message}`);
    return { technicalScore: 0 };
  }
}

module.exports = { technicalIndicatorFilter };
