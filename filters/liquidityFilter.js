// filters/liquidityFilter.js
const { logEvent } = require('../utils/logger');
const { Connection, PublicKey } = require('@solana/web3.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Use your RPC endpoint from .env
const RPC_URL = process.env.SOLANA_RPC_URL;
const connection = new Connection(RPC_URL, 'confirmed');

async function retryable(fn, name, maxRetries = 5, initialDelay = 500) {
  let attempt = 0, delay = initialDelay;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = /429/.test(err.message) || err.message.includes('Too many requests');
      if (!isRateLimit || attempt >= maxRetries) throw err;
      attempt++;
      logEvent('warn', `${name} rate‑limited, retry #${attempt} in ${delay}ms`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

async function liquidityFilter(entry) {
  const mint = new PublicKey(entry.address);
  logEvent('info', `Running liquidityFilter for ${entry.address}`);

  try {
    // 1) Get largest accounts with retries
    const resp = await retryable(
      () => connection.getTokenLargestAccounts(mint),
      'getTokenLargestAccounts'
    );
    const largest = resp.value[0];
    if (!largest) throw new Error('No token accounts found');

    // 2) Get parsed account info with retries
    const info = await retryable(
      () => connection.getParsedAccountInfo(largest.address),
      'getParsedAccountInfo'
    );

    const amountRaw = info.value?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
    const maxRef = 10000;
    const liquidityScore = Math.min(amountRaw / maxRef, 1);

    logEvent('info', `Liquidity ${entry.address}: ${amountRaw} → score ${liquidityScore.toFixed(3)}`);
    return { liquidityScore };
  } catch (err) {
    logEvent('error', `liquidityFilter error for ${entry.address}: ${err.message}`);
    return { liquidityScore: 0 };
  }
}

module.exports = { liquidityFilter };
