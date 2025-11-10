// ===========================
// 📘 IDCRYPT EPUB Reader Module
// ===========================
let book = null;
let rendition = null;

export async function loadEpub(file, viewerId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        if (book) book.destroy();
        book = ePub(evt.target.result);

        rendition = book.renderTo(viewerId, {
          width: "100%",
          height: "100%",
          spread: "none"
        });

        // Buka sandbox agar scripts bisa jalan
        setTimeout(() => {
          const iframe = document.getElementById(viewerId)?.querySelector("iframe");
          if (iframe)
            iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
        }, 300);

        // Tema visual IDCRYPT
        rendition.themes.register("idcrypt", {
          "body": {
            "font-size": "14pt",
            "line-height": "1.4",
            "margin": "20px",
            "color": "#000",
            "background": "#fff",
            "width": "100%"
          },
          "img": { "max-width": "100%", "height": "auto" }
        });
        rendition.themes.select("idcrypt");

        resolve({ book, rendition });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function getBook() {
  return book;
}

export function getRendition() {
  return rendition;
}
