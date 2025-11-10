// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page) =====

// Tombol convert utama
document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  // ✅ Pastikan window.book sudah siap
  if (!window.book || !window.book.spine || window.book.spine.length === 0) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  const book = window.book;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  const paraSpacing = 10;

  let y = margin;
  let totalChapters = book.spine.length;
  let processed = 0;

  setStatus("📚 Extracting and formatting text from EPUB...", "#0044aa");
  setProgress(5, "Starting text extraction...");

  for (const item of book.spine) {
    try {
      const content = await item.load(book.load.bind(book));
      const html = new TextDecoder().decode(content.contents);
      const tmpDiv = document.createElement("div");
      tmpDiv.innerHTML = html;

      // Ambil teks murni, abaikan script dan footnote
      tmpDiv.querySelectorAll("script, style, sup, a").forEach(el => el.remove());
      let text = tmpDiv.innerText.replace(/\s+/g, " ").trim();
      if (!text) continue;

      // Pecah paragraf
      const paragraphs = text.split(/\n+/);

      for (let para of paragraphs) {
        const lines = pdf.splitTextToSize(para, maxWidth);

        // tulis line demi line, auto new page
        for (let line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        }
        y += paraSpacing;
      }

      processed++;
      const percent = Math.round((processed / totalChapters) * 100);
      setProgress(percent, `Converting chapter ${processed}/${totalChapters}...`);
      await sleep(300);

    } catch (err) {
      console.warn("❌ Error reading chapter:", err);
    }
  }

  setProgress(95, "Finalizing PDF...");
  await sleep(500);
  pdf.save("idcrypt-epub-textflow.pdf");

  setProgress(100, "✅ Done!");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
});
