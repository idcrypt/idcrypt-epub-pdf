// ===== EPUB → PDF Converter =====
document.getElementById("convertBtn").addEventListener("click", async () => {
  try {
    const viewer = document.getElementById("viewer");
    if (!viewer.innerHTML.trim()) {
      setStatus("❌ No content to convert!", "red");
      return;
    }

    setStatus("Preparing conversion...", "#007bff");
    await sleep(600);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "px", format: "a4" });

    // split content if too tall for A4
    const contentHeight = viewer.scrollHeight;
    const pageHeight = 1122;
    const totalPages = Math.ceil(contentHeight / pageHeight);

    for (let i = 0; i < totalPages; i++) {
      const yOffset = -i * pageHeight;
      const canvas = await html2canvas(viewer, {
        scrollY: yOffset,
        scale: 2,
        useCORS: true
      });

      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, 595, 842);

      setProgress(((i + 1) / totalPages) * 100, `Page ${i + 1}/${totalPages}`);
      await sleep(200);
    }

    pdf.save("idcrypt-epub.pdf");
    setStatus("✅ Conversion complete!", "green");
  } catch (err) {
    console.error(err);
    setStatus(`❌ Conversion failed: ${err.message}`, "red");
  }
});
