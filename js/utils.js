// ===== Utility Functions =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setStatus(msg, color = "#222") {
  const el = document.getElementById("status");
  if (el) el.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

function setProgress(value, text = "") {
  const bar = document.getElementById("progress");
  const txt = document.getElementById("progressText");
  if (bar) bar.value = value;
  if (txt) txt.textContent = text;
}
