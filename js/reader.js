// reader.js
window._idcrypt = window._idcrypt || {};
let book = null;
let rendition = null;

const input = document.getElementById("epubInput");
const convertBtn = document.getElementById("convertBtn");

input.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setStatus(`Loading ${file.name} ...`);
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (book) try { book.destroy(); } catch(e){}
    book = ePub(arrayBuffer);
    window._idcrypt.book = book;

    // render to viewer for preview (safe)
    const viewer = document.getElementById("viewer");
    viewer.innerHTML = ""; // clear
    rendition = book.renderTo("viewer", {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "paginated"
    });
    window._idcrypt.rendition = rendition;

    // apply simple theme for readability
    rendition.themes.register("idcrypt", {
      "body": { "font-size": "14pt", "line-height": "1.4", "color": "#111", "background": "#fff", "margin": "12px" },
      "img": { "max-width": "100%", "height": "auto", "display": "block", "margin": "6px auto" }
    });
    rendition.themes.select("idcrypt");

    // initial display and wait
    await rendition.display();
    await waitForRender(rendition, 1500);
    // ensure iframe height (if any) adjusts
    try {
      const iframe = viewer.querySelector("iframe");
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
        iframe.style.height = (h + 20) + "px";
      }
    } catch (e) { /* ignore */ }

    setStatus("EPUB loaded. You can preview then press Convert.", "green");
    convertBtn.disabled = false;
    setProgress(5, "Ready");
  } catch (err) {
    console.error(err);
    setStatus("Error loading EPUB: " + err.message, "red");
  }
});
