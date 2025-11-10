// ===== IDCRYPT EPUB → PDF Converter (Stable Revision) =====

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

        await rendition.display(item.href);
        await waitForRender(rendition);
        await sleep(800);

        let iframe = viewer.querySelector("iframe");
        if (!iframe) {
          console.warn("⚠️ iframe not found, retrying...");
          await sleep(1000);
          iframe = viewer.querySelector("iframe");
        }

        if (!iframe || !iframe.contentDocument) continue;

        const doc = iframe.contentDocument;
        const body = doc.querySelector("body");
        if (!body || !body.innerText.trim()) continue;

        // Basic style for stability
        body.style.padding = "20px";
        body.style.background = "#fff";
        body.style.color = "#000";
        body.style.fontSize = "14pt";
        body.style.lineHeight = "1.5";
        body.style.maxWidth = "800px";
        body.style.margin = "auto";

        // Render via html2canvas
        const canvas = await html2canvas(body, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        if (!canvas.width || !canvas.height) continue;

        // Scale & position
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

        if (renderedCount > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);
        renderedCount++;
      }

      if (renderedCount === 0)
        throw new Error("No valid pages rendered. Possibly empty EPUB.");

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
