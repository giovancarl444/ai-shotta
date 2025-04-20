// filters/socialSignalFilter.js
require('dotenv').config();
const { logEvent } = require('../utils/logger');
const axios = require('axios');

/**
 * Naive social signal: fetch number of recent mentions
 * from a faux endpoint or a real social‑API.
 */
async function socialSignalFilter(entry) {
  logEvent('info', `Running socialSignalFilter for ${entry.address}`);
  try {
    // Example: call a placeholder API (you'll swap in real endpoint)
    const res = await axios.get(
      `https://api.mockservice.io/mentions?token=${entry.address}`
    );
    const count = res.data.count || 0;
    // Normalize to [0,1], e.g. 0–100 mentions
    const socialScore = Math.min(count / 100, 1);
    logEvent('info', `Social mentions ${entry.address}: ${count} → score ${socialScore}`);
    return { socialScore };
  } catch (err) {
    logEvent('error', `socialSignalFilter error for ${entry.address}: ${err.message}`);
    return { socialScore: 0 };
  }
}

module.exports = { socialSignalFilter };
