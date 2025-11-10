const input = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");

input.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  setStatus(`Loading EPUB file: ${file.name}`);
  await loadEPUB(file);
});

convertBtn.addEventListener("click", async () => {
  const iframe = document.getElementById("epubFrame");
  const doc = iframe.contentDocument;
  const body = doc?.body;
  if (!body) {
    setStatus("❌ No EPUB content detected!", "red");
    return;
  }

  setStatus("📸 Rendering EPUB into PDF...");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const fullHeight = body.scrollHeight;
  const viewportHeight = iframe.clientHeight;
  const scale = pageWidth / iframe.clientWidth;

  let yOffset = 0;
  let page = 1;

  while (yOffset < fullHeight) {
    await html2canvas(body, {
      scale: 2,
      scrollY: -yOffset,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff"
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (page > 1) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
    });

    yOffset += viewportHeight;
    setProgress((yOffset / fullHeight) * 100, `Page ${page++}`);
    await sleep(400);
  }

  pdf.save(`${input.files[0].name.replace(".epub", "")}.pdf`);
  setStatus("✅ Conversion complete! PDF downloaded automatically.", "green");
  setProgress(100, "All done!");
});
