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
      apiKey: process.env.GITHUB_TOKEN,
    });
    this.model = model;
  }

  async chat(messages, opts = {}) {
    const payload = {
      model: this.model,
      messages,
      temperature: opts.temperature ?? 1.0,
      top_p: opts.top_p ?? 1.0,
      max_tokens: opts.max_tokens ?? 500,
      user: opts.user,
    };

    try {
      // first attempt, without publisher
      const res = await this.client.chat.completions.create(payload);
      return res.choices[0].message.content;
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("publisher is required")) {
        console.warn('⚠️ publisher missing—retrying with publisher set to "openai"');
        const retryPayload = { ...payload, publisher: "openai" };
        const retryRes = await this.client.chat.completions.create(retryPayload);
        return retryRes.choices[0].message.content;
      }
      throw err;
    }
  }
}
