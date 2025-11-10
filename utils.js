// ===== IDCRYPT EPUB → PDF Utility Functions =====

// Delay function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait until epub.js finishes rendering a page
function waitForRender(rendition) {
  return new Promise(resolve => {
    const handler = () => {
      rendition.off("rendered", handler);
      resolve();
    };
    rendition.on("rendered", handler);
  });
}

// Update status text in the UI
function setStatus(msg, color = "#333") {
  const statusDiv = document.getElementById("status");
  if (statusDiv) {
    statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
  }
  console.log(msg);
}

// Update progress bar and text
function setProgress(value, text) {
  const bar = document.getElementById("progress");
  if (bar) bar.value = value;
  const txt = document.getElementById("progressText");
  if (txt) txt.innerText = text || "";
}
