document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);

function saveOptions() {
  const apiKey = document.getElementById("apiKey").value;
  const status = document.getElementById("status");

  if (!apiKey) {
    status.textContent = "Please enter an API key.";
    status.className = "error";
    status.style.display = "block";
    return;
  }

  // Basic validation (starts with sk-)
  if (!apiKey.startsWith("sk-")) {
    status.textContent = 'Invalid API key format. Should start with "sk-".';
    status.className = "error";
    status.style.display = "block";
    return;
  }

  chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
    status.textContent = "API Key saved successfully!";
    status.className = "";
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
    }, 2000);
  });
}

function restoreOptions() {
  chrome.storage.local.get(["openaiApiKey"], (result) => {
    if (result.openaiApiKey) {
      document.getElementById("apiKey").value = result.openaiApiKey;
    }
  });
}
