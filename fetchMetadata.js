require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const MORALIS_API_KEY = process.env.MORALIS_METADATA_KEY || process.env.MORALIS_API_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_METADATA_KEY || process.env.BIRDEYE_API_KEY;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichToken(token, retries = 3, delayMs = 1500) {
  // 1. Try Moralis first
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://solana-gateway.moralis.io/token/metadata?network=mainnet&token_address=${token.address}`;
      const res = await axios.get(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'accept': 'application/json'
        }
      });

      const data = res.data;

      return {
        ...token,
        symbol: data?.symbol || '',
        name: data?.name || token.token || '',
        logo: data?.logo || '',
        decimals: data?.decimals || 0,
        isSpam: data?.is_spam || false,
        enriched: true,
        metadataStatus: 'complete',
        metadataSource: 'moralis'
      };
    } catch (err) {
      if (err.response?.status === 404 && attempt < retries) {
        console.warn(`⚠️ ${token.token} not found on Moralis (404). Retry ${attempt}/${retries}...`);
        await delay(delayMs);
        continue;
      }
    }
  }

  // 2. Fallback to Birdeye
  try {
    const url = `https://public-api.birdeye.so/public/token/${token.address}`;
    const res = await axios.get(url, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,
        'accept': 'application/json'
      }
    });

    const data = res.data?.data;

    return {
      ...token,
      symbol: data?.symbol || '',
      name: data?.name || token.token || '',
      logo: data?.logoURI || '',
      enriched: true,
      metadataStatus: 'partial',
      metadataSource: 'birdeye'
    };
  } catch (fallbackErr) {
    console.warn(`❌ ${token.token} failed on both Moralis and Birdeye.`);
    return {
      ...token,
      enriched: false,
      metadataStatus: 'unavailable',
      metadataSource: 'none'
    };
  }
}

module.exports = { enrichToken };
