// ============================================================
// 📘 IDCRYPT EPUB → PDF Converter (Super Canggih Hybrid + Column-Aware)
// ============================================================

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

// ===== Step 1: EPUB Upload =====
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

// ===== Step 2: Convert EPUB → PDF (Super Hybrid + Column-Aware) =====
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

      // ===== Ambil blok teks/gambar =====
      const blocks = Array.from(body.querySelectorAll("div, section, p, img, h1, h2, h3"));
      let cursorY = margin;

      for (let blk of blocks) {
        if (!blk.innerText && blk.tagName !== "IMG") continue;

        // ===== Jika gambar atau kolom multi: snapshot =====
        if (blk.tagName === "IMG" || blk.scrollWidth > pageWidth*0.9) {
          // Split multi-column: coba setiap direct child div
          const columns = blk.tagName === "IMG" ? [blk] : Array.from(blk.children.length ? blk.children : [blk]);
          for (let col of columns) {
            const canvas = await html2canvas(col, { scale: 2, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
            const imgW = canvas.width * scale;
            const imgH = canvas.height * scale;

            pdf.addPage();
            pdf.addImage(imgData, "JPEG", (pageWidth - imgW)/2, margin, imgW, imgH);
          }

        } else {
          // ===== Teks biasa: block-aware =====
          const text = blk.innerText.trim();
          if (!text) continue;

          const fontSize = 14;
          pdf.setFontSize(fontSize);
          const lineHeight = fontSize*1.3;
          const lines = pdf.splitTextToSize(text, pageWidth - 2*margin);
          const blockHeight = lines.length*lineHeight + 8;

          if (cursorY + blockHeight > pageHeight - margin) {
            pdf.addPage();
            cursorY = margin;
          }

          pdf.text(lines, margin, cursorY);
          cursorY += blockHeight;
        }
      }

      pageCount++;
      const percent = Math.round((pageCount / spineItems.length)*100);
      progressBar.value = percent;
      progressText.textContent = `Rendering ${pageCount} of ${spineItems.length} spine items (${percent}%)...`;
    }

    pdf.save("idcrypt-epub-super.pdf");
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
