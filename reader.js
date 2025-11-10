let rendition, book;

async function loadEPUB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const arrayBuffer = e.target.result;
      try {
        book = ePub(arrayBuffer);
        rendition = book.renderTo("epubFrame", {
          width: "100%",
          height: "100%",
          spread: "none"
        });

        rendition.display();

        rendition.on("rendered", () => {
          const iframe = document.querySelector("#epubFrame");
          const doc = iframe.contentDocument;
          const html = doc.documentElement;
          const body = doc.body;

          const height = Math.max(
            body.scrollHeight,
            html.scrollHeight,
            body.offsetHeight,
            html.offsetHeight
          );
          iframe.style.height = `${height}px`;
        });

        await book.ready;
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
