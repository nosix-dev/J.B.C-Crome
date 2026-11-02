/* J.B.C Crome — effets de profil (canvas) : PFX.start(carte, effet, accent) */
(function () {
  "use strict";
  /* CSS injecté automatiquement (pas besoin de profil-fx.css) */
  (function () {
    if (document.getElementById("pfx-css")) return;
    var PFX_CSS = "/* J.B.C Crome — profil : cartes, cadres d'avatar, styles de pseudo, bannières, badges, effets */\n.pf-card{position:relative;overflow:hidden}\n.pf-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5}\n\n/* Cartes */\n.pf-card.cs-glow{box-shadow:0 0 0 1px var(--pf),0 0 46px -10px var(--pf)}\n.pf-card.cs-neon{border-color:var(--pf);box-shadow:0 0 0 1px var(--pf),0 0 22px var(--pf),inset 0 0 22px rgba(255,255,255,.04)}\n.pf-card.cs-glass{background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:rgba(255,255,255,.18)}\n.pf-card.cs-glass .pf-body{background:transparent}\n.pf-card.cs-carbon .pf-body{background:repeating-linear-gradient(45deg,#10131a 0 4px,#171b24 4px 8px)}\n.pf-card.cs-aurora .pf-body{background:linear-gradient(120deg,#0f1726,#1b1040,#0c2a3a,#1d0f33,#0f1726);background-size:300% 300%;animation:pfaur 14s ease infinite}\n@keyframes pfaur{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}\n\n/* Bannières */\n.pf-banner{position:relative;overflow:hidden}\n.pf-banner.bn-dim{filter:brightness(.6)}\n.pf-banner.bn-blur>img{filter:blur(4px);transform:scale(1.08)}\n.pf-banner.bn-scanlines::after{content:\"\";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);pointer-events:none}\n.pf-banner.bn-gradient::after{content:\"\";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(11,18,32,.92));pointer-events:none}\n\n/* Cadres d'avatar (box-shadow : pas de dépendance au CSS de l'avatar) */\n.pf .pf-fr.fr-neon{box-shadow:0 0 0 3px var(--pf),0 0 16px var(--pf),0 0 38px var(--pf)}\n.pf .pf-fr.fr-chrome{box-shadow:0 0 0 3px #e6ebf2,0 0 0 6px #6b7380,0 0 14px rgba(255,255,255,.35)}\n.pf .pf-fr.fr-gold{box-shadow:0 0 0 3px #f5c542,0 0 0 5px #8a6a12,0 0 18px #f5c542}\n.pf .pf-fr.fr-ice{box-shadow:0 0 0 3px #d6f6ff,0 0 20px #7fdcff,0 0 40px rgba(127,220,255,.45)}\n.pf .pf-fr.fr-rainbow{animation:pfbow 5s linear infinite}\n.pf .pf-fr.fr-fire{animation:pffire 1.1s ease-in-out infinite}\n.pf .pf-fr.fr-glitch{animation:pfglit 1.8s steps(1) infinite}\n.pf .pf-fr.fr-pulse{animation:pfpul 1.8s ease-out infinite}\n@keyframes pfbow{\n 0%,100%{box-shadow:0 0 0 4px #ff3b3b,0 0 16px #ff3b3b}\n 17%{box-shadow:0 0 0 4px #ff9f1a,0 0 16px #ff9f1a}\n 34%{box-shadow:0 0 0 4px #ffe14a,0 0 16px #ffe14a}\n 51%{box-shadow:0 0 0 4px #3dff7a,0 0 16px #3dff7a}\n 68%{box-shadow:0 0 0 4px #3db8ff,0 0 16px #3db8ff}\n 85%{box-shadow:0 0 0 4px #b05cff,0 0 16px #b05cff}}\n@keyframes pffire{\n 0%,100%{box-shadow:0 0 0 3px #ff6a00,0 0 14px #ff3d00,0 0 30px #ff9500}\n 50%{box-shadow:0 0 0 4px #ffb300,0 0 22px #ff6a00,0 0 44px #ff3d00}}\n@keyframes pfglit{\n 0%,100%{box-shadow:-3px 0 0 2px #0ff,3px 0 0 2px #f0f}\n 25%{box-shadow:3px 0 0 2px #0ff,-3px 0 0 2px #f0f}\n 50%{box-shadow:-2px 2px 0 2px #0ff,2px -2px 0 2px #f0f}\n 75%{box-shadow:0 0 0 2px #0ff,0 0 0 4px #f0f}}\n@keyframes pfpul{\n 0%{box-shadow:0 0 0 3px var(--pf),0 0 0 3px var(--pf)}\n 100%{box-shadow:0 0 0 3px var(--pf),0 0 0 22px transparent}}\n\n/* Styles de pseudo */\n.pf-name.ns-gradient,.pf-name.ns-chrome,.pf-name.ns-gold,.pf-name.ns-rainbow{background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:pfshift 6s linear infinite}\n.pf-name.ns-gradient{background-image:linear-gradient(90deg,var(--pf),#fff,#e84fa0,var(--pf))}\n.pf-name.ns-chrome{background-image:linear-gradient(90deg,#8d96a5,#fff,#9aa3b2,#e8edf5,#8d96a5)}\n.pf-name.ns-gold{background-image:linear-gradient(90deg,#b8860b,#ffe27a,#f5c542,#fff3b0,#b8860b)}\n.pf-name.ns-rainbow{background-image:linear-gradient(90deg,#ff3b3b,#ffe14a,#3dff7a,#3db8ff,#b05cff,#ff3b3b)}\n.pf-name.ns-neon{color:#fff;text-shadow:0 0 6px var(--pf),0 0 16px var(--pf),0 0 34px var(--pf)}\n.pf-name.ns-glitch{color:#fff;animation:pfgl 2.4s steps(1) infinite}\n.pf-name.ns-fire{background-image:linear-gradient(0deg,#ff3d00,#ffb300,#fff2a8);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:pfflick 1.2s ease-in-out infinite}\n@keyframes pfshift{to{background-position:300% 0}}\n@keyframes pfgl{0%,100%{text-shadow:2px 0 #0ff,-2px 0 #f0f}25%{text-shadow:-2px 0 #0ff,2px 0 #f0f}50%{text-shadow:1px 2px #0ff,-1px -2px #f0f}75%{text-shadow:none}}\n@keyframes pfflick{0%,100%{filter:drop-shadow(0 0 6px #ff6a00)}50%{filter:drop-shadow(0 0 14px #ff3d00)}}\n\n/* Badges + tags */\n.pf-badges{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}\n.pf-badge{padding:3px 10px;border-radius:999px;font-size:.78rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}\na.pf-tag{text-decoration:none;color:inherit}\na.pf-tag:hover{border-color:var(--pf)}\n\n/* Éditeur */\n.pf-edit textarea{width:100%;min-height:160px;resize:vertical}\n.pf-tb{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}\n\n@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}\n";
    var st = document.createElement("style"); st.id = "pfx-css"; st.textContent = PFX_CSS; document.head.appendChild(st);
  })();
  var R = Math.random, TAU = Math.PI * 2, M = Math;
  function rnd(a, b) { return a + R() * (b - a); }
  var CONF = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ffffff"];
  var CH = "01アイウエオカキクケコサシスセソ0123456789";
  function rc() { return CH.charAt((R() * CH.length) | 0); }

  var E = {
    snow: { n: 55,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : -5; p.r = rnd(1, 3); p.vy = rnd(.4, 1.2); p.ph = R() * TAU; },
      step: function (p, w, h) { p.y += p.vy; p.ph += .02; p.x += M.sin(p.ph) * .4; return p.y > h + 5; },
      draw: function (c, p) { c.globalAlpha = .85; c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } },

    sparkle: { n: 22,
      init: function (p, w, h, f) { p.x = R() * w; p.y = R() * h; p.s = rnd(3, 8); p.sp = rnd(.02, .05); p.ph = f ? R() * TAU : 0; },
      step: function (p) { p.ph += p.sp; return p.ph > TAU; },
      draw: function (c, p) {
        var s = p.s, x = p.x, y = p.y, k = s * .25; c.globalAlpha = M.sin(p.ph / 2); c.fillStyle = "#fff3b0";
        c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + k, y - k); c.lineTo(x + s, y); c.lineTo(x + k, y + k);
        c.lineTo(x, y + s); c.lineTo(x - k, y + k); c.lineTo(x - s, y); c.lineTo(x - k, y - k); c.closePath(); c.fill(); } },

    embers: { n: 40,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : h + 5; p.vy = rnd(.5, 1.5); p.r = rnd(1, 2.6); p.ph = R() * TAU; },
      step: function (p) { p.y -= p.vy; p.ph += .05; p.x += M.sin(p.ph) * .5; return p.y < -5; },
      draw: function (c, p, w, h) { c.globalAlpha = M.min(1, (p.y / h) * 1.5 + .1); c.fillStyle = "#ff8a3d"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } },

    rain: { n: 70,
      init: function (p, w, h, f) { p.x = R() * w * 1.2; p.y = f ? R() * h : -20; p.l = rnd(8, 16); p.vy = rnd(9, 14); },
      step: function (p, w, h) { p.y += p.vy; p.x -= p.vy * .15; return p.y > h; },
      draw: function (c, p) { c.strokeStyle = "rgba(170,200,255,.55)"; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.l * .15, p.y - p.l); c.stroke(); } },

    confetti: { n: 45,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : -10; p.a = rnd(4, 8); p.b = rnd(3, 5); p.rot = R() * TAU; p.vr = rnd(-.15, .15); p.vy = rnd(1, 2.5); p.ph = R() * TAU; p.col = CONF[(R() * CONF.length) | 0]; },
      step: function (p, w, h) { p.y += p.vy; p.rot += p.vr; p.ph += .05; p.x += M.sin(p.ph) * .6; return p.y > h + 10; },
      draw: function (c, p) { c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.a / 2, -p.b / 2, p.a, p.b); } },

    fireflies: { n: 18,
      init: function (p, w, h) { p.x = R() * w; p.y = R() * h; p.ang = R() * TAU; p.ph = R() * TAU; },
      step: function (p, w, h) { p.ang += rnd(-.12, .12); p.x += M.cos(p.ang) * .4; p.y += M.sin(p.ang) * .4; p.ph += .04;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0; return false; },
      draw: function (c, p) { var a = .35 + .65 * M.abs(M.sin(p.ph)), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
        g.addColorStop(0, "rgba(255,240,120," + a + ")"); g.addColorStop(1, "rgba(255,240,120,0)"); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, 9, 0, TAU); c.fill(); } },

    stars: { n: 45,
      init: function (p, w, h) { p.x = R() * w; p.y = R() * h; p.r = rnd(.4, 1.7); p.ph = R() * TAU; p.sp = rnd(.02, .07); },
      step: function (p) { p.ph += p.sp; return false; },
      draw: function (c, p) { c.globalAlpha = .35 + .65 * M.abs(M.sin(p.ph)); c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } },

    hearts: { n: 18,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : h + 10; p.s = rnd(9, 17); p.vy = rnd(.5, 1.2); p.ph = R() * TAU; },
      step: function (p) { p.y -= p.vy; p.ph += .04; p.x += M.sin(p.ph) * .5; return p.y < -20; },
      draw: function (c, p, w, h) { c.globalAlpha = M.min(1, p.y / h + .3); c.fillStyle = "#ff5d9e"; c.font = p.s + "px serif"; c.fillText("♥", p.x, p.y); } },

    bubbles: { n: 24,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : h + 12; p.r = rnd(3, 10); p.vy = rnd(.4, 1.1); p.ph = R() * TAU; },
      step: function (p) { p.y -= p.vy; p.ph += .03; p.x += M.sin(p.ph) * .3; return p.y < -p.r; },
      draw: function (c, p) { c.strokeStyle = "rgba(180,230,255,.6)"; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke();
        c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .2, 0, TAU); c.fill(); } },

    matrix: { n: 26,
      init: function (p, w, h, f) { p.x = ((R() * w) / 12 | 0) * 12; p.y = f ? R() * h : -70; p.sp = rnd(1.5, 3.5); p.ch = []; for (var i = 0; i < 6; i++) p.ch.push(rc()); },
      step: function (p, w, h) { p.y += p.sp; if (R() < .1) p.ch[(R() * 6) | 0] = rc(); return p.y > h + 80; },
      draw: function (c, p) { c.font = "12px monospace"; c.fillStyle = "#3dff7a";
        for (var i = 0; i < 6; i++) { c.globalAlpha = .15 + i * .14; c.fillText(p.ch[i], p.x, p.y - (5 - i) * 12); } } },

    lightning: { n: 1,
      init: function (p) { p.t = rnd(60, 200); p.f = 0; p.bolt = null; },
      step: function (p, w, h) {
        if (p.f > 0) { if (--p.f === 0) p.bolt = null; }
        else if (--p.t <= 0) { var x = rnd(w * .2, w * .8), y = 0, pts = [[x, 0]]; while (y < h * .75) { y += rnd(10, 25); x += rnd(-18, 18); pts.push([x, y]); }
          p.bolt = pts; p.f = 10; p.t = rnd(120, 300); }
        return false; },
      draw: function (c, p, w, h) { if (!p.bolt) return; var a = p.f / 10;
        c.fillStyle = "rgba(200,210,255," + (a * .12) + ")"; c.fillRect(0, 0, w, h);
        c.globalAlpha = a; c.strokeStyle = "#dfe8ff"; c.lineWidth = 2; c.shadowColor = "#8fb0ff"; c.shadowBlur = 12; c.beginPath();
        p.bolt.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); } },

    petals: { n: 24,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : -10; p.s = rnd(4, 8); p.vy = rnd(.5, 1.2); p.ph = R() * TAU; p.rot = R() * TAU; p.vr = rnd(-.05, .05); },
      step: function (p, w, h) { p.y += p.vy; p.ph += .03; p.x += M.sin(p.ph) * .8 + .2; p.rot += p.vr; return p.y > h + 10 || p.x > w + 10; },
      draw: function (c, p) { c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = "#ffb7d5"; c.beginPath(); c.ellipse(0, 0, p.s, p.s * .55, 0, 0, TAU); c.fill(); } },

    smoke: { n: 14,
      init: function (p, w, h, f) { p.x = R() * w; p.y = f ? R() * h : h + 20; p.r = rnd(14, 30); p.vy = rnd(.2, .6); p.ph = R() * TAU; },
      step: function (p) { p.y -= p.vy; p.r += .1; p.ph += .02; p.x += M.sin(p.ph) * .3; return p.y < -p.r; },
      draw: function (c, p) { var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(200,200,215,.16)"); g.addColorStop(1, "rgba(200,200,215,0)"); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } }
  };

  function start(card, name, accent) {
    var spec = E[name];
    if (!spec || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var cv = document.createElement("canvas"); cv.className = "pf-fx"; card.appendChild(cv);
    var c = cv.getContext("2d"), ps = [], W = 0, H = 0, seen = 0, miss = 0;
    function size() { var d = M.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); }
    function frame() {
      if (!cv.isConnected) { if (seen || ++miss > 120) return; requestAnimationFrame(frame); return; }
      seen = 1;
      if (document.hidden) { requestAnimationFrame(frame); return; }
      if (cv.clientWidth !== W || cv.clientHeight !== H) size();
      if (W > 0) {
        if (!ps.length) for (var i = 0; i < spec.n; i++) { var q = {}; spec.init(q, W, H, true); ps.push(q); }
        c.clearRect(0, 0, W, H);
        for (var j = 0; j < ps.length; j++) {
          var p = ps[j]; if (spec.step(p, W, H)) spec.init(p, W, H, false);
          c.save(); c.globalAlpha = 1; spec.draw(c, p, W, H, accent); c.restore();
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  window.PFX = { start: start, list: Object.keys(E) };
})();
