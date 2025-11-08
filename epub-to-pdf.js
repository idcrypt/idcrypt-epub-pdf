const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const progressBar = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const viewer = document.getElementById("viewer");

let book, rendition;

function setStatus(msg, color = "#333") {
  statusDiv.innerHTML = `<p style="color:${color}">${msg}</p>`;
  console.log(msg);
}

// ===== Step 1: handle EPUB upload =====
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
      rendition = book.renderTo("viewer", {
        width: 800,
        height: 1200,
        spread: "none"
      });
      convertBtn.disabled = false;
      setStatus("✅ EPUB loaded successfully! Ready to convert.");
      progressText.textContent = "Ready to start conversion.";
    } catch(err) {
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
  const pageWidth = 595;  // A4 pt
  const pageHeight = 842; // A4 pt

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

      const canvas = await html2canvas(pageBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgW = canvas.width * scale;
      const imgH = canvas.height * scale;
      const posX = (pageWidth - imgW) / 2;
      const posY = (pageHeight - imgH) / 2;

      if (pageCount === 0) pdf.deletePage(1);
      pdf.addPage([pageWidth, pageHeight]);
      pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);

      pageCount++;
      progressBar.value = Math.round((pageCount / total) * 100);
      progressText.textContent = `Rendering ${pageCount} of ${total} pages...`;
    }

    pdf.save("idcrypt-epub.pdf");
    setStatus("✅ Conversion complete! PDF downloaded automatically.", "green");
    progressText.textContent = "All done — check your Downloads folder!";
  } catch(err) {
    console.error(err);
    setStatus(`❌ Conversion failed: ${err.message}`, "red");
    progressText.textContent = "Error during conversion.";
  }

  convertBtn.disabled = false;
});

// ===== Utilities =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForRender(rendition) {
  return new Promise(resolve => {
    const handler = () => { rendition.off("rendered", handler); resolve(); };
    rendition.on("rendered", handler);
  });
}
