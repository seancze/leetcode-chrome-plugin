import { generateCode, generateTest } from "./ai/main.js";

chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  if (port.name === "generateCode") {
    port.onMessage.addListener((request: any) => {
      handleGenerateCodeStream(port, request);
    });
  } else if (port.name === "generateTest") {
    port.onMessage.addListener((request: any) => {
      handleGenerateTestStream(port, request);
    });
  }
});

async function handleGenerateCodeStream(
  port: chrome.runtime.Port,
  request: any
) {
  try {
    const { apiKey } = await getApiKey();

    const { currentCode, chatHistory, userPrompt } = request;

    const result = await generateCode(
      apiKey,
      userPrompt,
      currentCode,
      chatHistory,
      "gpt-5.1-codex-mini",
      (chunk: any) => {
        port.postMessage({ type: "chunk", data: chunk });
      }
    );
    port.postMessage({ type: "complete", code: result.code });
  } catch (error: any) {
    console.error("Error generating code:", error);
    port.postMessage({ error: error.message });
  }
}

async function handleGenerateTestStream(
  port: chrome.runtime.Port,
  request: any
) {
  try {
    const { apiKey } = await getApiKey();

    const { currentCode, problemDetails, currentTestCases } = request;

    const result = await generateTest(
      apiKey,
      currentCode,
      problemDetails,
      currentTestCases,
      "gpt-5.1-codex-mini",
      (chunk: any) => {
        port.postMessage({ type: "chunk", data: chunk });
      }
    );
    port.postMessage({ type: "complete", result: result });
  } catch (error: any) {
    console.error("Error generating test:", error);
    port.postMessage({ error: error.message });
  }
}

function getApiKey(): Promise<{ apiKey: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["openaiApiKey"], (result) => {
      resolve({ apiKey: result.openaiApiKey as string });
    });
  });
}
