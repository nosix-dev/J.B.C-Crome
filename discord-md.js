/* J.B.C Crome — rendu Markdown façon Discord (sûr : tout est échappé avant le formatage)
   Usage : el.innerHTML = DiscordMD.render(profile.bio);
   Syntaxe : # ## ### titres · -# petit texte · **gras** · *italique* / _italique_ · ***gras italique***
   __souligné__ · ~~barré~~ · ||spoiler|| · ^^MAJUSCULES^^ · `code` · ```bloc``` · > citation · >>> citation multi-lignes
   - liste · 1. liste numérotée · [texte](https://lien) · liens https auto */
(function () {
  const CSS = `
.dmd{line-height:1.5;word-break:break-word;overflow-wrap:anywhere}
.dmd h1,.dmd h2,.dmd h3{margin:.6em 0 .25em;line-height:1.2;font-weight:800}
.dmd h1{font-size:1.6em}.dmd h2{font-size:1.3em}.dmd h3{font-size:1.1em}
.dmd .dmd-sub{font-size:.8em;opacity:.65}
.dmd .dmd-gap{height:.6em}
.dmd u{text-underline-offset:2px}
.dmd code{font-family:ui-monospace,Consolas,monospace;background:rgba(255,255,255,.08);padding:.1em .35em;border-radius:5px;font-size:.9em}
.dmd pre{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;overflow-x:auto;margin:.5em 0}
.dmd pre code{background:none;padding:0}
.dmd blockquote{margin:.35em 0;padding:.1em 0 .1em 12px;border-left:4px solid rgba(255,255,255,.25);opacity:.9}
.dmd ul,.dmd ol{margin:.35em 0;padding-left:1.4em}
.dmd a{color:#7aa2ff;text-decoration:underline}
.dmd .dmd-spoiler{background:#1b1f2a;color:transparent;border-radius:4px;padding:0 .2em;cursor:pointer;transition:.15s;user-select:none}
.dmd .dmd-spoiler.open{background:rgba(255,255,255,.1);color:inherit;user-select:text}`;
  let injected = false;
  function inject() {
    if (injected) return; injected = true;
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    document.addEventListener('click', e => {
      const sp = e.target.closest && e.target.closest('.dmd-spoiler');
      if (sp) sp.classList.toggle('open');
    });
  }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function inline(t, store) {
    const keep = html => '\u0000' + (store.push(html) - 1) + '\u0000';
    t = t.replace(/`([^`\n]+)`/g, (_, c) => keep('<code>' + c + '</code>'));
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, url) => keep('<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + txt + '</a>'));
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (_, p, url) => p + keep('<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + url + '</a>'));
    t = t.replace(/\|\|(.+?)\|\|/g, '<span class="dmd-spoiler">$1</span>');
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/__(.+?)__/g, '<u>$1</u>');
    t = t.replace(/\*(?!\s)([^*\n]+?)\*/g, '<em>$1</em>');
    t = t.replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1<em>$2</em>');
    t = t.replace(/~~(.+?)~~/g, '<s>$1</s>');
    t = t.replace(/\^\^(.+?)\^\^/g, (_, c) => c.toUpperCase());
    return t;
  }

  function render(src) {
    inject();
    src = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
    const store = [];
    // blocs de code
    src = src.replace(/```(?:[a-zA-Z0-9_-]+\n)?([\s\S]*?)```/g, (_, c) => '\u0000' + (store.push('<pre><code>' + esc(c.replace(/^\n|\n$/g, '')) + '</code></pre>') - 1) + '\u0000');
    const lines = esc(src).split('\n');
    const out = [];
    let i = 0, m;
    while (i < lines.length) {
      const l = lines[i];
      if (/^\u0000\d+\u0000$/.test(l.trim())) { out.push(l.trim()); i++; continue; }
      if ((m = l.match(/^(#{1,3})\s+(.+)$/))) { out.push('<h' + m[1].length + '>' + inline(m[2], store) + '</h' + m[1].length + '>'); i++; continue; }
      if ((m = l.match(/^-#\s+(.+)$/))) { out.push('<div class="dmd-sub">' + inline(m[1], store) + '</div>'); i++; continue; }
      if (/^&gt;&gt;&gt;\s?/.test(l)) {
        const rest = [l.replace(/^&gt;&gt;&gt;\s?/, ''), ...lines.slice(i + 1)];
        out.push('<blockquote>' + rest.map(x => inline(x, store)).join('<br>') + '</blockquote>'); break;
      }
      if (/^&gt;\s?/.test(l)) {
        const q = [];
        while (i < lines.length && /^&gt;\s?/.test(lines[i])) q.push(inline(lines[i++].replace(/^&gt;\s?/, ''), store));
        out.push('<blockquote>' + q.join('<br>') + '</blockquote>'); continue;
      }
      if (/^\s*[-*]\s+/.test(l)) {
        const it = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) it.push('<li>' + inline(lines[i++].replace(/^\s*[-*]\s+/, ''), store) + '</li>');
        out.push('<ul>' + it.join('') + '</ul>'); continue;
      }
      if (/^\s*\d+\.\s+/.test(l)) {
        const it = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) it.push('<li>' + inline(lines[i++].replace(/^\s*\d+\.\s+/, ''), store) + '</li>');
        out.push('<ol>' + it.join('') + '</ol>'); continue;
      }
      out.push(l.trim() === '' ? '<div class="dmd-gap"></div>' : '<div>' + inline(l, store) + '</div>');
      i++;
    }
    let html = out.join('');
    for (let k = 0; k < 3; k++) html = html.replace(/\u0000(\d+)\u0000/g, (_, n) => store[+n]);
    return '<div class="dmd">' + html + '</div>';
  }
  window.DiscordMD = { render };
})();
