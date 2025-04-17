// enrichment/instantEnrich.js
require('dotenv').config();
const axios = require('axios');
const { logEvent } = require('../utils/logger');

const MAX_RETRIES = parseInt(process.env.ENRICH_MAX_RETRIES, 10) || 2;
const RPC = process.env.SOLANA_RPC_URL;

async function instantEnrich(address) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logEvent('info', `instantEnrich: fetching metadata for ${address} (try ${attempt})`);
      const res = await axios.get(
        `${process.env.BIRDEYE_METADATA_KEY
          ? `https://api.birdeye.so/tokens/${address}/metadata?api-key=${process.env.BIRDEYE_METADATA_KEY}`
          : `https://api.projectserum.com/token/${address}/meta`}`
      );
      // if the service returns no body, bail
      if (!res.data) throw new Error('Empty response body');
      // assume it’s valid JSON already – but just in case:
      let meta;
      try {
        meta = typeof res.data === 'object' ? res.data : JSON.parse(res.data);
      } catch (parseErr) {
        throw new Error(`JSON parse error: ${parseErr.message}`);
      }
      // pull out the fields you care about
      return {
        address,
        symbol: meta.symbol || address.slice(0,6),
        name: meta.name || '',
        logoURI: meta.logoURI || meta.image,
      };
    } catch (err) {
      logEvent('warn', `instantEnrich error (${err.message}), attempt ${attempt}`);
      // if it was the last retry, give up
      if (attempt === MAX_RETRIES) {
        logEvent('error', `instantEnrich giving up on ${address}`);
        return null;
      }
      // otherwise wait a bit before retrying
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }
}

module.exports = instantEnrich;
