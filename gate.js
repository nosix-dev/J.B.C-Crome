/* J.B.C Crome — accès réservé aux membres connectés avec Discord.
   À charger dans le <head> APRÈS supabase-js et social.js :
   <script src="gate.js" data-page="la galerie"></script>
   Pour retirer l'accès à quelqu'un : Supabase > Authentication > Users > ⋯ > Ban user. */
(function () {
  "use strict";
  var page = (document.currentScript && document.currentScript.getAttribute("data-page")) || "cette page";
  var root = document.documentElement;
  var sb = window.JBC && window.JBC.sb;

  /* Dès le départ : tout le contenu est masqué (sauf l'en-tête) tant que l'accès n'est pas confirmé */
  root.classList.add("jbc-lock");
  var st = document.createElement("style");
  st.textContent =
    "html.jbc-lock,html.jbc-lock body{overflow:hidden}" +
    "html.jbc-lock body>*:not(header):not(#preloader):not(#jbc-gate):not(script):not(style){visibility:hidden!important}" +
    "#jbc-gate{position:fixed;inset:0;z-index:40;background:#050608;display:flex;align-items:center;justify-content:center;padding:100px 20px 20px}" +
    "#jbc-gate .g-card{width:100%;max-width:440px;text-align:center;background:#0f1726;border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:34px 28px;box-shadow:0 18px 45px rgba(2,10,20,.45)}" +
    "#jbc-gate h2{font-family:'Anton',sans-serif;font-weight:400;font-size:26px;text-transform:uppercase;color:#f5f7fb;margin-bottom:12px}" +
    "#jbc-gate p{color:#8ea0b7;line-height:1.6;font-size:15px}" +
    "#jbc-gate .g-err{margin-top:16px;padding:12px 14px;border:1px dashed rgba(255,141,141,.5);border-radius:12px;color:#ff8d8d;font-size:14px}" +
    "#jbc-gate .btn{margin-top:22px;justify-content:center}";
  document.head.appendChild(st);

  var gate = null, quitting = false;
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  function show(opts) {
    ready(function () {
      if (!gate) { gate = document.createElement("div"); gate.id = "jbc-gate"; document.body.appendChild(gate); }
      gate.textContent = "";
      var card = document.createElement("div"); card.className = "g-card";
      var h = document.createElement("h2"); h.textContent = opts.title; card.appendChild(h);
      var p = document.createElement("p"); p.textContent = opts.text; card.appendChild(p);
      if (opts.error) { var e = document.createElement("div"); e.className = "g-err"; e.textContent = opts.error; card.appendChild(e); }
      if (opts.button) {
        var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-discord"; b.textContent = opts.button;
        b.onclick = opts.onClick; card.appendChild(b);
      }
      gate.appendChild(card);
    });
  }

  function unlock() {
    root.classList.remove("jbc-lock");
    ready(function () { if (gate) { gate.remove(); gate = null; } });
  }

  function login() {
    window.JBC.login().then(function (r) { if (r && r.error) show(loginView(r.error.message)); });
  }
  function loginView(err) {
    return { title: "Accès réservé aux membres", text: "Connecte-toi avec Discord pour accéder à " + page + ".", error: err, button: "Se connecter avec Discord", onClick: login };
  }

  async function check() {
    show({ title: "Vérification…", text: "Un instant." });
    var s = await sb.auth.getSession();
    if (!s.data.session) { show(loginView(authError())); return; }

    /* getUser() interroge le serveur : un compte banni est refusé même avec une ancienne session */
    var u = await sb.auth.getUser();
    if (u.error || !u.data || !u.data.user) {
      var err = u.error || {}, txt = (err.code || "") + " " + (err.message || "");
      if (/ban/i.test(txt)) {
        quitting = true; await sb.auth.signOut({ scope: "local" });
        show({ title: "Accès refusé", text: "Ton accès à " + page + " a été retiré. Contacte un administrateur si c'est une erreur." });
      } else if (err.status === 401 || err.status === 403) {
        quitting = true; await sb.auth.signOut({ scope: "local" });
        show(loginView(""));
      } else {
        show({ title: "Vérification impossible", text: "Impossible de contacter le serveur. Réessaie dans un instant.", button: "Réessayer", onClick: check });
      }
      return;
    }
    unlock();
  }

  function authError() {
    try {
      var q = new URLSearchParams(location.search.slice(1)), h = new URLSearchParams(location.hash.replace(/^#/, ""));
      var d = q.get("error_description") || h.get("error_description") || q.get("error") || h.get("error");
      if (d) { history.replaceState(null, "", location.pathname); return "Connexion refusée : " + d; }
    } catch (e) {}
    return "";
  }

  if (!sb) {
    show({ title: "Accès indisponible", text: "Le service de connexion n'a pas pu se charger. Recharge la page." });
    return;
  }
  sb.auth.onAuthStateChange(function (ev) {
    if (ev === "SIGNED_OUT" && !quitting) setTimeout(function () { location.reload(); }, 0);
  });
  check();
})();
