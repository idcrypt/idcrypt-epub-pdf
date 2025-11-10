// ===== IDCRYPT EPUB Reader (epub.js) =====
const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const viewer = document.getElementById("viewer");

let book, rendition;

epubInput.addEventListener("change", handleEpubSelect);

async function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  setStatus(`📖 Loading <strong>${file.name}</strong>...`);
  const reader = new FileReader();

  reader.onload = async function(evt) {
    const data = evt.target.result;
    try {
      if (book) book.destroy();
      book = ePub(data);

      rendition = book.renderTo("viewer", { width: "100%", height: "100%", spread: "none" });

      // Allow iframe to render content
      setTimeout(() => {
        const iframe = viewer.querySelector("iframe");
        if (iframe) iframe.setAttribute("sandbox", "allow-same-origin");
      }, 100);

      // Basic theme
      rendition.themes.register("clean", {
        "body": { width: "95%", fontSize: "14pt", lineHeight: "1.4", margin: "auto" },
        "img": { maxWidth: "100%", height: "auto", display: "block", margin: "10px auto" },
        "p, h1, h2, h3, h4": { marginBottom: "12px" }
      });
      rendition.themes.select("clean");

      rendition.display();
      await sleep(800);

      convertBtn.disabled = false;
      setStatus("✅ EPUB loaded successfully! Ready to convert.", "green");
      setProgress(10, "EPUB ready.");
    } catch (err) {
      setStatus(`❌ Error loading EPUB: ${err.message}`, "red");
    }
  };

  reader.readAsArrayBuffer(file);
}
