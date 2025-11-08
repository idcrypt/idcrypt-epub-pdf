// ============================================================
// 📘 IDCRYPT EPUB → PDF Converter (Visual Capture Version)
// Render EPUB pages visually using epub.js + html2canvas + jsPDF
// Supports dynamic EPUB size, images, CSS, and live progress
// ============================================================

const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const viewer = document.getElementById("viewer");

let book, rendition;

// ===== Helper: show messages =====
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
      if (book) book.destroy(); // clear previous book
      book = ePub(data);
      rendition = book.renderTo("viewer", {
        width: 800,
        height: 1200,
        spread: "none",
      });
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
  const pdf = new jsPDF({ unit: "pt", format: "a4" }); // initial; later replaced by dynamic size

  try {
    const spineItems = book.spine.spineItems;
    const total = spineItems.length;
    let pageCount = 0;

    for (let i = 0; i < total; i++) {
      const item = spineItems[i];
      const href = item.href.toLowerCase();

      // skip useless sections
      if (/cover|titlepage|toc|nav/i.test(href)) {
        console.log(`Skipping non-content section: ${href}`);
        continue;
      }

      await rendition.display(item.href);
      await waitForRender(rendition);
      await sleep(1200); // give time for images/CSS to finish

      // get current iframe
      const iframe = viewer.querySelector("iframe");
      if (!iframe) {
        console.warn("No iframe found for this section, skipping...");
        continue;
      }

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const pageBody = iframeDoc?.body;
      if (!pageBody || !pageBody.innerText.trim()) {
        console.warn("Empty or invalid page, skipping...");
        continue;
      }

      // capture the page
      const canvas = await html2canvas(pageBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      c// ==== uniform page size with proportional fit ====
const pageWidth = 800;   // fixed page width (pt)
const pageHeight = 1000; // fixed page height (pt)

// hitung rasio agar gambar muat proporsional
const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
const imgW = canvas.width * ratio;
const imgH = canvas.height * ratio;

// pusatkan di tengah
const posX = (pageWidth - imgW) / 2;
const posY = (pageHeight - imgH) / 2;

// tambahkan halaman baru seragam
if (pageCount === 0) {
  pdf.deletePage(1);
  pdf.addPage([pageWidth, pageHeight]);
} else {
  pdf.addPage([pageWidth, pageHeight]);
}

pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);


      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pageCount++;

      // update progress UI
      const percent = Math.round((pageCount / total) * 100);
      progressBar.value = percent;
      progressText.textContent = `Rendering ${pageCount} of ${total} pages (${percent}%)...`;
    }

    pdf.save("idcrypt-epub-converted.pdf");
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
