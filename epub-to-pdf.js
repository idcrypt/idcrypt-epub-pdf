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
    book = ePub(data);
    convertBtn.disabled = false;
    statusDiv.innerHTML = "<p>EPUB loaded successfully!</p>";
    previewDiv.innerHTML = "<p>Ready to convert.</p>";
  };

  reader.readAsArrayBuffer(file);
}

convertBtn.addEventListener("click", async () => {
  if (!book) return;
  convertBtn.disabled = true;
  statusDiv.innerHTML = "<p>Converting to PDF...</p>";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const spineItems = book.spine.spineItems;
  for (let i = 0; i < spineItems.length; i++) {
    const section = await spineItems[i].load(book.load.bind(book));
    const text = section.contents.innerText;
    pdf.text(text, 10, 10 + (i * 10) % 280);
    pdf.addPage();
  }

  pdf.save("converted.pdf");
  statusDiv.innerHTML = "<p>✅ Conversion complete!</p>";
  convertBtn.disabled = false;
});
