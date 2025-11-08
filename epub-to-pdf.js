const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const previewDiv = document.getElementById("preview");

let book;

epubInput.addEventListener("change", handleEpubSelect);

function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  statusDiv.innerHTML = `<p>Loading <strong>${file.name}</strong>...</p>`;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const data = evt.target.result;
    try {
      book = ePub(data);
      convertBtn.disabled = false;
      statusDiv.innerHTML = "<p>✅ EPUB loaded successfully!</p>";
      previewDiv.innerHTML = "<p>Ready to convert.</p>";
    } catch (err) {
      statusDiv.innerHTML = `<p style="color:red;">Error loading EPUB: ${err.message}</p>`;
    }
  };
  reader.readAsArrayBuffer(file);
}

convertBtn.addEventListener("click", async () => {
  if (!book) return;
  convertBtn.disabled = true;
  statusDiv.innerHTML = "<p>Converting to PDF...</p>";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  try {
    const spineItems = book.spine.spineItems;
    let page = 1;

    for (let i = 0; i < spineItems.length; i++) {
      const section = spineItems[i];

      // Lewati halaman "titlepage" atau "cover"
      if (/titlepage|cover/i.test(section.href)) {
        console.log(`Skipping ${section.href}`);
        continue;
      }

      let htmlContent = "";
      try {
        const rendered = await section.render();
        htmlContent = rendered && rendered.html ? rendered.html : "";
      } catch {
        const raw = await section.load(book.load.bind(book));
        htmlContent = typeof raw === "string" ? raw : raw.outerHTML || "";
      }

      if (!htmlContent.trim()) continue;

      // Parse HTML ke teks
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const cleanText = doc.body ? doc.body.innerText.trim() : "";

      if (!cleanText) continue;

      const title = section.idref || `Chapter ${i + 1}`;
      pdf.setFontSize(14);
      pdf.text(title, 50, 60);
      pdf.setFontSize(11);

      const lines = pdf.splitTextToSize(cleanText, 500);
      let y = 80;

      for (let j = 0; j < lines.length; j++) {
        if (y > 750) {
          pdf.addPage();
          page++;
          y = 60;
        }
        pdf.text(lines[j], 50, y);
        y += 14;
      }

      if (i < spineItems.length - 1) pdf.addPage();
    }

    pdf.save("converted.pdf");
    statusDiv.innerHTML = "<p>✅ Conversion complete! Your PDF is ready.</p>";
    previewDiv.innerHTML = "<p>Done — check your download folder.</p>";
  } catch (err) {
    console.error(err);
    statusDiv.innerHTML = `<p style='color:red;'>Conversion failed: ${err.message}</p>`;
  }

  convertBtn.disabled = false;
});
