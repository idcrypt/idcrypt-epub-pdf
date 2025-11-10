convertBtn.addEventListener("click", async () => {
  if (!book || spineItems.length === 0) {
    setStatus("No EPUB loaded.", "red");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  let y = margin;

  setStatus("🧩 Extracting text content...");
  let totalChapters = spineItems.length;
  let chapterCount = 0;

  for (const item of spineItems) {
    const content = await item.load(book.load.bind(book));
    const html = new TextDecoder().decode(content.contents);
    const tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = html;

    // Ambil teks saja, abaikan skrip/footnote link
    const text = tmpDiv.innerText.replace(/\s+/g, " ").trim();
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
      y += lineHeight * 0.8;
    }

    chapterCount++;
    const percent = Math.round((chapterCount / totalChapters) * 100);
    setProgress(percent, `Converting chapter ${chapterCount}/${totalChapters}...`);
    await sleep(300);
  }

  pdf.save("idcrypt-epub-textflow.pdf");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
  setProgress(100, "Done!");
});
