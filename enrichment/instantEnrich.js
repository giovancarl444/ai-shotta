const fetch = require("node-fetch");
require("dotenv").config();

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const MAX_RETRIES = parseInt(process.env.ENRICH_MAX_RETRIES || "2");

async function enrichFromBirdeye(tokenAddress) {
  const url = `https://public-api.birdeye.so/public/token/${tokenAddress}?apikey=${BIRDEYE_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Birdeye error: ${res.status}`);
    const { data } = await res.json();
    return {
      name: data.name || null,
      symbol: data.symbol || null,
      price: parseFloat(data.price_usd || 0),
      liquidity: parseFloat(data.liquidity || 0),
      twitterFollowers: data.twitter_followers || 0,
      hasWebsite: !!data.website,
    };
  } catch (err) {
    console.warn(`[Birdeye] ${err.message}`);
    return null;
  }
}

async function enrichFromMoralis(tokenAddress) {
  // fallback stub, you can implement Moralis call if needed
  console.warn("[Fallback] Moralis enrichment not yet implemented.");
  return {
    name: null,
    symbol: null,
    price: 0,
    liquidity: 0,
    twitterFollowers: 0,
    hasWebsite: false,
  };
}

async function instantEnrich(tokenAddress) {
  let result = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    result = await enrichFromBirdeye(tokenAddress);
    if (result) return result;
  }
  return await enrichFromMoralis(tokenAddress);
}

module.exports = { instantEnrich };
