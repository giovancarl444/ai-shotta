// enrichment/instantEnrich.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Paths for cache and logs
const cachePath = path.resolve(__dirname, '../data/enrichedCache.json');
const logPath = path.resolve(__dirname, '../logs/enrichment.log');

// Ensure cache and logs directory/files exist
function ensureFiles() {
  // Cache directory
  const cacheDir = path.dirname(cachePath);
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, JSON.stringify({}));
  
  // Logs directory
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, '');
}

// Append a log entry to the enrichment log
function logEntry(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Main instant enrichment function
async function instantEnrich(address) {
  ensureFiles();
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

  // Return cached data if available
  if (cache[address]) {
    logEntry(`CACHE HIT for ${address}`);
    return cache[address];
  }

  let result = {
    address,
    name: '',
    symbol: '',
    decimals: 9,
    logo: '',
    createdAt: '',
    source: '',
  };

  // Try Moralis first
  try {
    const res = await axios.get(
      `https://solana-gateway.moralis.io/token/mainnet/${address}`,
      { headers: { 'X-API-Key': process.env.MORALIS_API_KEY } }
    );
    const data = res.data;
    result = {
      ...result,
      name: data.name || '',
      symbol: data.symbol || '',
      decimals: data.decimals || 9,
      logo: data.logo || '',
      createdAt: data.createdAt || '',
      source: 'moralis',
    };
    logEntry(`SUCCESS Moralis for ${address}`);
  } catch (moralisErr) {
    logEntry(`Moralis failed for ${address}: ${moralisErr.response?.status || moralisErr.message}`);

    // Fallback to Pump.fun token list
    try {
      const pumpRes = await axios.get('https://pump.fun/api/token-list'); // Update URL if needed
      const token = pumpRes.data.tokens.find(t => t.address === address);
      if (token) {
        result = {
          ...result,
          name: token.name || '',
          symbol: token.symbol || '',
          decimals: token.decimals || result.decimals,
          logo: token.image || '',
          createdAt: token.listedAt || '',
          source: 'pumpfun',
        };
        logEntry(`SUCCESS Pump.fun for ${address}`);
      } else {
        throw new Error('Not found in Pump.fun list');
      }
    } catch (pumpErr) {
      logEntry(`Pump.fun failed for ${address}: ${pumpErr.message}`);
      return null;
    }
  }

  // Cache the successful result
  cache[address] = result;
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  return result;
}

module.exports = instantEnrich;
