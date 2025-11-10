// ===== IDCRYPT EPUB Reader Loader =====
const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const viewer = document.getElementById("viewer");

let book = null; // local
window.book = null; // global for converter

epubInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`📖 Loading <strong>${file.name}</strong>...`);
  viewer.innerHTML = "<p style='color:#777;'>Loading EPUB preview...</p>";
  convertBtn.disabled = true;

  try {
    // Load EPUB as Blob
    const arrayBuffer = await file.arrayBuffer();
    book = ePub(arrayBuffer);
    window.book = book;

    // Wait until ready
    await book.ready;

    // ✅ Force-load full spine + navigation
    await book.loaded.spine;
    await book.loaded.navigation;

    // Render preview
    const rendition = book.renderTo("viewer", {
      width: "100%",
      height: "600px",
      spread: "none",
    });
    rendition.display();

    setStatus("✅ EPUB loaded successfully. Ready to convert.", "green");
    convertBtn.disabled = false;
  } catch (err) {
    console.error("EPUB Load Error:", err);
    setStatus(`❌ Failed to load EPUB: ${err.message}`, "red");
  }
});
