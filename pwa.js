/* J.B.C Crome — PWA. À charger avec <script src="/pwa.js" defer></script> sur toutes les pages */
(() => {
  if (!('serviceWorker' in navigator)) return;

  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let swReg = null;
  let deferredPrompt = null;

  // ---------- UI flottante ----------
  const style = document.createElement('style');
  style.textContent = `
  .jbc-pwa{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
  .jbc-pwa button{font:600 .85rem/1 system-ui,sans-serif;color:#111317;background:linear-gradient(100deg,#9aa1ab,#f4f6f9,#9aa1ab);border:0;border-radius:999px;padding:11px 16px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
  .jbc-pwa button[hidden]{display:none}`;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.className = 'jbc-pwa';
  const btnInstall = Object.assign(document.createElement('button'), { textContent: '📲 Installer l’app', hidden: true });
  const btnNotif = Object.assign(document.createElement('button'), { textContent: '🔔 Rappels de convoi', hidden: true });
  box.append(btnInstall, btnNotif);
  document.body.appendChild(box);

  // ---------- Service worker ----------
  navigator.serviceWorker.register('/sw.js').then(reg => {
    swReg = reg;
    refreshNotifButton();
    if (Notification.permission === 'granted') enableReminders();
  }).catch(err => console.warn('SW non enregistré', err));

  // ---------- Installation ----------
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (!standalone) btnInstall.hidden = false;
  });
  btnInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btnInstall.hidden = true;
  });
  addEventListener('appinstalled', () => { btnInstall.hidden = true; });

  // ---------- Rappels de convoi ----------
  function refreshNotifButton() {
    if (!('Notification' in window)) return;
    btnNotif.hidden = Notification.permission !== 'default';
  }

  async function enableReminders() {
    const reg = swReg || await navigator.serviceWorker.ready;
    // Vérification immédiate + toutes les 5 min tant que l'app est ouverte
    const ping = () => reg.active && reg.active.postMessage('check-events');
    ping();
    setInterval(ping, 5 * 60 * 1000);
    // Vérification périodique en arrière-plan (Chrome Android, app installée)
    try {
      if ('periodicSync' in reg) {
        const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (st.state === 'granted') await reg.periodicSync.register('jbc-events', { minInterval: 15 * 60 * 1000 });
      }
    } catch (_) {}
  }

  btnNotif.addEventListener('click', async () => {
    const res = await Notification.requestPermission();
    refreshNotifButton();
    if (res === 'granted') enableReminders();
  });
})();
