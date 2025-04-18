// detector/quicknodeDetector.js
require("dotenv").config();
const { Connection, clusterApiUrl, PublicKey } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const QUEUE_PATH = path.join(__dirname, "..", "data", "snipingQueue.json");
const WSS_URL = process.env.SOLANA_RPC_WSS;

const connection = new Connection(WSS_URL, "confirmed");
let seen = new Set();

function readQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}

function writeQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function addToken(address) {
  if (!address || seen.has(address)) return;

  const queue = readQueue();
  if (queue.some(t => t.address === address)) return;

  const token = {
    address,
    status: "pending",
    addedAt: new Date().toISOString(),
    source: "quicknode"
  };

  queue.push(token);
  seen.add(address);
  writeQueue(queue);
  console.log(`🟢 Detected new program: ${address}`);
}

async function startListener() {
  console.log("🔌 Subscribing to new Solana programs...");

  connection.onLogs("all", (logInfo) => {
    try {
      const { logs, programId } = logInfo;
      if (!logs) return;

      const deployLog = logs.find(l => l.includes("Program") && l.includes("successfully loaded"));
      if (deployLog) {
        const match = deployLog.match(/Program (\w{32,44}) successfully loaded/);
        if (match && match[1]) {
          const programAddress = match[1];
          addToken(programAddress);
        }
      }
    } catch (err) {
      console.error("[quicknodeDetector] Log parse error:", err.message);
    }
  });
}

startListener();
