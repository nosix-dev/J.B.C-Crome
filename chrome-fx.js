/* J.B.C Crome — effets chrome. À charger avec <script src="/chrome-fx.js" defer></script> */
(() => {
  // Éléments qui reçoivent automatiquement le reflet chrome (modifie la liste à ta guise)
  const AUTO_SELECTOR = [
    'a[class*="btn"]', 'button', '[class*="card"]', '[class*="btn"]',
    '.timeline-item', '[class*="stat"]', '[data-chrome]'
  ].join(',');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function decorate(root = document) {
    root.querySelectorAll(AUTO_SELECTOR).forEach(el => {
      if (el.classList.contains('chrome-shine')) return;
      if (el.closest('nav, header') && el.tagName !== 'A' && el.tagName !== 'BUTTON') return;
      el.classList.add('chrome-shine');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    });
  }

  // Suivi de la souris pour le halo lumineux
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('.chrome-shine');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // Transition de secours si les View Transitions inter-pages ne sont pas supportées
  const nativeVT = 'CSSViewTransitionRule' in window;
  if (!nativeVT && !reduced) {
    document.body.classList.add('jbc-enter');
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target && a.target !== '_self') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.body.classList.add('jbc-leaving');
      setTimeout(() => { location.href = url.href; }, 250);
    });
    addEventListener('pageshow', e => {
      if (e.persisted) document.body.classList.remove('jbc-leaving');
    });
  }

  // Décore au chargement, puis sur les contenus ajoutés dynamiquement (calendrier, galerie…)
  decorate();
  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(decorate, 150); })
    .observe(document.body, { childList: true, subtree: true });
})();
