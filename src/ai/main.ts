import { buildCodeMessages, buildTestMessages } from "./utils.js";

const VERCEL_API_URL = "https://leetcode-chrome-extension.vercel.app";

export async function generateCode(
  apiKey: string,
  userPrompt: string,
  currentCode: string,
  chatHistory: any[],
  model: string,
  onChunk: (chunk: any) => void
) {
  let fullTextStr = "";
  let usageStats = null;

  if (apiKey) {
    console.log("[INFO] Using direct OpenAI API call");
    const messages = buildCodeMessages(chatHistory, currentCode, userPrompt);
    const { fullText, usage } = await streamOpenAIResponse(
      apiKey,
      messages,
      model,
      onChunk
    );
    fullTextStr = fullText;
    usageStats = usage;
  } else {
    console.log("[INFO] Using Vercel API");
    const { fullText, usage } = await streamResponse(
      "/api/v1/generate-code",
      {
        apiKey,
        userPrompt,
        currentCode,
        chatHistory,
        model,
      },
      onChunk
    );
    fullTextStr = fullText;
    usageStats = usage;
  }

  // remove markdown code blocks if present
  const cleanCode = fullTextStr
    .replace(/^```python\n/, "")
    .replace(/^```\n/, "")
    .replace(/^\n/, "")
    .replace(/\n```$/, "");

  return { code: cleanCode, usage: usageStats };
}

export async function generateTest(
  apiKey: string,
  currentCode: string,
  problemDetails: any,
  currentTestCases: any,
  model: string,
  onChunk: (chunk: any) => void
) {
  let fullTextStr = "";
  let usageStats = null;

  if (apiKey) {
    console.log("[INFO] Using direct OpenAI API call");
    const messages = buildTestMessages(
      problemDetails,
      currentCode,
      currentTestCases
    );
    const { fullText, usage } = await streamOpenAIResponse(
      apiKey,
      messages,
      model,
      onChunk
    );
    fullTextStr = fullText;
    usageStats = usage;
  } else {
    console.log("[INFO] Using Vercel API");
    const { fullText, usage } = await streamResponse(
      "/api/v1/generate-test",
      {
        apiKey,
        currentCode,
        problemDetails,
        currentTestCases,
        model,
      },
      onChunk
    );
    fullTextStr = fullText;
    usageStats = usage;
  }

  try {
    const result = JSON.parse(fullTextStr);
    return { ...result, usage: usageStats };
  } catch (e) {
    console.error("Failed to parse final JSON from stream", fullTextStr);
    throw new Error("Invalid response format from server");
  }
}

async function streamResponse(
  endpoint: string,
  body: any,
  onChunk: (chunk: any) => void
) {
  const response = await fetch(`${VERCEL_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "API request failed");
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer: string | undefined = "";
  let fullText = "";
  let usage = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines: string[] = buffer!.split("\n");
    buffer = lines.pop(); // Keep the last incomplete line

    for (const line of lines) {
      const lineTrimmed = line.trim();
      // skip empty lines
      if (!lineTrimmed) continue;
      const jsonLine = lineTrimmed.startsWith("data: ")
        ? lineTrimmed.slice(6)
        : lineTrimmed;
      // skip [DONE] lines
      // its only used to signal end of stream and is not a json message
      if (jsonLine === "[DONE]") continue;

      try {
        const chunk = JSON.parse(jsonLine);

        if (chunk.type === "text-delta") {
          fullText += chunk.delta;
          if (onChunk) onChunk({ type: "text", content: chunk.delta });
        } else if (chunk.type === "reasoning-delta") {
          if (onChunk) onChunk({ type: "reasoning", content: chunk.delta });
        } else if (chunk.type === "finish") {
          usage = chunk.messageMetadata.usage;
        }
      } catch (e) {
        console.warn("Failed to parse chunk:", line);
      }
    }
  }

  return { fullText, usage };
}

async function streamOpenAIResponse(
  apiKey: string,
  messages: any[],
  model: string,
  onChunk: (chunk: any) => void
) {
  // Extract system prompt as instructions
  const instructions = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");

  // Map remaining messages to input
  const input = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      input: input,
      instructions: instructions || undefined,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "OpenAI API request failed");
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let usage = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) continue;
      if (lineTrimmed === "data: [DONE]") continue;

      if (lineTrimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(lineTrimmed.slice(6));

          if (data.type === "response.output_text.delta") {
            fullText += data.delta;
            if (onChunk) onChunk({ type: "text", content: data.delta });
          } else if (data.type === "response.completed") {
            if (data.response && data.response.usage) {
              usage = data.response.usage;
            }
          }
        } catch (e) {
          console.warn("Failed to parse OpenAI chunk:", lineTrimmed);
        }
      }
    }
  }

  return { fullText, usage };
}
