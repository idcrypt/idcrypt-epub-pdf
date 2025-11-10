// ===== IDCRYPT EPUB → PDF Converter =====
const { jsPDF } = window.jspdf;

convertBtn.addEventListener("click", async () => {
  if (!book || !rendition) return;

  convertBtn.disabled = true;
  setStatus("🚀 Starting conversion...");
  setProgress(20, "Rendering pages...");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 20;

  try {
    const spineItems = book.spine.spineItems;
    let pageCount = 0;

    for (let i = 0; i < spineItems.length; i++) {
      const item = spineItems[i];
      await rendition.display(item.href);
      await waitForRender(rendition);
      await sleep(800);

      const iframe = viewer.querySelector("iframe");
      if (!iframe) continue;

      const body = iframe.contentDocument?.body;
      if (!body || !body.innerText.trim()) continue;

      // Ambil seluruh halaman (bukan per paragraf)
      const canvas = await html2canvas(body, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
      });

      if (!canvas.width || !canvas.height) continue;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const scale = Math.min(
        (pageWidth - 2 * margin) / canvas.width,
        (pageHeight - 2 * margin) / canvas.height
      );
      const imgW = canvas.width * scale;
      const imgH = canvas.height * scale;
      const posX = (pageWidth - imgW) / 2;
      const posY = (pageHeight - imgH) / 2;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);

      pageCount++;
      const percent = Math.round((pageCount / spineItems.length) * 80) + 20;
      setProgress(percent, `Rendered ${pageCount}/${spineItems.length} sections...`);
    }

    pdf.save("idcrypt-epub-final.pdf");
    setStatus("✅ Conversion complete! PDF downloaded automatically.", "green");
    setProgress(100, "Done!");
  } catch (err) {
    console.error(err);
    setStatus(`❌ Conversion failed: ${err.message}`, "red");
  }

  convertBtn.disabled = false;
});
