// This script runs in the page context (MAIN world) to access the Monaco editor instance.

window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === "LEETCODE_EXTENSION_GET_CODE") {
    const code = getCode();
    window.postMessage(
      { type: "LEETCODE_EXTENSION_CODE_RESPONSE", code: code },
      "*"
    );
  }

  if (event.data.type === "LEETCODE_EXTENSION_SET_CODE") {
    const success = setCode(event.data.code);
    window.postMessage(
      { type: "LEETCODE_EXTENSION_SET_CODE_RESPONSE", success: success },
      "*"
    );
  }
});

function getCode() {
  try {
    if (window.monaco && window.monaco.editor) {
      // Try to get from focused/active editor first
      const editors = window.monaco.editor.getEditors();
      if (editors.length > 0) {
        return editors[0].getValue();
      }
      // Fallback to models
      const models = window.monaco.editor.getModels();
      if (models.length > 0) {
        return models[models.length - 1].getValue();
      }
    }
  } catch (e) {
    console.error("LeetCode Extension: Error getting code", e);
  }
  return "";
}

function setCode(newCode) {
  try {
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors.length > 0) {
        const editor = editors[0];
        const model = editor.getModel();
        const fullRange = model.getFullModelRange();

        // Use executeEdits to preserve undo stack
        editor.executeEdits("leetcode-extension", [
          {
            range: fullRange,
            text: newCode,
            forceMoveMarkers: true,
          },
        ]);
        // Push an undo stop to ensure this edit is a separate undoable action
        editor.pushUndoStop();

        return true;
      }

      const models = window.monaco.editor.getModels();
      if (models.length > 0) {
        const model = models[models.length - 1];
        // Use pushEditOperations to preserve undo stack
        model.pushEditOperations(
          [],
          [
            {
              range: model.getFullModelRange(),
              text: newCode,
            },
          ],
          () => null
        );
        return true;
      }
    } else {
      console.error(
        "LeetCode Extension: Monaco editor not found on window object."
      );
    }
  } catch (e) {
    console.error("LeetCode Extension: Error setting code", e);
  }
  return false;
}
