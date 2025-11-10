import { getBook, getRendition } from './reader.js';

const convertBtn = document.getElementById("convertBtn");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const statusDiv = document.getElementById("status");
const viewer = document.getElementById("viewer");

convertBtn.addEventListener("click", async () => {
  const book = getBook();
  const rendition = getRendition();
  if (!book || !rendition) return;

  convertBtn.disabled = true;
  setStatus("Rendering pages...");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595, pageHeight = 842, margin = 20;

  try {
    const spineItems = book.spine.spineItems;
    let rendered = 0;

    for (let i = 0; i < spineItems.length; i++) {
      await rendition.display(spineItems[i].href);
      await waitForRender(rendition);
      await sleep(400);

      const iframe = viewer.querySelector("iframe");
      const doc = iframe?.contentDocument;
      const body = doc?.body;
      if (!body || !body.innerText.trim()) continue;

      // Pastikan semua elemen visible sebelum capture
      body.style.background = "#ffffff";
      body.style.color = "#000";

      const canvas = await html2canvas(body, { scale: 2, useCORS: true });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      const scale = Math.min((pageWidth - 2*margin)/canvas.width, (pageHeight - 2*margin)/canvas.height);
      const w = canvas.width * scale, h = canvas.height * scale;

      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", (pageWidth - w)/2, (pageHeight - h)/2, w, h);

      rendered++;
      const percent = Math.round((rendered / spineItems.length) * 100);
      progressBar.value = percent;
      progressText.textContent = `Page ${rendered}/${spineItems.length}`;
    }

    pdf.save("idcrypt-epub-final.pdf");
    setStatus("✅ Conversion complete!");
  } catch (err) {
    console.error(err);
    setStatus("❌ Conversion failed: " + err.message, "red");
  }

  convertBtn.disabled = false;
});

function setStatus(msg, color="#333") {
  statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
}
function waitForRender(rendition) {
  return new Promise(res => {
    const handler = () => { rendition.off("rendered", handler); res(); };
    rendition.on("rendered", handler);
  });
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
