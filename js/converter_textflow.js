// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page, Fixed Spine Read) =====
document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  if (!window.book) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  const book = window.book;
  setStatus("📚 Extracting text from EPUB spine...", "#0077cc");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  let y = margin;

  try {
    const spine = await book.loaded.spine;
    const items = spine.items;
    let total = items.length;
    let index = 0;

    for (const item of items) {
      try {
        // ✅ Ambil konten via resource loader
        const resource = await book.resources.get(item.href);
        const textDecoder = new TextDecoder("utf-8");
        const html = textDecoder.decode(resource);
        const div = document.createElement("div");
        div.innerHTML = html;

        // Ambil teks bersih
        const text = div.innerText.replace(/\s+/g, " ").trim();
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

        index++;
        const percent = Math.round((index / total) * 100);
        setProgress(percent, `Chapter ${index}/${total}`);
        await sleep(150);
      } catch (e) {
        console.warn("⚠️ Error reading item:", e);
      }
    }

    pdf.save("idcrypt-epub-textflow.pdf");
    setStatus("✅ Conversion complete! PDF downloaded.", "green");
    setProgress(100, "Done!");
  } catch (err) {
    console.error("❌ EPUB conversion failed:", err);
    setStatus(`❌ Conversion failed: ${err.message}`, "red");
  }
});

// ===== Helper functions =====
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function setStatus(msg, color) {
  const el = document.getElementById("status");
  if (el) {
    el.innerHTML = msg;
    el.style.color = color || "#333";
  } else console.log(msg);
}
function setProgress(val, msg) {
  const bar = document.getElementById("progress");
  const txt = document.getElementById("progressText");
  if (bar) bar.value = val;
  if (txt) txt.innerText = msg || "";
}
