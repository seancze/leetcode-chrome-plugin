import { CODE_SYSTEM_PROMPT, TEST_SYSTEM_PROMPT } from "./prompts.js";

export function buildCodeMessages(
  chatHistory: any[],
  currentCode: string,
  userPrompt: string
) {
  const messages: any[] = [{ role: "system", content: CODE_SYSTEM_PROMPT }];

  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach((msg: any) => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }

  if (currentCode) {
    messages.push({
      role: "system",
      content: `Current Code in Editor:\n\`\`\`python\n${currentCode}\n\`\`\``,
    });
  }

  messages.push({ role: "user", content: userPrompt });
  return messages;
}

export function buildTestMessages(
  problemDetails: any,
  currentCode: string,
  currentTestCases: any
) {
  return [
    { role: "system", content: TEST_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Problem Title: ${problemDetails.title}\nProblem Description:\n${problemDetails.description}\n\nCurrent Code:\n\`\`\`python\n${currentCode}\n\`\`\`\n\nCurrent Test Cases:\n${currentTestCases}\n\nEvaluate and generate test case if needed.`,
    },
  ];
}
