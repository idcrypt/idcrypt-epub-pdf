let book, rendition;

async function loadEPUB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const arrayBuffer = e.target.result;
      try {
        if (book) book.destroy();
        book = ePub(arrayBuffer);
        rendition = book.renderTo("epubFrame", {
          width: "100%",
          height: "100%",
          spread: "none"
        });

        await book.ready;
        await rendition.display();

        // Tunggu render pertama selesai
        await waitForRender(rendition);

        const iframe = document.querySelector("#epubFrame");
        if (iframe) {
          iframe.style.minHeight = "1000px";
          iframe.style.background = "#fff";
        }

        setStatus(`✅ EPUB "${file.name}" loaded successfully!`);
        document.getElementById("convertBtn").disabled = false;
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
