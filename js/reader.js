const epubInput = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");
const viewer = document.getElementById("viewer");
const statusDiv = document.getElementById("status");
const progressText = document.getElementById("progressText");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

let book, rendition, currentLocation;

function setStatus(msg, color = "#333") {
  statusDiv.innerHTML = `<p style="color:${color};">${msg}</p>`;
  console.log(msg);
}

epubInput.addEventListener("change", handleEpubSelect);

function handleEpubSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  setStatus(`📂 Loading <strong>${file.name}</strong>...`);
  reader.onload = (evt) => {
    try {
      if (book) book.destroy();
      book = ePub(evt.target.result);

      rendition = book.renderTo("viewer", { width: "100%", height: "100%", spread: "none" });
      rendition.themes.register("idcrypt", {
        "body": { fontSize: "14pt", lineHeight: "1.4", color: "#222" },
        "img": { maxWidth: "100%", height: "auto" }
      });
      rendition.themes.select("idcrypt");

      rendition.display();
      convertBtn.disabled = false;

      setStatus("✅ EPUB loaded successfully. You can preview before converting.", "green");
      progressText.textContent = "Ready to convert.";
    } catch (err) {
      setStatus(`❌ Failed to load EPUB: ${err.message}`, "red");
    }
  };

  reader.readAsArrayBuffer(file);
}

// navigation
prevBtn.addEventListener("click", () => rendition?.prev());
nextBtn.addEventListener("click", () => rendition?.next());
