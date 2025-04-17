// filters/liquidityFilter.js
require('dotenv').config();
const { logEvent } = require('../utils/logger');
const { Connection, PublicKey } = require('@solana/web3.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RPC_URL = process.env.SOLANA_RPC_URL;
if (!RPC_URL || !/^https?:\/\//.test(RPC_URL))
  throw new Error('SOLANA_RPC_URL must be set to a valid http(s) URL');

const connection = new Connection(RPC_URL, 'confirmed');

async function retryable(fn, label, maxRetries = 3, delay = 500) {
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === maxRetries) throw err;
      logEvent('warn', `${label} rate‑limit or error, retry #${i+1} in ${delay}ms`);
      await sleep(delay);
    }
  }
}

// Main filter
async function liquidityFilter(entry) {
  const mint = new PublicKey(entry.address);
  logEvent('info', `Running liquidityFilter for ${entry.address}`);

  let amountRaw = 0;

  // 1) Try largest accounts (best proxy)
  try {
    const resp = await retryable(
      () => connection.getTokenLargestAccounts(mint),
      'getTokenLargestAccounts'
    );
    const largest = resp.value[0];
    if (largest) {
      const info = await retryable(
        () => connection.getParsedAccountInfo(largest.address),
        'getParsedAccountInfo'
      );
      amountRaw = info.value?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      logEvent('info', `Got largest account balance: ${amountRaw}`);
    }
  } catch (err) {
    logEvent('warn', `LargestAccounts failed (${err.message}), falling back to total supply`);
  }

  // 2) Fallback to total supply if we have zero from above
  if (amountRaw === 0) {
    try {
      const supply = await retryable(
        () => connection.getTokenSupply(mint),
        'getTokenSupply'
      );
      amountRaw = supply.value.uiAmount || 0;
      logEvent('info', `Fallback supply: ${amountRaw}`);
    } catch (err) {
      logEvent('error', `Supply fallback failed: ${err.message}`);
    }
  }

  // 3) Normalize to 0–1
  const maxRef = 10000;
  const liquidityScore = Math.min(amountRaw / maxRef, 1);
  logEvent('info', `Final liquidityScore: ${liquidityScore.toFixed(3)}`);

  return { liquidityScore };
}

module.exports = { liquidityFilter };
