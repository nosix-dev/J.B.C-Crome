/* J.B.C Crome — section Équipe.
   Source : API du bot (GET /api/team) → { patron:[{pseudo,avatar}], gerants:[…], discord:[…], chauffeurs:[…], … }
   equipe.json : "extras" (camion, pseudo HaulMP, par pseudo Discord) + "membres" (secours si l'API est injoignable). */
(() => {
  // ⚠️ Domaine ngrok du bot (NGROK_DOMAIN)
  const TEAM_API_URL = 'https://caviar-gatherer-matriarch.ngrok-free.dev/api/team';
  const JSON_URL = 'equipe.json';

  // Équipes affichées, dans l'ordre : clé de l'API → titre sur le site.
  // Un pseudo n'apparaît que dans la première équipe où il figure.
  const GROUPES = [
    { cle: 'patron',     titre: 'Patron' },
    { cle: 'gerants',    titre: 'Gérants' },
    { cle: 'discord',    titre: 'Équipe Discord' }
    // { cle: 'chauffeurs',       titre: 'Chauffeurs' },
    // { cle: 'chauffeurs_essai', titre: 'Chauffeurs à l’essai' }
  ];

  const css = `
  .jbc-team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px;max-width:1100px;margin:0 auto}
  .jbc-team-title{max-width:1100px;margin:48px auto 20px;font-weight:800;font-size:1.3rem;color:var(--chrome-1,#f5f7fb);letter-spacing:.04em;display:flex;align-items:center;gap:14px}
  .jbc-team-title::after{content:'';flex:1;height:1px;background:var(--hairline,#2a2e36)}
  .jbc-team-title:first-of-type{margin-top:0}
  .jbc-card{position:relative;background:#0b0d11;border:1px solid var(--hairline,#2a2e36);border-radius:16px;padding:28px 20px 22px;text-align:center;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
  .jbc-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-hard,0 16px 40px rgba(0,0,0,.5));border-color:var(--amber,#5da8ff)}
  .jbc-card__avatar{width:96px;height:96px;border-radius:50%;margin:0 auto 16px;display:grid;place-items:center;overflow:hidden;background:#12151b;border:2px solid var(--chrome-1,#f5f7fb);box-shadow:0 0 0 4px #0b0d11,0 0 0 5px var(--hairline,#3a3f49);font-size:1.8rem;font-weight:800;color:var(--chrome-1,#f5f7fb)}
  .jbc-card__avatar img{width:100%;height:100%;object-fit:cover;display:block}
  .jbc-card__name{margin:0;font-weight:800;font-size:1.15rem;color:#fff}
  .jbc-card__role{display:inline-block;margin:10px 0 16px;padding:4px 14px;border-radius:999px;font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0f1f33;background:linear-gradient(135deg,#f7fbff,#dce9f9 50%,#8fbcee)}
  .jbc-card__row{display:flex;justify-content:space-between;gap:10px;font-size:.85rem;padding:8px 0;border-top:1px dashed rgba(255,255,255,.12);color:var(--chrome-3,#9aa1ab)}
  .jbc-card__row b{color:var(--chrome-1,#f5f7fb);font-weight:700;text-align:right}
  .jbc-card__row a{color:var(--amber,#5da8ff);text-decoration:none}
  .jbc-card__row a:hover{text-decoration:underline}
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
    if (href) {
      const a = el('a', null, value);
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      b.appendChild(a);
    } else b.textContent = value;
    r.appendChild(b);
    return r;
  }

  const initiales = nom => (nom || '?').trim().slice(0, 2).toUpperCase();
  const cleNom = nom => String(nom || '').trim().toLowerCase();

  function card(m, role) {
    const c = el('article', 'jbc-card');
    const av = el('div', 'jbc-card__avatar');
    if (m.avatar) {
      const img = new Image();
      img.alt = m.pseudo || ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.remove(); av.textContent = initiales(m.pseudo); };
      img.src = m.avatar;
      av.appendChild(img);
    } else av.textContent = initiales(m.pseudo);
    c.appendChild(av);
    c.appendChild(el('h3', 'jbc-card__name', m.pseudo));
    if (role) c.appendChild(el('span', 'jbc-card__role', role));
    if (m.camion) c.appendChild(row('Camion préféré', m.camion));
    if (m.haulmp) c.appendChild(row('HaulMP', m.haulmp, m.haulmp_url));
    return c;
  }

  async function getJson(url, opts) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, Object.assign({ cache: 'no-cache', signal: ctrl.signal }, opts));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  async function init() {
    let mount = document.getElementById('equipe');
    if (!mount) {
      mount = el('section'); mount.id = 'equipe';
      const footer = document.querySelector('footer');
      footer ? footer.before(mount) : document.body.appendChild(mount);
    }

    // Extras (camion / HaulMP) + secours, indexés par pseudo Discord
    let extras = {}, secours = [];
    try {
      const d = await getJson(JSON_URL);
      Object.keys(d.extras || {}).forEach(k => { extras[cleNom(k)] = d.extras[k]; });
      secours = d.membres || [];
    } catch (e) { console.warn('[equipe] equipe.json :', e.message); }

    let groupes = [];
    try {
      const d = await getJson(TEAM_API_URL, { headers: { 'ngrok-skip-browser-warning': '1' } });
      const deja = new Set();
      GROUPES.forEach(g => {
        const membres = [];
        (d[g.cle] || []).forEach(m => {
          const k = cleNom(m.pseudo);
          if (!k || deja.has(k)) return;
          deja.add(k);
          membres.push(Object.assign({}, m, extras[k] || {}));
        });
        if (membres.length) groupes.push({ titre: g.titre, membres });
      });
    } catch (e) { console.warn('[equipe] API du bot injoignable :', e.message); }

    if (!groupes.length && secours.length) {
      groupes = [{ titre: null, membres: secours.map(m => ({ pseudo: m.pseudo || m.nom, avatar: m.avatar, camion: m.camion, haulmp: m.haulmp, haulmp_url: m.haulmp_url, role: m.role })) }];
    }
    if (!groupes.length) return;

    document.head.appendChild(el('style', null, css));

    const head = el('div', 'section-head');
    head.appendChild(el('span', 'eyebrow', 'Le staff'));
    const h2 = el('h2');
    h2.append('Notre ', el('em', null, 'équipe'));
    head.appendChild(h2);
    head.appendChild(el('p', null, 'Ceux qui organisent les convois et gardent le chrome propre.'));
    mount.appendChild(head);

    groupes.forEach(g => {
      if (g.titre) mount.appendChild(el('h3', 'jbc-team-title', g.titre));
      const grid = el('div', 'jbc-team-grid');
      g.membres.forEach(m => grid.appendChild(card(m, g.titre ? null : m.role)));
      mount.appendChild(grid);
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();/* J.B.C Crome — section Équipe. Données dans /equipe.json
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
