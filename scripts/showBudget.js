import fs from "fs";
import path from "path";

const budgetFile = path.resolve("./logs/token-usage.json");

if (!fs.existsSync(budgetFile)) {
  console.log("🚫 No budget log found at:", budgetFile);
  process.exit(0);
}

const usage = JSON.parse(fs.readFileSync(budgetFile));
let totalTokens = 0;
let totalCost = 0;
const modelBreakdown = {};

for (const entry of usage) {
  totalTokens += entry.tokens;
  totalCost += parseFloat(entry.cost || 0);

  const model = entry.model || "unknown";
  if (!modelBreakdown[model]) modelBreakdown[model] = { count: 0, cost: 0 };
  modelBreakdown[model].count++;
  modelBreakdown[model].cost += parseFloat(entry.cost || 0);
}

console.log("\n🧠 GPT Usage Log");
console.log("--------------------");
console.log(`📅 Total Requests: ${usage.length}`);
console.log(`🔢 Total Tokens: ${totalTokens.toLocaleString()}`);
console.log(`💰 Total Cost: $${totalCost.toFixed(4)}\n`);

console.log("🧠 Cost by Model:");
Object.entries(modelBreakdown).forEach(([model, data]) => {
  console.log(`- ${model}: ${data.count} calls, $${data.cost.toFixed(4)}`);
});
console.log();
