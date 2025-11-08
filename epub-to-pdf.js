// ============================================================
// 📘 IDCRYPT EPUB → PDF Converter (Visual Capture Version)
// Render EPUB pages visually using epub.js + html2canvas + jsPDF
// Lebar konten menyesuaikan A4, tulisan tetap proporsional
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

      // Render EPUB dengan width A4 supaya font & layout menyesuaikan
      rendition = book.renderTo("viewer", {
        width: 595,    // A4 width pt
        height: 1200,  // tinggi fleksibel
        spread: "none"
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

      // Capture halaman dengan html2canvas
      const canvas = await html2canvas(pageBody, {
        scale: 2, // cukup untuk tajam tapi font tetap proporsional
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Lebar konten menyesuaikan A4
      const scale = pageWidth / canvas.width;
      const imgW = canvas.width * scale;
      const imgH = canvas.height * scale;

      // Split halaman tinggi jika lebih dari A4
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
