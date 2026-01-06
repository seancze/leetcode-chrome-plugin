import { generateCode } from "../../src/ai/main";

export default class LeetCodeProvider {
  providerId: string;
  config: any;

  constructor(options: any) {
    this.providerId = options.id || "leetcode-custom";
    this.config = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt: string, context: any) {
    const { currentCode, chatHistory } = context.vars;
    const userPrompt = prompt;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { error: "OPENAI_API_KEY not set" };
    }

    try {
      const result = await generateCode(
        apiKey,
        userPrompt,
        currentCode,
        chatHistory,
        this.config.model,
        () => {} // onChunk
      );

      return {
        output: result.code,
        tokenUsage: {
          total: result.usage.totalTokens,
          prompt: result.usage.inputTokens,
          completion: result.usage.outputTokens,
        },
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
