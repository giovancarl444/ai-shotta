// filters/liquidityFilter.js
require('dotenv').config();  // Load .env variables
const { logEvent } = require('../utils/logger');
const { Connection, PublicKey } = require('@solana/web3.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// RPC endpoint from .env must be set, e.g. SOLANA_RPC_URL
const RPC_URL = process.env.SOLANA_RPC_URL;
if (!RPC_URL || !(RPC_URL.startsWith('http://') || RPC_URL.startsWith('https://'))) {
  throw new Error('SOLANA_RPC_URL must be set to a valid http(s) URL');
}
const connection = new Connection(RPC_URL, 'confirmed');

// Generic retry wrapper for rate-limited calls
async function retryable(fn, label, maxRetries = 5, initialDelay = 500) {
  let attempt = 0, delay = initialDelay;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = /429/.test(err.message) || err.message.includes('Too many requests');
      if (!isRateLimit || attempt >= maxRetries) throw err;
      attempt++;
      logEvent('warn', `${label} rate-limited, retry #${attempt} in ${delay}ms`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

/**
 * Compute a simple liquidityScore based on the largest token account balance
 * @param {{ address: string }} entry
 * @returns {{ liquidityScore: number }}
 */
async function liquidityFilter(entry) {
  const mintPubkey = new PublicKey(entry.address);
  logEvent('info', `Running liquidityFilter for ${entry.address}`);

  try {
    // Fetch largest token accounts with retries
    const resp = await retryable(
      () => connection.getTokenLargestAccounts(mintPubkey),
      'getTokenLargestAccounts'
    );
    const largest = resp.value[0];
    if (!largest) throw new Error('No token accounts found');

    // Fetch parsed account info with retries
    const info = await retryable(
      () => connection.getParsedAccountInfo(largest.address),
      'getParsedAccountInfo'
    );

    const amountRaw = info.value?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
    // Normalize to [0,1] based on a reference threshold
    const maxRef = 10000;
    const liquidityScore = Math.min(amountRaw / maxRef, 1);

    logEvent('info', `Liquidity ${entry.address}: ${amountRaw} tokens -> score ${liquidityScore.toFixed(3)}`);
    return { liquidityScore };
  } catch (err) {
    logEvent('error', `liquidityFilter error for ${entry.address}: ${err.message}`);
    return { liquidityScore: 0 };
  }
}

module.exports = { liquidityFilter };
