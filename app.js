// app.js
process.env.VIA_API = "true";   // ← permit GitHubModelsClient instantiation here
require('dotenv').config();
const express = require('express');
const path    = require('path');
const cors    = require('cors');

const { readQueue, writeQueue } = require('./utils/queue');

// ── GitHub Models client & rate limiter ──────────────────────────────────
const GitHubModelsClient = require('./lib/githubModelsClient');
const { enforceFreeTier } = require('./lib/rateLimiter');
const ghClient = new GitHubModelsClient({ model: "openai/gpt-4.1-mini" });
// ───────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Health‑check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Return the full queue as JSON
app.get('/api/queue', (req, res) => {
  try {
    const queue = readQueue();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) Stream logs
app.get('/api/logs', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'logs/app.log'));
});

// ── Chat endpoint: immediate or queued on free‑tier limit ────────────────
app.post('/api/chat', async (req, res) => {
  const userKey = req.ip;
  const job = {
    messages:    req.body.messages,
    userKey,
    createdAt:   Date.now(),
    nextAttempt: Date.now()
  };

  try {
    // Try under free‑tier limits
    await enforceFreeTier(userKey);
    const reply = await ghClient.chat(job.messages);
    return res.json({ reply, queued: false });

  } catch (err) {
    if (err.msBeforeNext !== undefined) {
      // Rate‑limit hit → enqueue for retry
      job.nextAttempt = Date.now() + err.msBeforeNext;
      const queue = readQueue();
      queue.push(job);
      writeQueue(queue);

      return res.status(202).json({
        queued:       true,
        retryAfterMs: err.msBeforeNext,
        message:      "Free‑tier busy — your request is queued."
      });
    }

    console.error("LLM invocation error:", err);
    res.status(500).json({ error: "LLM invocation failed." });
  }
});
// ───────────────────────────────────────────────────────────────────────────

// ── Background worker: drain the queue every minute ───────────────────────
async function processQueue() {
  const now    = Date.now();
  const queue  = readQueue();
  const pending = [];

  for (const job of queue) {
    if (job.nextAttempt > now) {
      pending.push(job);
      continue;
    }

    try {
      // Re‑apply free‑tier check
      await enforceFreeTier(job.userKey);
      const reply = await ghClient.chat(job.messages);
      console.log(
        `[Queue] processed job from ${new Date(job.createdAt).toLocaleTimeString()}:`,
        reply
      );

    } catch (err) {
      if (err.msBeforeNext !== undefined) {
        // Still over limit → reschedule
        job.nextAttempt = now + err.msBeforeNext;
        pending.push(job);
      } else {
        console.error("[Queue] job failed permanently:", err);
      }
    }
  }

  writeQueue(pending);
}

// Kick off immediately + every 60s
processQueue();
setInterval(processQueue, 60 * 1000);
// ───────────────────────────────────────────────────────────────────────────

// Start server
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
