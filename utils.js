/* utils.js - small helpers used by reader & converter */
(function(){
  window._utils = window._utils || {};

  window._utils.sleep = function(ms){ return new Promise(res => setTimeout(res, ms)); };

  window._utils.waitForRender = function(rendition, timeout = 5000){
    return new Promise((resolve, reject) => {
      let resolved = false;
      const handler = () => {
        if (!resolved) { resolved = true; rendition.off('rendered', handler); resolve(); }
      };
      rendition.on('rendered', handler);
      // safety timeout
      setTimeout(() => {
        if (!resolved) { resolved = true; rendition.off('rendered', handler); resolve(); }
      }, timeout);
    });
  };

  // ensure iframe created and sandbox set (returns iframe element or null)
  window._utils.ensureIframeReady = async function(viewerEl, attempts = 8, delay = 200){
    for (let i=0;i<attempts;i++){
      const iframe = viewerEl.querySelector('iframe');
      if (iframe) {
        try { iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin'); } catch(e){}
        // sometimes srcdoc uses about:srcdoc; ensure same-origin allowed by epub.js configuration
        return iframe;
      }
      await window._utils.sleep(delay);
    }
    return null;
  };

})();
