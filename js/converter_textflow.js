// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page) =====
// Clean full-text rendering, wraps across pages

document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  if (!window.book) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  setStatus("Extracting text and preparing PDF...", "#0044aa");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  let y = margin;

  const spine = window.book.spine;
  const total = spine.length;
  let current = 0;

  for (const item of spine) {
    try {
      const section = await item.render();
      const text = section.document.body.innerText
        .replace(/\s+/g, " ")
        .trim();

      const paragraphs = text.split(/\n+/).filter(t => t.trim() !== "");
      pdf.setFont("Times", "normal");
      pdf.setFontSize(12);

      for (const para of paragraphs) {
        const lines = pdf.splitTextToSize(para, maxWidth);
        for (const line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        }
        y += lineHeight * 0.8;
      }

      current++;
      const percent = Math.round((current / total) * 100);
      setProgress(percent, `Converting section ${current}/${total}`);
      await sleep(200);
    } catch (e) {
      console.error("Section error:", e);
    }
  }

  pdf.save("idcrypt-epub-textflow.pdf");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
  setProgress(100, "Done!");
});
