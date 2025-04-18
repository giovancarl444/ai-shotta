// utils/trackLearning.js
const fs = require("fs");
const path = "./data/learningData.json";

function trackLearning({ address, score, roi }) {
  const result = roi > 0 ? "win" : "loss";
  const entry = {
    address,
    score,
    roi,
    result,
    timestamp: Date.now()
  };

  let data = [];
  if (fs.existsSync(path)) {
    try {
      data = JSON.parse(fs.readFileSync(path));
    } catch (err) {
      console.warn("[trackLearning] Failed to parse JSON:", err.message);
    }
  }

  data.push(entry);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { trackLearning };
