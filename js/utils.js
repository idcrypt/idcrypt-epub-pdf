// ===== IDCRYPT Utility Functions =====
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForRender(rendition) {
  return new Promise((resolve) => {
    const handler = () => {
      rendition.off("rendered", handler);
      resolve();
    };
    rendition.on("rendered", handler);
  });
}

function setStatus(msg, color = "#333") {
  const statusDiv = document.getElementById("status");
  if (statusDiv) statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

function setProgress(value, text = "") {
  const bar = document.getElementById("progress");
  if (bar) bar.value = value;
  const txt = document.getElementById("progressText");
  if (txt) txt.innerText = text;
}
