export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker.register(swUrl).then((reg) => {
      reg.onupdatefound = () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.onstatechange = () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nueva versión disponible — recarga para actualizar');
          }
        };
      };
    }).catch((err) => {
      console.error('[PWA] Error al registrar service worker:', err);
    });
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.unregister())
      .catch((err) => console.error(err));
  }
}
