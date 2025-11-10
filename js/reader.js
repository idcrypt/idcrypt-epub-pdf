// ===== IDCRYPT EPUB Reader =====
// Loads and displays EPUB in #viewer using epub.js

document.addEventListener("DOMContentLoaded", () => {
  const epubInput = document.getElementById("epubInput");
  const convertBtn = document.getElementById("convertBtn");
  const viewer = document.getElementById("viewer");

  epubInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus(`Loading <strong>${file.name}</strong>...`);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;

        if (window.book) window.book.destroy();
        window.book = ePub(data);
        window.rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100vh",
          spread: "none",
        });

        // Allow scripts in iframe for rendering
        setTimeout(() => {
          const iframe = viewer.querySelector("iframe");
          if (iframe)
            iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
        }, 200);

        // Style
        rendition.themes.register("idcrypt", {
          body: {
            background: "#fff !important",
            color: "#000 !important",
            fontSize: "14pt !important",
            lineHeight: "1.5",
            padding: "10px",
          },
          img: { maxWidth: "100%", height: "auto" },
        });
        rendition.themes.select("idcrypt");

        await rendition.display();
        setStatus("✅ EPUB loaded. You can preview then press Convert.", "green");
        setProgress(0, "Ready.");

        convertBtn.disabled = false;
      } catch (err) {
        setStatus(`❌ Error loading EPUB: ${err.message}`, "red");
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
});
