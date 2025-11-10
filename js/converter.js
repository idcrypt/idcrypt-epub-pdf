// ===== IDCRYPT EPUB → PDF Converter (Stable Revision) =====
// Requires: epub.js, html2canvas, jsPDF, utils.js

document.addEventListener("DOMContentLoaded", () => {
  const convertBtn = document.getElementById("convertBtn");
  const viewer = document.getElementById("viewer");

  convertBtn.addEventListener("click", async () => {
    if (!window.book || !window.rendition) {
      setStatus("❌ No EPUB loaded yet.", "red");
      return;
    }

    convertBtn.disabled = true;
    setStatus("Preparing conversion...");
    setProgress(0, "Starting...");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 20;

    try {
      const spineItems = book.spine.spineItems;
      let renderedCount = 0;

      for (let i = 0; i < spineItems.length; i++) {
        const item = spineItems[i];
        setProgress(
          Math.round((i / spineItems.length) * 100),
          `Rendering section ${i + 1}/${spineItems.length}...`
        );

        // Tampilkan bab
        await rendition.display(item.href);
        await waitForRender(rendition);
        await sleep(800);

        // Ambil iframe berisi halaman EPUB
        let iframe = viewer.querySelector("iframe");
        if (!iframe) {
          console.warn("⚠️ iframe not found, retrying...");
          await sleep(1000);
          iframe = viewer.querySelector("iframe");
        }

        if (!iframe || !iframe.contentDocument) {
          console.warn("❌ No iframe document for", item.href);
          continue;
        }

        const doc = iframe.contentDocument;
        const body = doc.querySelector("body");
        if (!body || !body.innerText.trim()) {
          console.warn("⚠️ Empty body for", item.href);
          continue;
        }

        // Tambahkan styling dasar supaya layout stabil
        body.style.padding = "20px";
        body.style.background = "#fff";
        body.style.color = "#000";
        body.style.fontSize = "14pt";
        body.style.lineHeight = "1.4";
        body.style.wordWrap = "break-word";
        body.style.maxWidth = "800px";
        body.style.margin = "auto";

        // Render halaman jadi canvas
        const canvas = await html2canvas(body, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff"
        });

        if (!canvas.width || !canvas.height) continue;

        // Resize biar pas ke A4
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;
        const scale = Math.min(
          availableWidth / canvas.width,
          availableHeight / canvas.height
        );
        const imgW = canvas.width * scale;
        const imgH = canvas.height * scale;
        const posX = (pageWidth - imgW) / 2;
        const posY = (pageHeight - imgH) / 2;

        // Tambahkan ke PDF
        if (renderedCount > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);
        renderedCount++;
      }

      if (renderedCount === 0) {
        throw new Error("No valid pages rendered. Possibly empty EPUB.");
      }

      pdf.save("idcrypt-epub-final.pdf");
      setStatus("✅ Conversion complete!", "green");
      setProgress(100, "All done — check your Downloads folder!");

    } catch (err) {
      console.error("❌ Conversion failed:", err);
      setStatus(`❌ Error: ${err.message}`, "red");
      setProgress(0, "Conversion failed.");
    }

    convertBtn.disabled = false;
  });
});
