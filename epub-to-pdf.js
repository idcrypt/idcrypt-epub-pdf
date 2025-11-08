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
    let y = 60;

    for (let i = 0; i < spineItems.length; i++) {
      const section = await spineItems[i].load(book.load.bind(book));
      const htmlContent = section.contents; // ini HTML mentah

      // Parse ke dokumen DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Ambil isi teks dari body
      const text = doc.body ? doc.body.innerText.trim() : "";
      if (text.length > 0) {
        const lines = pdf.splitTextToSize(text, 500);
        pdf.text(lines, 50, y);
        pdf.addPage();
      }

      section.unload(); // bebaskan memory
    }

    pdf.save("converted.pdf");
    statusDiv.innerHTML = "<p>✅ Conversion complete! Your PDF is ready.</p>";
    previewDiv.innerHTML = "<p>Done — check your download folder.</p>";
  } catch (err) {
    statusDiv.innerHTML = `<p style='color:red;'>Conversion failed: ${err.message}</p>`;
  }

  convertBtn.disabled = false;
});
