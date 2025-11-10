convertBtn.addEventListener("click", async () => {
  if (!book || !rendition) return;
  convertBtn.disabled = true;
  setStatus("⏳ Starting conversion...");
  progressText.textContent = "Rendering pages...";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = 595, pageH = 842, margin = 20;

  try {
    const spineItems = book.spine.spineItems;
    let rendered = 0;

    for (let item of spineItems) {
      await rendition.display(item.href);
      await new Promise(res => setTimeout(res, 700));

      const iframe = viewer.querySelector("iframe");
      const body = iframe?.contentDocument?.body;
      if (!body || !body.innerText.trim()) continue;

      const canvas = await html2canvas(body, {
        scale: 2,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const ratio = Math.min((pageW - margin*2)/canvas.width, (pageH - margin*2)/canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const posX = (pageW - imgW) / 2;
      const posY = (pageH - imgH) / 2;

      if (rendered > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", posX, posY, imgW, imgH);
      rendered++;

      progressText.textContent = `Rendering page ${rendered} / ${spineItems.length}`;
    }

    pdf.save("idcrypt-epub.pdf");
    setStatus("✅ PDF successfully generated!", "green");
    progressText.textContent = "Done!";
  } catch (err) {
    console.error(err);
    setStatus(`❌ Error: ${err.message}`, "red");
  }

  convertBtn.disabled = false;
});
