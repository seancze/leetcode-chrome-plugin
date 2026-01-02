import { generateCode, generateTest } from "./llm.js";

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "generateCode") {
    port.onMessage.addListener((request) => {
      handleGenerateCodeStream(port, request);
    });
  } else if (port.name === "generateTest") {
    port.onMessage.addListener((request) => {
      handleGenerateTestStream(port, request);
    });
  }
});

async function handleGenerateCodeStream(port, request) {
  try {
    const { apiKey } = await getApiKey();

    const { currentCode, chatHistory, userPrompt } = request;

    const result = await generateCode(
      apiKey,
      userPrompt,
      currentCode,
      chatHistory,
      "gpt-5.1-codex-mini",
      (chunk) => {
        port.postMessage({ type: "chunk", data: chunk });
      }
    );
    port.postMessage({ type: "complete", code: result.code });
  } catch (error) {
    console.error("Error generating code:", error);
    port.postMessage({ error: error.message });
  }
}

async function handleGenerateTestStream(port, request) {
  try {
    const { apiKey } = await getApiKey();

    const { currentCode, problemDetails, currentTestCases } = request;

    const result = await generateTest(
      apiKey,
      currentCode,
      problemDetails,
      currentTestCases,
      "gpt-5.1-codex-mini",
      (chunk) => {
        port.postMessage({ type: "chunk", data: chunk });
      }
    );
    port.postMessage({ type: "complete", result: result });
  } catch (error) {
    console.error("Error generating test:", error);
    port.postMessage({ error: error.message });
  }
}

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["openaiApiKey"], (result) => {
      resolve({ apiKey: result.openaiApiKey });
    });
  });
}
