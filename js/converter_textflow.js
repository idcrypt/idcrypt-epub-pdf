// ===== IDCRYPT EPUB → PDF Converter (TextFlow Auto Multi-Page) =====
document.getElementById("convertBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  if (!window.book) {
    setStatus("❌ No EPUB loaded. Please open one first.", "red");
    return;
  }

  const book = window.book;
  setStatus("📚 Extracting and formatting text from EPUB...", "blue");

  // Ambil daftar spine item secara aman
  const spine = await book.loaded.spine;
  const spineItems = spine.spineItems || spine.items || [];
  if (spineItems.length === 0) {
    setStatus("❌ No readable spine items found in EPUB.", "red");
    return;
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  let y = margin;

  let total = spineItems.length;
  let count = 0;

  for (const item of spineItems) {
    try {
      const text = await extractTextFromItem(item, book);
      if (!text) continue;

      const paragraphs = text.split(/\n+/);
      for (let para of paragraphs) {
        const lines = pdf.splitTextToSize(para.trim(), maxWidth);
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

      count++;
      const percent = Math.round((count / total) * 100);
      setProgress(percent, `Converting chapter ${count}/${total}...`);
      await sleep(150);
    } catch (err) {
      console.warn("❌ Error reading item:", err);
    }
  }

  pdf.save("idcrypt-epub-textflow.pdf");
  setStatus("✅ Conversion complete! PDF downloaded.", "green");
  setProgress(100, "Done!");
});

// === Helper: Ekstraksi teks bersih dari spine item ===
async function extractTextFromItem(item, book) {
  try {
    const content = await item.load(book.load.bind(book));
    if (!content || !content.contents) return "";
    const html = new TextDecoder().decode(content.contents);
    const tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = html;

    // Bersihkan elemen tak penting
    tmpDiv.querySelectorAll("script, style, img, svg, a, footer, header, nav").forEach(el => el.remove());
    return tmpDiv.innerText.replace(/\s+/g, " ").trim();
  } catch (err) {
    console.warn("⚠️ Failed to extract text:", err);
    return "";
  }
}

// === Helper umum ===
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
  const bar = document.getElementById("progress");
  const text = document.getElementById("progressText");
  if (bar) bar.value = val;
  if (text) text.innerText = msg;
}
