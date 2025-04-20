// app.js
require('dotenv').config();
const express = require('express');
const path    = require('path');
const cors    = require('cors');
const { readQueue } = require('./utils/queue');

const app = express();
app.use(cors());  // allow your UI to fetch

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

// Start server
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
