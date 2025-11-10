document.getElementById("convertBtn").addEventListener("click", async () => {
  const input = document.getElementById("epubInput");
  const status = document.getElementById("status");
  const progress = document.getElementById("progress");

  if (!input.files.length) {
    alert("Please upload an EPUB file first!");
    return;
  }

  status.innerText = "📚 Loading EPUB...";
  progress.value = 10;

  await loadEPUB(input.files[0]);

  status.innerText = "📸 Rendering pages...";
  await sleep(1500);

  const iframe = document.getElementById("epubFrame");
  const doc = iframe.contentDocument;
  const body = doc.body;

  const pdf = new jspdf.jsPDF({
    orientation: "p",
    unit: "px",
    format: "a4"
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const scale = pdfWidth / body.scrollWidth;

  const totalHeight = body.scrollHeight;
  const pageHeight = pdf.internal.pageSize.getHeight() / scale;
  let renderedHeight = 0;
  let page = 1;

  while (renderedHeight < totalHeight) {
    await html2canvas(body, {
      scale: 2,
      scrollY: -renderedHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      if (page > 1) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdf.internal.pageSize.getHeight());
    });

    renderedHeight += pageHeight;
    progress.value = Math.min(100, (renderedHeight / totalHeight) * 100);
    page++;
    await sleep(300);
  }

  pdf.save(`${input.files[0].name.replace(".epub", "")}.pdf`);
  status.innerText = "✅ Conversion complete!";
  progress.value = 100;
});
