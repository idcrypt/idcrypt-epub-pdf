// utils.js
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setStatus(msg, color = "#333") {
  const el = document.getElementById("status");
  if (el) el.innerHTML = `<p style="color:${color}">${msg}</p>`;
  console.log(msg);
}

function setProgress(value, text) {
  const bar = document.getElementById("progress");
  if (bar) bar.value = value;
  const txt = document.getElementById("progressText");
  if (txt) txt.innerText = text || "";
}

// wait for epub.js rendition 'rendered' event (safe fallback if rendition exists)
function waitForRender(rendition, timeout = 4000) {
  return new Promise(resolve => {
    if (!rendition || !rendition.on) return resolve();
    let done = false;
    const handler = () => { if (!done) { done = true; rendition.off("rendered", handler); resolve(); } };
    rendition.on("rendered", handler);
    setTimeout(() => { if (!done) { done = true; rendition.off("rendered", handler); resolve(); } }, timeout);
  });
}
