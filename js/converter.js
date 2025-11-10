import { loadEpub, getBook, getRendition } from "./reader.js";

const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const viewer = document.getElementById("viewer");

function setStatus(msg, color = "#333") {
  statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

// ===== Load EPUB =====
epubInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setStatus(`Loading <strong>${file.name}</strong>...`);

  try {
    await loadEpub(file, "viewer");
    setStatus("✅ EPUB loaded successfully! Ready to convert.", "green");
    progressText.textContent = "Ready to start conversion.";
    convertBtn.disabled = false;
  } catch (err) {
    setStatus(`Error loading EPUB: ${err.message}`, "red");
  }
});

// ===== Convert EPUB → PDF =====
convertBtn.addEventListener("click", async () => {
  const book = getBook();
  const rendition = getRendition();
  if (!book || !rendition) return;

  convertBtn.disabled = true;
  setStatus("Starting conversion...");
  progressText.textContent = "Rendering pages...";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 20;

  try {
    const spineItems = book.spine.spineItems;
    let total = spineItems.length;
    let pageCount = 0;

    for (let i = 0; i < total; i++) {
      const item = spineItems[i];
      await rendition.display(item.href);
      await waitForRender(rendition);
      await sleep(400);

      const iframe = viewer.querySelector("iframe");
      if (!iframe) continue;
      const body = iframe.contentDocument?.body;
      if (!body || !body.innerText.trim()) continue;

      // ===== Tangkap 1 halaman penuh (bukan paragraf) =====
      const canvas = await html2canvas(body, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const scale = Math.min((pageWidth - 2*margin)/canvas.width, (pageHeight - 2*margin)/canvas.height);
      const imgW = canvas.width * scale;
      const imgH = canvas.height * scale;
      const posX = (pageWidth - imgW)/2;
      const posY = (pageHeight - imgH)/2;

      if (pageCount > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);

      pageCount++;
      const percent = Math.round((i / total) * 100);
      progressBar.value = percent;
      progressText.textContent = `Rendering page ${pageCount}/${total}`;
    }

    pdf.save("idcrypt-epub-final.pdf");
    setStatus("✅ Conversion complete! PDF downloaded automatically.", "green");
    progressText.textContent = "All done — check your Downloads folder!";
  } catch (err) {
    console.error(err);
    setStatus(`❌ Conversion failed: ${err.message}`, "red");
    progressText.textContent = "Error during conversion.";
  }

  convertBtn.disabled = false;
});

// ===== Utilities =====
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function waitForRender(rendition) {
  return new Promise(resolve => {
    const handler = () => { rendition.off("rendered", handler); resolve(); };
    rendition.on("rendered", handler);
  });
}
