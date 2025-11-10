// ===== IDCRYPT EPUB → PDF Converter (Margin + Multi-Page Version) =====

document.getElementById("convertBtn").addEventListener("click", async () => {
  const viewer = document.getElementById("viewer");
  const { jsPDF } = window.jspdf;
  const progressBar = document.getElementById("progress");
  const progressText = document.getElementById("progressText");

  if (!viewer || !viewer.innerText.trim()) {
    setStatus("❌ No EPUB content detected. Please load EPUB first.", "red");
    return;
  }

  setStatus("📄 Preparing conversion...");
  progressBar.value = 5;
  progressText.textContent = "Loading canvas...";

  await sleep(500);

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const DPI = 96;
  const PX_PER_MM = DPI / 25.4;
  const PAGE_WIDTH_PX = Math.floor(A4_WIDTH_MM * PX_PER_MM);
  const PAGE_HEIGHT_PX = Math.floor(A4_HEIGHT_MM * PX_PER_MM);
  const MARGIN_MM = 20;
  const MARGIN_PX = Math.floor(MARGIN_MM * PX_PER_MM);

  // Render seluruh tampilan viewer jadi satu canvas besar
  const canvas = await html2canvas(viewer, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const totalHeight = canvas.height;
  const totalPages = Math.ceil(totalHeight / (PAGE_HEIGHT_PX - 2 * MARGIN_PX));
  const pdf = new jsPDF("p", "mm", "a4");

  let position = 0;
  for (let page = 0; page < totalPages; page++) {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(PAGE_HEIGHT_PX - 2 * MARGIN_PX, totalHeight - position);

    const ctx = pageCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, -position);

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = A4_WIDTH_MM - 2 * MARGIN_MM;
    const imgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, imgWidth, imgHeight);

    position += PAGE_HEIGHT_PX - 2 * MARGIN_PX;
    progressBar.value = Math.round(((page + 1) / totalPages) * 100);
    progressText.textContent = `Rendering page ${page + 1} of ${totalPages}...`;

    await sleep(200);
  }

  pdf.save("idcrypt_epub_margin.pdf");
  setStatus("✅ Conversion complete! PDF saved.", "green");
  progressText.textContent = "All done.";
  progressBar.value = 100;
});
