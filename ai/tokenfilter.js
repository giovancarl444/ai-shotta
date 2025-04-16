const axios = require('axios');

async function rateToken(name, desc, socials) {
  const prompt = `You're a ruthless memecoin sniper bot. Rate this token for profit potential from 1-10.
Factors: name quality, description hype, dev trust signals, potential for virality.

Token name: ${name}
Description: ${desc}
Social links: ${socials}

Rules:
- 9–10 = looks like an early moonshot (e.g., strong meme, viral, real hype)
- 6–8 = decent short-term pump potential
- 3–5 = mid, might go nowhere
- 1–2 = obvious rug, trash, or ghost project

Give only the score and a short reason.`;



  const response = await axios.post('http://localhost:11434/api/generate', {
    model: "llama3",  // or mistral, gemma, etc.
    prompt: prompt,
    stream: false
  });

  const reply = response.data.response;
  const score = parseInt(reply.match(/\d+/)?.[0] || '0');
  return { score, reason: reply };
}

module.exports = { rateToken };
