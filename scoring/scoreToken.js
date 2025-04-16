function scoreToken(token) {
  let score = 0;
  const name = token.name?.toLowerCase() || '';
  const symbol = token.symbol?.toLowerCase() || '';

  // 1. Basic sanity checks
  if (token.isSpam || name.includes('test') || symbol.includes('test')) return 0;
  if (!token.name || !token.symbol || name.length < 2) return 0;

  // 2. Positive signals
  if (token.logo) score += 10;
  if (name.length <= 12) score += 10;
  if (symbol.length <= 5) score += 10;

  // 3. Popularity signals
  if (token.holders && token.holders > 100) score += 10;
  if (token.marketCap && token.marketCap > 50000) score += 15;
  if (token.marketCap && token.marketCap > 500000) score += 10; // bonus for large caps

  // 4. Metadata trust
  if (token.metadataSource === 'moralis') score += 10;
  if (token.metadataSource === 'birdeye') score += 5;

  // 5. Meme/sniper optimization
  const memeKeywords = ['elon', 'doge', 'pepe', 'trump', 'cat', 'frog', 'jeet', 'moon'];
  if (memeKeywords.some(k => name.includes(k) || symbol.includes(k))) {
    score += 10;
  }

  // 6. Red flag penalty
  const redFlags = ['scam', 'rug', 'fuck', 'shit', 'kill'];
  if (redFlags.some(k => name.includes(k) || symbol.includes(k))) {
    score -= 20;
  }

  // 7. Source-based bonus
  if (token.source === 'pump.fun') score += 10;

  // Cap between 0–100
  score = Math.max(0, Math.min(score, 100));
  return score;
}

module.exports = { scoreToken };
