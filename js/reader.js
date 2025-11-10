// ===== EPUB Reader =====
const input = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const viewer = document.getElementById("viewer");
let globalBook;

input.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`Loading <strong>${file.name}</strong>...`, "#007bff");
  viewer.innerHTML = "";

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = evt.target.result;
      globalBook = ePub(data);
      const rendition = globalBook.renderTo("viewer", {
        width: "100%",
        height: "90vh",
      });
      await rendition.display();
      setStatus("✅ EPUB loaded successfully! You can preview now.", "green");
      convertBtn.disabled = false;
    } catch (err) {
      setStatus("❌ Error loading EPUB: " + err.message, "red");
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
});
