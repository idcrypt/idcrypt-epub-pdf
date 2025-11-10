const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const statusDiv = document.getElementById("status");
const viewer = document.getElementById("viewer");
let book, spineItems = [];

epubInput.addEventListener("change", handleEpubSelect);

async function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`📖 Loading <strong>${file.name}</strong>...`);
  const reader = new FileReader();

  reader.onload = async function(evt) {
    const data = evt.target.result;
    try {
      book = ePub(data);
      await book.ready;

      // Simpan daftar spine
      spineItems = book.spine.spineItems;

      // Ambil konten pertama untuk preview
      const first = await spineItems[0].load(book.load.bind(book));
      const html = new TextDecoder().decode(first.contents);
      viewer.innerHTML = html.slice(0, 2000) + "<p style='color:gray;'>...</p>";

      setStatus("✅ EPUB loaded successfully. Ready to convert.");
      convertBtn.disabled = false;
    } catch (err) {
      setStatus(`❌ Error loading EPUB: ${err.message}`, "red");
    }
  };

  reader.readAsArrayBuffer(file);
}
