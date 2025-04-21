// lib/githubModelsClient.js
import OpenAI from "openai";

export default class GitHubModelsClient {
  constructor({ model } = {}) {
    if (process.env.VIA_API !== "true") {
      throw new Error(
        "🚫 Direct instantiation of GitHubModelsClient is disallowed—use POST /api/chat instead."
      );
    }
    this.client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey:  process.env.GITHUB_TOKEN
    });
    this.model = model;
  }

  async chat(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model:        this.model,
      messages,
      temperature:  opts.temperature ?? 1.0,
      top_p:        opts.top_p       ?? 1.0,
      max_tokens:   opts.max_tokens  ?? 500,
      user:         opts.user
    });
    return res.choices[0].message.content;
  }
}
