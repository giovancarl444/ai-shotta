// enrichment/instantEnrich.js
const axios = require('axios');

// Example using Moralis + optional Pump.fun fallback
async function instantEnrich(address) {
  const result = {
    address,
    name: '',
    symbol: '',
    decimals: 9,
    logo: '',
    createdAt: '',
    source: '',
  };

  try {
    // First try Moralis
    const res = await axios.get(`https://solana-gateway.moralis.io/token/mainnet/${address}`, {
      headers: {
        'X-API-Key': process.env.MORALIS_API_KEY,
      },
    });

    const data = res.data;
    result.name = data.name || '';
    result.symbol = data.symbol || '';
    result.decimals = data.decimals || 9;
    result.logo = data.logo || '';
    result.createdAt = data.createdAt || '';
    result.source = 'moralis';

    return result;
  } catch (moralisErr) {
    console.warn(`❌ Moralis failed: ${moralisErr.response?.status} for ${address}`);

    // Fallback idea: Pull from Pump.fun public list (if exists or stored)
    try {
      const pumpListRes = await axios.get('https://pump.fun/api/token-list'); // Replace if real endpoint differs
      const token = pumpListRes.data.tokens.find(t => t.address === address);

      if (token) {
        result.name = token.name || '';
        result.symbol = token.symbol || '';
        result.logo = token.image || '';
        result.source = 'pumpfun';
        return result;
      }
    } catch (pumpErr) {
      console.warn(`⚠️ Pump.fun fallback failed for ${address}`);
    }

    return null;
  }
}

module.exports = instantEnrich;
