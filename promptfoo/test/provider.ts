import { generateTest } from "../../src/ai/main";

export default class TestGeneratorProvider {
  providerId: string;
  config: any;

  constructor(options: any) {
    this.providerId = options.id || "test-generator";
    this.config = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt: string, context: any) {
    const { currentCode, problemDetails, currentTestCases } = context.vars;

    // if no api key is set
    // generateTest will invoke the Vercel API endpoint
    const apiKey = this.config.use_vercel_api
      ? ""
      : process.env.OPENAI_API_KEY!;

    try {
      // problemDetails comes as a string from the yaml vars, so we parse it
      const parsedProblemDetails =
        typeof problemDetails === "string"
          ? JSON.parse(problemDetails)
          : problemDetails;

      const result = await generateTest(
        apiKey,
        currentCode,
        parsedProblemDetails,
        currentTestCases || "",
        this.config.model,
        () => {} // onChunk
      );

      return {
        output: JSON.stringify(
          {
            isUserCorrect: result.isUserCorrect,
            testCase: result.testCase,
          },
          null,
          2
        ),
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
