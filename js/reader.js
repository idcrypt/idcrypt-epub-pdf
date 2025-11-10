/* reader.js
   - load EPUB into #viewer using epub.js
   - expose window._idcrypt.getBook/getRendition/loadEpubFile
   - navigation prev/next wired
*/
(function(){
  window._idcrypt = window._idcrypt || {};
  let book = null;
  let rendition = null;

  function setStatus(msg, color){
    const s = document.getElementById('status');
    s.innerHTML = `<p style="color:${color||'#333'}">${msg}</p>`;
    console.log(msg);
  }

  async function loadEpubFile(file) {
    if (!file) throw new Error('No file provided');
    const arrayBuffer = await file.arrayBuffer();

    if (book) {
      try { book.destroy(); } catch(e) {}
      book = null; rendition = null;
      document.getElementById('viewer').innerHTML = '';
    }

    book = ePub(arrayBuffer);

    // render to viewer
    rendition = book.renderTo('viewer', {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "paginated"
    });

    // apply readable theme
    rendition.themes.register('idcrypt-theme', {
      'body': {
        'font-size': '14pt',
        'line-height': '1.4',
        'color': '#111',
        'background': '#fff',
        'margin': '12px'
      },
      'img': { 'max-width': '100%', 'height': 'auto' }
    });
    rendition.themes.select('idcrypt-theme');

    // Wait for first render
    await new Promise((resolve) => {
      const handler = () => { rendition.off('rendered', handler); resolve(); };
      rendition.on('rendered', handler);
      // call display to ensure initial content shows
      rendition.display();
    });

    // ensure iframe sandbox attribute set
    const viewerEl = document.getElementById('viewer');
    await window._utils.ensureIframeReady(viewerEl, 10, 200);

    setStatus('EPUB loaded. Preview available. Use prev/next to inspect pages.', 'green');
    return { book, rendition };
  }

  // wire file input if present
  document.addEventListener('DOMContentLoaded', () => {
    const fileEl = document.getElementById('epubFile');
    const convertBtn = document.getElementById('convertBtn');
    if (fileEl) {
      fileEl.addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setStatus(`Loading ${f.name} ...`);
        try {
          await loadEpubFile(f);
          if (convertBtn) convertBtn.disabled = false;
        } catch (err) {
          setStatus('Error loading EPUB: ' + err.message, 'red');
        }
      });
    }

    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', () => rendition && rendition.prev());
    if (next) next.addEventListener('click', () => rendition && rendition.next());
  });

  // expose
  window._idcrypt.getBook = () => book;
  window._idcrypt.getRendition = () => rendition;
  window._idcrypt.loadEpubFile = loadEpubFile;
})();
