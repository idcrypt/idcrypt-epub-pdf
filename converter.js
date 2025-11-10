document.getElementById("convertBtn").addEventListener("click", async function () {
  const viewer = document.getElementById("viewer");
  const status = document.getElementById("status");
  const progressBar = document.getElementById("progressBar");
  
  if (!viewer.innerHTML.trim()) {
    alert("Please load an EPUB first.");
    return;
  }

  status.innerHTML = "Rendering to PDF...";
  progressBar.value = 0;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const pages = viewer.querySelectorAll("iframe");

  for (let i = 0; i < pages.length; i++) {
    const iframe = pages[i];
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeBody = iframeDoc.body;
    
    // Konversi isi iframe ke canvas
    const canvas = await html2canvas(iframeBody, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    
    const imgWidth = 210;
    const pageHeight = (canvas.height * 210) / canvas.width;
    
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, pageHeight);
    
    progressBar.value = ((i + 1) / pages.length) * 100;
    await delay(500);
  }

  pdf.save("idcrypt-epub.pdf");
  status.innerHTML = "✅ Done!";
});
