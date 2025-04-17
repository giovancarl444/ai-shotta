// filters/honeypotFilter.js
require('dotenv').config();
const { logEvent } = require('../utils/logger');
const { Connection, PublicKey } = require('@solana/web3.js');

const RPC_URL = process.env.SOLANA_RPC_URL;
const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Detect honeypot tokens by checking if the mint is frozen
 * (i.e., transfers disabled). Honeypots often freeze sells.
 * @param {{ address: string }} entry
 * @returns {{ honeypot: boolean }}
 */
async function honeypotFilter(entry) {
  logEvent('info', `Running honeypotFilter for ${entry.address}`);
  try {
    const mintPubkey = new PublicKey(entry.address);

    // Fetch mint account info
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
    const mintData = mintInfo.value.data.parsed.info;

    // If the mint's authority has frozen the mint, transfers fail
    const isFrozen = mintData.state === 'Frozen';
    logEvent('info', `Mint state for ${entry.address}: ${mintData.state}`);

    return { honeypot: isFrozen };
  } catch (err) {
    logEvent('error', `honeypotFilter error for ${entry.address}: ${err.message}`);
    // Fail‑safe: assume not a honeypot if we can’t determine
    return { honeypot: false };
  }
}

module.exports = { honeypotFilter };
