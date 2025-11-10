let globalBook, globalRendition, globalContent;

document.getElementById("epubInput").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("status").innerHTML = "📖 Loading EPUB...";
  
  const book = ePub(file);
  globalBook = book;
  
  const viewer = document.getElementById("viewer");
  viewer.innerHTML = ""; // clear
  
  const rendition = book.renderTo("viewer", {
    width: "100%",
    height: "auto",
    flow: "paginated",
    allowScriptedContent: true
  });
  
  rendition.display();
  globalRendition = rendition;
  
  await book.ready;
  await delay(2000);
  
  document.getElementById("status").innerHTML = "✅ EPUB loaded. Ready to convert.";
});
