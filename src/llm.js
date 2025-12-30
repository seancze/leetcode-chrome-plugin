export async function generateCode(
  apiKey,
  userPrompt,
  currentCode,
  chatHistory,
  model
) {
  const systemPrompt = `You are a strict code transcriber. Your task is to transform the user input into Python 3 code without adding any logic, assumptions, or problem solving beyond what the user explicitly states.

Rules you must follow at all times:

1. Treat the user prompt as the only source of truth.
2. Do not infer intent, fill in gaps, or complete unfinished tasks.
3. If the user asks for a change, apply only that change and nothing else.
4. NEVER solve the problem for the user.
5. If no executable action is requested, make no functional changes.
6. Never use prior knowledge of coding challenges, common solutions, or expected outputs.
7. Preserve the exact function signature and class structure provided.
8. Output the full updated code, even if the change is minimal.
9. Do not optimize, refactor, or clean up code unless instructed.
10. Add comments only when required to clarify complex logic that the user explicitly requested.
11. Output only valid Python 3 code and nothing else.

Violation of any rule above is an error.`;

  const messages = [{ role: "system", content: systemPrompt }];

  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach((msg) => {
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

  const { generatedOutput, usage } = await fetchOpenAIResponse(
    apiKey,
    model,
    messages
  );

  // remove markdown code blocks if present
  const cleanCode = generatedOutput
    .replace(/^```python\n/, "")
    .replace(/^```\n/, "")
    .replace(/\n```$/, "");

  return {
    code: cleanCode,
    usage: usage,
  };
}

export async function generateTest(
  apiKey,
  currentCode,
  problemDetails,
  currentTestCases,
  model
) {
  const systemPrompt = `You are an expert software tester. Your task is to generate a single new test case for a coding problem.

Rules:
1. Read the problem description, current code, and existing test cases.
2. Suggest a SINGLE new test case that obeys the constraints.
3. If the user's code is incorrect, the new test case should cause the user's code to fail.
4. If the user's code is likely correct, the new test case should be a stress test (max constraints) to check for TLE/MLE.
5. Output ONLY the raw test case input, formatted exactly as LeetCode expects (e.g. line separated values or specific format). Do not add markdown, explanations, or code blocks.
6. Do not repeat existing test cases.`;

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Problem Title: ${problemDetails.title}\nProblem Description:\n${problemDetails.description}\n\nCurrent Code:\n\`\`\`python\n${currentCode}\n\`\`\`\n\nCurrent Test Cases:\n${currentTestCases}\n\nGenerate a single new test case.`,
    },
  ];

  const { generatedOutput, usage } = await fetchOpenAIResponse(
    apiKey,
    model,
    messages
  );

  const cleanTest = generatedOutput.trim();

  return {
    testCase: cleanTest,
    usage: usage,
  };
}

async function fetchOpenAIResponse(apiKey, model, messages) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      input: messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();

  let generatedOutput = "";
  if (data.output) {
    for (const item of data.output) {
      if (item.type === "message" && item.role === "assistant") {
        for (const contentItem of item.content) {
          if (contentItem.type === "output_text") {
            generatedOutput += contentItem.text;
          }
        }
      }
    }
  }

  if (!generatedOutput) {
    throw new Error("No generated test case found in response");
  }

  return { generatedOutput, usage: data.usage };
}
