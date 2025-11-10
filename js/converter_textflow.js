// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page v2) =====

document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  // Pastikan buku sudah diload oleh reader.js
  if (!window.book || !window.book.spine || !window.book.spine.spineItems) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  const book = window.book;
  const spineItems = book.spine.spineItems;
  if (!spineItems || spineItems.length === 0) {
    setStatus("❌ No readable content in EPUB.", "red");
    return;
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  const paraSpacing = 10;
  let y = margin;

  setStatus("📚 Extracting and formatting text from EPUB...", "#0044aa");
  setProgress(5, "Starting text extraction...");

  let processed = 0;
  const total = spineItems.length;

  for (const item of spineItems) {
    try {
      // Ambil konten tiap bab
      const content = await item.load(book.load.bind(book));
      const html = new TextDecoder().decode(content.contents);
      const tmpDiv = document.createElement("div");
      tmpDiv.innerHTML = html;

      // Hapus elemen yang tidak dibutuhkan
      tmpDiv.querySelectorAll("script, style, sup, a, img, svg").forEach(el => el.remove());

      // Ambil teks bersih
      let text = tmpDiv.innerText.replace(/\s+/g, " ").trim();
      if (!text) continue;

      // Pisahkan paragraf
      const paragraphs = text.split(/\n+/);

      for (let para of paragraphs) {
        const lines = pdf.splitTextToSize(para, maxWidth);
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
      const percent = Math.round((processed / total) * 100);
      setProgress(percent, `Converting chapter ${processed}/${total}...`);
      await sleep(300);

    } catch (err) {
      console.error("Error reading spine item:", err);
    }
  }

  setProgress(95, "Finalizing PDF...");
  await sleep(500);
  pdf.save("idcrypt-epub-textflow.pdf");
  setProgress(100, "✅ Done!");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
});
