// ============================================================
// 📘 IDCRYPT EPUB → PDF Converter (Full Page Version)
// Render full chapter as a single high-resolution canvas
// No cropping, no tiny text — preserves layout fully
// ============================================================

const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const previewDiv = document.getElementById("preview");
let book;

async function loadBook(file) {
  if (!file) return;
  status("Loading " + file.name + " ...");

  const arrayBuffer = await file.arrayBuffer();
  book = ePub(arrayBuffer);

  const rendition = book.renderTo("viewer", {
    width: "100%",
    height: "600px",
  });

  await rendition.display();
  status("EPUB loaded. You can preview then press Convert.");
}

async function convertToPDF() {
  if (!book) {
    alert("Please load an EPUB file first!");
    return;
  }

  status("Preparing conversion...");

  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const spine = await book.loaded.spine;
  let chapterIndex = 0;

  for (const item of spine) {
    status(`Rendering chapter ${++chapterIndex} of ${spine.length}...`);
    const section = await book.load(item.href);
    const iframe = document.createElement("iframe");
    iframe.style.width = "1200px";
    iframe.style.height = "auto";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(section);
    iframe.contentDocument.close();

    // Tunggu konten render
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const element = iframe.contentDocument.body;
    const height = element.scrollHeight;
    iframe.style.height = height + "px";

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Tambahkan halaman baru kecuali halaman pertama
    if (chapterIndex > 1) doc.addPage([pdfWidth, pdfHeight]);

    // Resize halaman agar sesuai tinggi bab
    doc.internal.pageSize.height = pdfHeight;
    doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    document.body.removeChild(iframe);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  status("Generating PDF file...");
  doc.save("converted_epub_full.pdf");
  status("✅ Conversion complete!");
}

function status(msg) {
  console.log(msg);
  if (statusDiv) statusDiv.textContent = msg;
}

// Event handlers
document.getElementById("epubInput").addEventListener("change", (e) => {
  loadBook(e.target.files[0]);
});

convertBtn.addEventListener("click", () => {
  convertToPDF();
});
