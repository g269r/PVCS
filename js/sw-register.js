/* ============================================================
   Service Worker Registration – PVCS DMS PWA
   ============================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PVCS] Service Worker registered:', reg.scope);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Update available. Refresh to get the latest version.', 'info', 6000);
            }
          });
        });
      })
      .catch(err => console.warn('[PVCS] SW registration failed:', err));
  });
}
