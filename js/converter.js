// converter.js
// Requires window._idcrypt.book to be set by reader.js
document.getElementById("convertBtn").addEventListener("click", async () => {
  const book = window._idcrypt?.book;
  const rendition = window._idcrypt?.rendition;
  if (!book) {
    alert("Load an EPUB first.");
    return;
  }

  setStatus("Preparing conversion..."); setProgress(2, "Preparing");
  await sleep(300);

  const spine = book.spine.spineItems;
  const total = spine.length;
  if (total === 0) { setStatus("No content found.", "red"); return; }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4" }); // use mm for ease
  const A4_W = 210, A4_H = 297;
  const MARGIN_MM = 20; // 20mm margin
  const contentWidthMM = A4_W - MARGIN_MM * 2;

  let outPages = 0;

  for (let i = 0; i < total; i++) {
    const item = spine[i];

    // render spine item to a Document using epub.js low-level API
    try {
      await item.load(book.load.bind(book));
    } catch (e) {
      console.warn("load failed", e);
    }

    let doc;
    try {
      doc = await item.render(); // returns a Document for the spine item
    } catch (e) {
      console.warn("render() failed, try display fallback", e);
      try {
        await rendition.display(item.href);
        await waitForRender(rendition, 1500);
        // try to get iframe doc
        const iframe = document.getElementById("viewer").querySelector("iframe");
        doc = iframe ? iframe.contentDocument : null;
      } catch (er) {
        console.warn("fallback display failed", er);
        doc = null;
      }
    }

    if (!doc) { console.warn("No document for spine item", i); continue; }

    // build temp container with <head> styles + body content
    const temp = document.createElement("div");
    temp.style.width = (contentWidthMM * (96/25.4)) + "px"; // px width approx
    temp.style.boxSizing = "border-box";
    temp.style.background = "#ffffff";
    temp.style.padding = "8px";
    // copy styles from doc.head (embedded <style>), and also inline basic CSS to normalize
    const headStyles = Array.from(doc.querySelectorAll("style")).map(s => s.textContent).join("\n");
    const styleTag = `<style> ${headStyles} img{max-width:100%;height:auto;} body{background:#fff;color:#111;} </style>`;
    // use doc.body.innerHTML
    temp.innerHTML = styleTag + doc.body.innerHTML;

    // attach temporarily (hidden off-screen)
    temp.style.position = "fixed";
    temp.style.left = "-10000px";
    temp.style.top = "0";
    document.body.appendChild(temp);

    // wait for images in temp to load
    const imgs = Array.from(temp.querySelectorAll("img"));
    await Promise.all(imgs.map(img => {
      return new Promise(res => {
        if (img.complete) return res();
        img.onload = img.onerror = () => res();
      });
    }));

    // small CSS-font settle
    await sleep(200);

    // try jsPDF.html (searchable) first
    let usedFallback = false;
    try {
      if (outPages > 0) pdf.addPage();
      await pdf.html(temp, {
        x: MARGIN_MM,
        y: MARGIN_MM,
        width: contentWidthMM,
        windowWidth: temp.clientWidth || Math.max(1000, (contentWidthMM*(96/25.4))),
        html2canvas: { scale: 0.9, useCORS: true }
      });
      outPages++;
    } catch (err) {
      console.warn("jsPDF.html failed, fallback to image capture for spine", err);
      usedFallback = true;
      // snapshot full temp with html2canvas at high scale
      const canvas = await html2canvas(temp, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      // split canvas vertically into A4 pages with margins
      const pxPerMM = 96 / 25.4;
      const pdfPagePxHeight = Math.floor((A4_H - 2 * MARGIN_MM) * pxPerMM *  (canvas.width / (contentWidthMM * pxPerMM)) );
      // simpler: compute page slice height in px directly relative to canvas width:
      const pageSliceH_px = Math.floor((A4_H - 2*MARGIN_MM) * (canvas.width / (contentWidthMM * pxPerMM)) * (pxPerMM/pxPerMM) ); // keep similar ratio
      // Instead of complex math, compute ratio to map canvas width -> contentWidthMM:
      const contentWidthPx = canvas.width;
      const mmPerPx = (contentWidthMM) / contentWidthPx; // mm per px
      const pageSliceHeightPx = Math.floor((A4_H - 2*MARGIN_MM) / mmPerPx);

      let y = 0;
      let sliceIndex = 0;
      while (y < canvas.height) {
        const sliceH = Math.min(pageSliceHeightPx, canvas.height - y);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, -y);
        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);

        if (outPages > 0) pdf.addPage();
        // compute display height in mm:
        const displayW_mm = contentWidthMM;
        const displayH_mm = (sliceH * displayW_mm) / canvas.width;
        pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, displayW_mm, displayH_mm);

        y += sliceH;
        sliceIndex++;
        outPages++;
      }
    } finally {
      // cleanup
      document.body.removeChild(temp);
    }

    // progress
    setProgress(Math.round(((i+1)/total)*100), `Spine ${i+1}/${total}` + (usedFallback ? ' (fallback used)' : ''));
    await sleep(200);
  } // end spine loop

  pdf.save('idcrypt-epub.pdf');
  setStatus('✅ PDF conversion done', 'green');
  setProgress(100, 'Done');
});
