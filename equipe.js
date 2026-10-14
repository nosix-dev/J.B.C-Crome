/* J.B.C Crome — section Équipe. Données dans /equipe.json
   Utilisation : <div id="equipe"></div> + <script src="/equipe.js" defer></script> sur apropos.html */
(() => {
  const JSON_URL = '/equipe.json';

  const css = `
  .jbc-team{max-width:1100px;margin:0 auto;padding:80px 20px}
  .jbc-team__eyebrow{text-align:center;letter-spacing:.3em;text-transform:uppercase;font-size:.75rem;color:#9aa1ab}
  .jbc-team__title{text-align:center;font-size:clamp(1.8rem,4vw,2.6rem);margin:.3em 0 .2em;color:#f5f7fb}
  .jbc-team__title em{font-style:italic;color:#c9ced6}
  .jbc-team__sub{text-align:center;color:#9aa1ab;margin:0 0 2.5rem;font-style:italic}
  .jbc-team__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px}
  .jbc-card{position:relative;background:linear-gradient(160deg,#181b21,#111317);border:1px solid #2a2e36;border-radius:14px;padding:26px 20px 22px;text-align:center;color:#e8ebf0;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
  .jbc-card:hover{transform:translateY(-4px);border-color:#8d939c;box-shadow:0 12px 30px rgba(0,0,0,.45)}
  .jbc-card__avatar{width:92px;height:92px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;overflow:hidden;background:#20242c;border:2px solid #c9ced6;box-shadow:0 0 0 4px #111317,0 0 0 5px #3a3f49;font-size:1.8rem;font-weight:700;color:#c9ced6}
  .jbc-card__avatar img{width:100%;height:100%;object-fit:cover;display:block}
  .jbc-card__name{margin:0;font-size:1.15rem;color:#fff}
  .jbc-card__role{display:inline-block;margin:8px 0 14px;padding:3px 12px;border-radius:999px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#111317;background:linear-gradient(100deg,#9aa1ab,#f4f6f9,#9aa1ab)}
  .jbc-card__row{display:flex;justify-content:space-between;gap:10px;font-size:.85rem;padding:7px 0;border-top:1px dashed #2a2e36;color:#9aa1ab}
  .jbc-card__row b{color:#e8ebf0;font-weight:600;text-align:right}
  .jbc-card__row a{color:#e8ebf0;text-decoration:underline dotted}
  `;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function row(label, value, href) {
    const r = el('div', 'jbc-card__row');
    r.appendChild(el('span', null, label));
    const b = el('b');
    if (href) { const a = el('a', null, value); a.href = href; a.target = '_blank'; a.rel = 'noopener'; b.appendChild(a); }
    else b.textContent = value;
    r.appendChild(b);
    return r;
  }

  function card(m) {
    const c = el('article', 'jbc-card chrome-shine');
    c.style.position = 'relative';
    const av = el('div', 'jbc-card__avatar');
    if (m.avatar) {
      const img = new Image();
      img.alt = m.nom; img.loading = 'lazy';
      img.onerror = () => { img.remove(); av.textContent = (m.nom || '?').slice(0, 2).toUpperCase(); };
      img.src = m.avatar;
      av.appendChild(img);
    } else av.textContent = (m.nom || '?').slice(0, 2).toUpperCase();
    c.appendChild(av);
    c.appendChild(el('h3', 'jbc-card__name', m.nom));
    if (m.role) c.appendChild(el('span', 'jbc-card__role', m.role));
    if (m.camion) c.appendChild(row('Camion préféré', m.camion));
    if (m.haulmp) c.appendChild(row('HaulMP', m.haulmp, m.haulmp_url));
    return c;
  }

  async function init() {
    let mount = document.getElementById('equipe');
    if (!mount) {
      mount = el('div'); mount.id = 'equipe';
      const footer = document.querySelector('footer');
      footer ? footer.before(mount) : document.body.appendChild(mount);
    }
    let data;
    try {
      const r = await fetch(JSON_URL, { cache: 'no-cache' });
      data = await r.json();
    } catch (e) { console.warn('equipe.json introuvable', e); return; }
    const members = Array.isArray(data) ? data : (data.membres || []);
    if (!members.length) return;

    const style = el('style', null, css);
    document.head.appendChild(style);

    const sec = el('section', 'jbc-team');
    sec.appendChild(el('div', 'jbc-team__eyebrow', 'Le staff'));
    const h = el('h2', 'jbc-team__title');
    h.append('Notre ', Object.assign(el('em'), { textContent: 'équipe' }));
    sec.appendChild(h);
    sec.appendChild(el('p', 'jbc-team__sub', 'Ceux qui organisent les convois et gardent le chrome propre'));
    const grid = el('div', 'jbc-team__grid');
    members.forEach(m => grid.appendChild(card(m)));
    sec.appendChild(grid);
    mount.appendChild(sec);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
