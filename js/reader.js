// ===== IDCRYPT EPUB Reader (reader.js) =====
let book = null, rendition = null;

export async function loadEpub(file, viewer, onReady, onError) {
  try {
    const data = await file.arrayBuffer();
    if (book) book.destroy();

    book = ePub(data);
    rendition = book.renderTo(viewer, {
      width: "100%",
      height: "90vh",
      spread: "none",
      flow: "paginated"
    });

    // Allow scripts in iframe
    setTimeout(() => {
      const iframe = viewer.querySelector("iframe");
      if (iframe) iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    }, 300);

    rendition.themes.register("idcrypt", {
      "body": {
        fontSize: "14pt",
        lineHeight: "1.5",
        margin: "20px",
        color: "#000",
        background: "#fff"
      },
      "img": { maxWidth: "100%", height: "auto" }
    });
    rendition.themes.select("idcrypt");

    rendition.on("rendered", () => onReady(book, rendition));
  } catch (err) {
    console.error("EPUB load error:", err);
    onError(err);
  }
}

export function getBook() { return book; }
export function getRendition() { return rendition; }
