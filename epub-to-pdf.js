// IDCRYPT EPUB → PDF (Visual Capture Version)
// Uses epub.js + html2canvas + jsPDF
// Full A4 portrait with progress percentage

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

// ===== Step 1. Handle EPUB upload =====
epubInput.addEventListener("change", handleEpubSelect);

function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`Loading <strong>${file.name}</strong>...`);
  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = evt.target.result;
    try {
      // Destroy previous book if exists
      if (book) book.destroy();
      book = ePub(data);
      rendition = book.renderTo("viewer", {
        width: 794,
        height: 1123,
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

// ===== Step 2. Convert EPUB to PDF (visual capture) =====
convertBtn.addEventListener("click", async () => {
  if (!book || !rendition) return;

  convertBtn.disabled = true;
  setStatus("Starting conversion...");
  progressText.textContent = "Rendering pages...";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  try {
    const spineItems = book.spine.spineItems;
    const total = spineItems.length;
    let pageCount = 0;

    for (let i = 0; i < total; i++) {
      const item = spineItems[i];
      const href = item.href.toLowerCase();

      // Skip cover/toc automatically
      if (/cover|titlepage|toc|nav/i.test(href)) {
        console.log(`Skipping non-content: ${href}`);
        continue;
      }

      await rendition.display(item.href);
      await waitForRender(rendition);

      // Wait a bit for images/CSS
      await sleep(500);

      // Capture viewer
      const canvas = await html2canvas(viewer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const posX = (pageWidth - imgW) / 2;
      const posY = 0;

      if (pageCount > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);

      pageCount++;

      // Update progress
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

// ===== Utility functions =====
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
