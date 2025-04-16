const axios = require('axios');

async function getNewTokens() {
  try {
    const res = await axios.get("https://api.raydium.io/pairs");
    const tokens = res.data;

    // Sort by created date descending if available
    const sorted = tokens.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0);
      const bTime = new Date(b.createdAt || b.updatedAt || 0);
      return bTime - aTime;
    });

    // Return top 20 freshest ones
    return sorted.slice(0, 20);
  } catch (e) {
    console.error("Failed to fetch from Raydium:", e.message);
    return [];
  }
}

module.exports = { getNewTokens };
