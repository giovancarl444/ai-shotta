// enrichment/instantEnrich.js
const fetch = require("node-fetch");
require("dotenv").config();

const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY;
const RETRIES = parseInt(process.env.ENRICH_MAX_RETRIES || "2");

async function fetchBirdeyeData(address) {
  const url = `https://public-api.birdeye.so/public/token/${address}?apikey=${BIRDEYE_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Birdeye API failed: ${res.status}`);
    const { data } = await res.json();
    return {
      name: data.name,
      symbol: data.symbol,
      price: parseFloat(data.price_usd),
      liquidity: parseFloat(data.liquidity),
      twitterFollowers: data.twitter_followers || 0,
      hasWebsite: !!data.website,
    };
  } catch (err) {
    console.warn(`[enrich] Birdeye error for ${address}: ${err.message}`);
    return null;
  }
}

async function fallbackData(address) {
  console.warn(`[enrich] No fallback implemented for ${address}`);
  return {
    name: null,
    symbol: null,
    price: 0,
    liquidity: 0,
    twitterFollowers: 0,
    hasWebsite: false,
  };
}

async function instantEnrich(address) {
  let data = null;
  for (let i = 0; i < RETRIES; i++) {
    data = await fetchBirdeyeData(address);
    if (data) break;
  }
  return data || await fallbackData(address);
}

module.exports = { instantEnrich };
