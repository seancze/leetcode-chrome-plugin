const VERCEL_API_URL = "https://leetcode-chrome-extension.vercel.app";

export async function generateCode(
  apiKey,
  userPrompt,
  currentCode,
  chatHistory,
  model
) {
  const response = await fetch(`${VERCEL_API_URL}/api/v1/generate-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      userPrompt,
      currentCode,
      chatHistory,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "API request failed");
  }

  return await response.json();
}

export async function generateTest(
  apiKey,
  currentCode,
  problemDetails,
  currentTestCases,
  model
) {
  const response = await fetch(`${VERCEL_API_URL}/api/v1/generate-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      currentCode,
      problemDetails,
      currentTestCases,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "API request failed");
  }

  return await response.json();
}
