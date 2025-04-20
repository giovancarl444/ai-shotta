import { encoding_for_model } from "@dqbd/tiktoken";
import openai from "./openaiClient"; // your OpenAI setup
import fs from "fs";

const encoder = encoding_for_model("gpt-4-0613");
let budgetLog = "./logs/token-usage.json";

export async function smartGptCall({ messages, model = "gpt-4-1106-preview", maxTokens = 1000 }) {
  const inputTokenCount = encoder.encode(messages.map(m => m.content).join(" ")).length;

  const costEstimate = {
    input: inputTokenCount,
    output: maxTokens,
    totalCost:
      ((inputTokenCount / 1000) * 0.01 + (maxTokens / 1000) * 0.03).toFixed(4)
  };

  console.log(`[GPT Budget Check] Estimated cost: $${costEstimate.totalCost} | Tokens: ~${inputTokenCount} in / ${maxTokens} out`);

  // Optional: cancel large calls
  if (parseFloat(costEstimate.totalCost) > 0.20) {
    console.log(`[⚠️ Budget Warning] GPT call exceeds threshold. Skipping.`);
    return { error: "GPT call skipped due to cost threshold." };
  }

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
  });

  // Log usage
  const logEntry = {
    date: new Date().toISOString(),
    tokens: inputTokenCount + response.usage.completion_tokens,
    cost: costEstimate.totalCost,
    model
  };

  const logData = fs.existsSync(budgetLog) ? JSON.parse(fs.readFileSync(budgetLog)) : [];
  logData.push(logEntry);
  fs.writeFileSync(budgetLog, JSON.stringify(logData, null, 2));

  return response;
}
