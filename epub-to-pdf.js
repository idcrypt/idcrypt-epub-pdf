// ============================================================
// 📘 IDCRYPT EPUB → PDF Converter (Visual Capture Version)
// Maximize EPUB layout for A4 PDF, force content width & font
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

// ===== Step 1: handle EPUB upload =====
epubInput.addEventListener("change", handleEpubSelect);

function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`Loading <strong>${file.name}</strong>...`);
  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = evt.target.result;
    try {
      if (book) book.destroy();
      book = ePub(data);

      // Render EPUB dengan A4 width supaya font & layout menyesuaikan
      rendition = book.renderTo("viewer", {
        width: 595,    // A4 width in pt
        height: 1200,
        spread: "none"
      });

      // ===== Override layout CSS untuk memperbesar halaman =====
      rendition.themes.register("maximize", {
        "body": {
          width: "100% !important",
          minWidth: "595px !important",
          fontSize: "14pt !important",
        },
        "img": {
          maxWidth: "100% !important",
          height: "auto !important"
        },
        "*": {
          boxSizing: "border-box !important"
        }
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

// ===== Step 2: Convert EPUB → PDF visually =====
convertBtn.addEventListener("click", async () => {
  if (!book || !rendition) return;

  convertBtn.disabled = true;
  setStatus("Starting conversion...");
  progressText.textContent = "Rendering pages...";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  const pageHeight = 842;

  try {
    const spineItems = book.spine.spineItems;
    const total = spineItems.length;
    let pageCount = 0;

    for (let i = 0; i < total; i++) {
      const item = spineItems[i];

      await rendition.display(item.href);
      await waitForRender(rendition);
      await sleep(800);

      const iframe = viewer.querySelector("iframe");
      if (!iframe) continue;

      const pageBody = iframe.contentDocument?.body;
      if (!pageBody) continue;

      // Tangkap halaman
      const canvas = await html2canvas(pageBody, {
        scale: 2, // tajam, tapi proporsional
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Lebar konten maksimal A4
      const scale = pageWidth / canvas.width;
      const imgW = canvas.width * scale;
      const imgH = canvas.height * scale;

      // Split halaman tinggi jika > A4
      let yOffset = 0;
      while (yOffset < imgH) {
        pdf.addPage([pageWidth, pageHeight]);
        pdf.addImage(imgData, "JPEG", 0, -yOffset, imgW, imgH);
        yOffset += pageHeight;
      }

      pageCount++;
      const percent = Math.round((pageCount / total) * 100);
      progressBar.value = percent;
      progressText.textContent = `Rendering ${pageCount} of ${total} pages (${percent}%)...`;
    }

    pdf.save("idcrypt-epub.pdf");
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
