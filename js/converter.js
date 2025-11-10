/* converter.js
   - Waits for reader to load EPUB
   - Iterates spine, displays each spine item, waits render, captures body via html2canvas
   - Generates searchable-text output when possible by using jsPDF.html (preferred), otherwise image fallback
*/
(function(){
  const convertBtn = document.getElementById('convertBtn');
  const progressEl = document.getElementById('progress');
  const progressText = document.getElementById('progressText');
  const status = document.getElementById('status');
  const viewer = document.getElementById('viewer');

  function setStatus(msg, color='#333'){
    status.innerHTML = `<p style="color:${color}">${msg}</p>`;
    console.log(msg);
  }

  async function convert() {
    const book = window._idcrypt.getBook();
    const rendition = window._idcrypt.getRendition();
    if (!book || !rendition) return alert('Load an EPUB file first.');

    convertBtn.disabled = true;
    setStatus('Starting conversion...', '#007acc');
    progressText.textContent = 'Preparing...';

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = 595, pageH = 842, margin = 25;

    const spine = book.spine.spineItems;
    progressEl.max = spine.length;

    let pageIndex = 0;

    for (let i = 0; i < spine.length; i++) {
      const item = spine[i];
      // display spine item
      try {
        await rendition.display(item.href);
      } catch(e) {
        console.warn('rendition.display failed:', e);
      }
      // wait for rendered event (utility)
      await window._utils.waitForRender(rendition, 3000);
      // small extra wait to allow images/fonts
      await window._utils.sleep(500);

      // get iframe body
      const iframe = viewer.querySelector('iframe');
      if (!iframe) { console.warn('iframe not found for page', i); continue; }
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) { console.warn('iframe doc missing'); continue; }
      const body = doc.body;
      if (!body || !body.innerText.trim()) { console.log('skipping empty page', i); continue; }

      // Try text-based render with jsPDF.html first (better: searchable)
      let usedFallback = false;
      // create temp container cloning body content (to avoid side effects)
      const temp = document.createElement('div');
      temp.style.width = (pageW - margin*2) + 'pt';
      temp.style.background = '#ffffff';
      temp.innerHTML = body.innerHTML;
      // cleanup scripts
      temp.querySelectorAll('script').forEach(s => s.remove());
      document.body.appendChild(temp);

      try {
        if (pageIndex > 0) pdf.addPage();
        // jsPDF.html (uses html2canvas under the hood). This yields searchable text where possible.
        await pdf.html(temp, {
          x: margin,
          y: margin,
          width: pageW - margin*2,
          windowWidth: Math.max(1000, temp.clientWidth),
          html2canvas: { scale: 0.9, useCORS: true }
        });
      } catch (err) {
        // fallback: snapshot with html2canvas
        usedFallback = true;
        console.warn('jsPDF.html failed for page', i, err);
        // snapshot
        const canvas = await html2canvas(temp, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        if (pageIndex > 0) pdf.addPage();
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const ratio = Math.min((pageW - margin*2)/canvas.width, (pageH - margin*2)/canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        pdf.addImage(imgData, 'JPEG', (pageW - w)/2, (pageH - h)/2, w, h);
      } finally {
        document.body.removeChild(temp);
      }

      pageIndex++;
      progressEl.value = pageIndex;
      progressText.textContent = `Converted ${pageIndex} / ${spine.length}` + (usedFallback ? ' (image fallback)' : '');
    }

    // save
    pdf.save('idcrypt-epub-final.pdf');
    setStatus('✅ Conversion finished. PDF downloaded.', 'green');
    convertBtn.disabled = false;
    progressText.textContent = 'Done';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('convertBtn');
    if (btn) btn.addEventListener('click', convert);
  });
})();
