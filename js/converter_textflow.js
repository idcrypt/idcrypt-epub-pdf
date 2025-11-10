// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page) =====
document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  // ✅ Cek EPUB sudah dimuat
  if (!window.book) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  const book = window.book;
  setStatus("📚 Extracting and formatting text from EPUB...", "blue");

  // Ambil spine items secara benar dari epub.js
  const spine = await book.loaded.spine;
  const items = spine.items;
  if (!items || items.length === 0) {
    setStatus("❌ EPUB spine empty.", "red");
    return;
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  let y = margin;

  const total = items.length;
  let count = 0;

  for (const item of items) {
    try {
      const content = await item.load(book.load.bind(book));
      const html = new TextDecoder().decode(content.contents);
      const tmpDiv = document.createElement("div");
      tmpDiv.innerHTML = html;

      // Bersihkan konten, ambil teks murni
      const text = tmpDiv.innerText.replace(/\s+/g, " ").trim();
      if (!text) continue;

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
    } catch (err) {
      console.warn("❌ Error loading item:", err);
    }

    count++;
    const percent = Math.round((count / total) * 100);
    setProgress(percent, `Converting chapter ${count}/${total}...`);
    await sleep(200);
  }

  pdf.save("idcrypt-epub-textflow.pdf");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
  setProgress(100, "Done!");
});

// === helper ===
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(msg, color) {
  const el = document.getElementById("status");
  if (el) {
    el.style.color = color || "#fff";
    el.innerHTML = msg;
  } else {
    console.log(msg);
  }
}

function setProgress(val, msg) {
  const bar = document.getElementById("progressBar");
  const status = document.getElementById("status");
  if (bar) bar.value = val;
  if (status) status.innerText = msg;
}
