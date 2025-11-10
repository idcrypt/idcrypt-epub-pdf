function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setStatus(msg, color = "#333") {
  const div = document.getElementById("status");
  div.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

function setProgress(val, text) {
  const bar = document.getElementById("progress");
  const txt = document.getElementById("progressText");
  bar.value = val;
  txt.textContent = text || "";
}
