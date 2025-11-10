// ===== IDCRYPT EPUB → PDF Converter (Auto Split Version) =====
import { jsPDF } from "jspdf";

document.getElementById("convertBtn").addEventListener("click", async () => {
  const bookSection = document.getElementById("viewer");
  const progressBar = document.getElementById("progress");
  const progressText = document.getElementById("progressText");

  setStatus("Converting to PDF...");
  progressBar.value = 10;

  await sleep(300);

  const pdf = new jsPDF("p", "mm", "a4");
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;
  const PAGE_PIXEL_HEIGHT = 1122; // A4 in px at 96dpi

  const canvas = await html2canvas(bookSection, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const totalHeight = canvas.height;
  let position = 0;
  let pageCount = 0;

  while (position < totalHeight) {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(PAGE_PIXEL_HEIGHT, totalHeight - position);
    const ctx = pageCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, -position);

    const pageImgData = pageCanvas.toDataURL("image/png");
    const pageHeightMM = (pageCanvas.height * A4_WIDTH) / pageCanvas.width;

    if (pageCount > 0) pdf.addPage();
    pdf.addImage(pageImgData, "PNG", 0, 0, A4_WIDTH, pageHeightMM);

    position += PAGE_PIXEL_HEIGHT;
    pageCount++;
    progressBar.value = Math.min(100, (position / totalHeight) * 100);
    progressText.textContent = `Rendering page ${pageCount}...`;
    await sleep(100);
  }

  pdf.save("idcrypt_epub.pdf");
  setStatus("✅ PDF conversion complete!", "green");
  progressBar.value = 100;
});
