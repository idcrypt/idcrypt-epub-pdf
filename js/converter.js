const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const viewer = document.getElementById("viewer");

let book, rendition;

function setStatus(msg, color = "#333") {
  statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

// ===== Load EPUB =====
epubInput.addEventListener("change", handleEpubSelect);
function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`Loading <strong>${file.name}</strong>...`);
  const reader = new FileReader();

  reader.onload = function(evt) {
    const data = evt.target.result;
    try {
      if (book) book.destroy();
      book = ePub(data);

      rendition = book.renderTo("viewer", { width: 595, height: 1200, spread: "none" });

      // Fix sandbox iframe supaya scripts jalan
      setTimeout(() => {
        const iframe = viewer.querySelector("iframe");
        if (iframe) iframe.setAttribute("sandbox","allow-scripts allow-same-origin");
      }, 100);

      // Theme maximize supaya teks lebih besar
      rendition.themes.register("maximize", {
        "body": { width: "100% !important", fontSize: "14pt !important", lineHeight: "1.3" },
        "img": { maxWidth: "100% !important", height: "auto !important" },
        "*": { boxSizing: "border-box !important" }
      });
      rendition.themes.select("maximize");

      convertBtn.disabled = false;
      setStatus("✅ EPUB loaded successfully! Ready to convert.");
      progressText.textContent = "Ready to start conversion.";
    } catch (err) {
      setStatus(`Error loading EPUB: ${err.message}`, "red");
    }
  };

  reader.readAsArrayBuffer(file);
}

// ===== Convert EPUB → PDF per blok =====
convertBtn.addEventListener("click", async () => {
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
    let pageCount = 0;

    for (let i = 0; i < spineItems.length; i++) {
      const item = spineItems[i];
      await rendition.display(item.href);
      await waitForRender(rendition);
      await sleep(500);

      const iframe = viewer.querySelector("iframe");
      if (!iframe) continue;
      const body = iframe.contentDocument?.body;
      if (!body || !body.innerText.trim()) continue;

      // ===== Ambil tiap blok div, section, p, h1-h6, img =====
      const blocks = Array.from(body.querySelectorAll("div, section, p, h1, h2, h3, h4, h5, h6, img"));

      for (let blk of blocks) {
        if (!blk.offsetParent) continue; // skip hidden
        if (!blk.innerText.trim() && blk.tagName !== "IMG") continue; // skip empty text

        const canvas = await html2canvas(blk, { scale: 2, backgroundColor: "#ffffff" });
        if (!canvas.width || !canvas.height) continue;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const scale = Math.min((pageWidth - 2*margin)/canvas.width, (pageHeight - 2*margin)/canvas.height);
        const imgW = canvas.width * scale;
        const imgH = canvas.height * scale;
        const posX = (pageWidth - imgW)/2;
        const posY = (pageHeight - imgH)/2;

        pdf.addPage();
        pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);

        pageCount++;
        const percent = Math.round((pageCount / spineItems.length)*100);
        progressBar.value = percent;
        progressText.textContent = `Rendering ${pageCount} pages...`;
      }
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
