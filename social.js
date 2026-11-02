/* J.B.C Crome — socle commun du fil d'actualité et des profils
   (client Supabase, profils, réactions emoji, publications).
   À charger après supabase-js sur fil.html et profil.html. */
(function () {
  "use strict";

  /* ===== Supabase (Project Settings > API) ===== */
  var SUPABASE_URL = "https://aqckkzgbdmtxgieqfurl.supabase.co";
  var SUPABASE_KEY = "sb_publishable_0XuAuJvOtEZuV13jtm1H0A_mR-2BJX3"; /* clé "anon public" */

  /* Réactions disponibles — doit rester identique à la liste de fil-profils-setup.sql */
  var EMOJIS = ["❤️","👍","😂","😮","😢","🔥","👏","🎉","🚛","🛣️","⛽","🏁","😎","🤩","💯","🙌","👀","🤝","💪","😍","😭","🥳","🤔","😅"];

  var HEX = /^#[0-9a-f]{6}$/i;
  var J = (window.JBC = { url: SUPABASE_URL, emojis: EMOJIS, sb: null, me: null, profile: null, profilesError: null });
  if (window.supabase && SUPABASE_URL && SUPABASE_KEY) J.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ---------- Utilitaires ---------- */
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  J.el = el;

  J.ago = function (d) {
    var s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return "à l'instant";
    var m = Math.floor(s / 60); if (m < 60) return "il y a " + m + " min";
    var h = Math.floor(m / 60); if (h < 24) return "il y a " + h + " h";
    return "il y a " + Math.floor(h / 24) + " j";
  };

  /* Seules les images Discord, Supabase (ou un aperçu local) sont affichées */
  J.okImg = function (u) {
    return typeof u === "string" && u.length < 500 && !/[\s"'()<>\\]/.test(u) &&
      (u.indexOf("https://cdn.discordapp.com/") === 0 || u.indexOf(SUPABASE_URL + "/storage/") === 0 || u.indexOf("blob:") === 0);
  };
  J.okColor = function (c, d) { return HEX.test(c || "") ? c : d; };
  J.profileUrl = function (id) { return "profil.html?id=" + encodeURIComponent(id); };

  /* Infos Discord du compte connecté */
  J.meta = function (u) {
    var m = (u && u.user_metadata) || {};
    var n = String((m.custom_claims && m.custom_claims.global_name) || m.full_name || m.name || "").trim().slice(0, 32);
    if (n.length < 2) n = "Chauffeur";
    return { name: n, avatar: J.okImg(m.avatar_url) ? m.avatar_url : "" };
  };

  /* Avatar : image si dispo, sinon initiale. p = {display_name, avatar_url, accent} */
  J.avatar = function (p, size) {
    var u = p && p.avatar_url, c, cls = "av" + (size ? " " + size : "");
    if (J.okImg(u)) {
      c = el("img", cls); c.alt = ""; c.referrerPolicy = "no-referrer"; c.src = u;
      if (u.indexOf("blob:") !== 0) c.loading = "lazy";
    } else {
      c = el("div", cls, Array.from(String((p && p.display_name) || "?").trim())[0] || "?");
    }
    c.style.setProperty("--pf", J.okColor(p && p.accent, "#274d7c"));
    return c;
  };

  /* ---------- Session & profil ---------- */
  var cache = {};

  J.login = function () {
    return J.sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: location.origin + location.pathname, scopes: "identify email" } });
  };
  J.logout = function () { return J.sb.auth.signOut(); };

  J.setProfile = function (p) { if (p) { cache[p.user_id] = p; if (J.me && J.me.id === p.user_id) J.profile = p; } };

  /* Récupère (ou crée) le profil du membre connecté */
  J.ensureProfile = async function () {
    J.profilesError = null;
    if (!J.me) { J.profile = null; return null; }
    var m = J.meta(J.me);
    var r = await J.sb.from("profiles").select("*").eq("user_id", J.me.id).maybeSingle();
    var p = r.data;
    if (r.error) J.profilesError = r.error;
    if (!p && !r.error) {
      var ins = await J.sb.from("profiles").insert({ user_id: J.me.id, display_name: m.name, avatar_url: m.avatar || null }).select().maybeSingle();
      p = ins.data;
      if (!p) { var again = await J.sb.from("profiles").select("*").eq("user_id", J.me.id).maybeSingle(); p = again.data; }
    }
    if (p) cache[p.user_id] = p;
    /* Repli si la table n'existe pas encore : le fil continue de marcher avec les infos Discord */
    J.profile = p || { user_id: J.me.id, display_name: m.name, avatar_url: m.avatar || null, accent: "#5da8ff", banner_color: "#142338", bio: "", game: "ets2", truck: "", status_text: "", status_emoji: null, banner_url: null };
    return J.profile;
  };

  /* Démarre la session ; onChange() est rappelé à chaque connexion / déconnexion */
  J.start = async function (onChange) {
    if (!J.sb) return;
    var s = await J.sb.auth.getSession();
    J.me = s.data.session ? s.data.session.user : null;
    await J.ensureProfile();
    J.sb.auth.onAuthStateChange(function (ev, ss) {
      var u = ss ? ss.user : null;
      if ((u && u.id) !== (J.me && J.me.id)) {
        J.me = u;
        /* setTimeout : on n'appelle pas Supabase directement dans ce callback */
        setTimeout(function () { J.ensureProfile().then(function () { if (onChange) onChange(); }); }, 0);
      }
    });
  };

  J.fetchProfiles = async function (ids) {
    var need = Array.from(new Set(ids.filter(function (i) { return i && !cache[i]; })));
    if (need.length) {
      var r = await J.sb.from("profiles").select("*").in("user_id", need);
      if (!r.error) (r.data || []).forEach(function (p) { cache[p.user_id] = p; });
    }
    var out = {};
    ids.forEach(function (i) { if (cache[i]) out[i] = cache[i]; });
    return out;
  };

  /* ---------- Images de profil (recadrées et compressées dans le navigateur) ---------- */
  J.crop = function (file, w, h) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(url);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        var g = c.getContext("2d");
        g.fillStyle = "#0f1726"; g.fillRect(0, 0, w, h);
        g.imageSmoothingQuality = "high";
        var s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s;
        g.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
        c.toBlob(function (b) { b ? res(b) : rej(new Error("Image illisible")); }, "image/jpeg", 0.88);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Image illisible")); };
      im.src = url;
    });
  };

  var PUB = SUPABASE_URL + "/storage/v1/object/public/profiles/";
  J.upload = async function (blob, kind) {
    var path = J.me.id + "/" + kind + "-" + Date.now() + ".jpg";
    var u = await J.sb.storage.from("profiles").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (u.error) throw u.error;
    return J.sb.storage.from("profiles").getPublicUrl(path).data.publicUrl;
  };
  J.removeFile = function (url) {
    if (!J.me || typeof url !== "string" || url.indexOf(PUB + J.me.id + "/") !== 0) return Promise.resolve();
    return J.sb.storage.from("profiles").remove([decodeURIComponent(url.slice(PUB.length))]).catch(function () {});
  };

  /* ---------- Réactions emoji ---------- */
  function closePops() { Array.prototype.forEach.call(document.querySelectorAll(".rx-pop"), function (p) { p.remove(); }); }
  document.addEventListener("click", function (e) { if (!e.target.closest || !e.target.closest(".rx-pop")) closePops(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePops(); });
  J.popOpen = function () { return !!document.querySelector(".rx-pop"); };

  /* counts = {emoji: nombre}, mine = {emoji: 1} (modifiés sur place pour une réponse immédiate) */
  J.reactions = function (postId, counts, mine) {
    var box = el("div", "rx"), busy = false;

    function draw() {
      box.textContent = "";
      EMOJIS.filter(function (e) { return counts[e] > 0; })
        .sort(function (a, b) { return counts[b] - counts[a]; })
        .forEach(function (e) {
          var b = el("button", "rx-chip" + (mine[e] ? " on" : "")); b.type = "button";
          b.title = mine[e] ? "Retirer ma réaction" : "Réagir avec " + e;
          b.appendChild(el("span", "e", e)); b.appendChild(el("span", "n", String(counts[e])));
          b.onclick = function () { toggle(e); };
          box.appendChild(b);
        });
      var add = el("button", "rx-add", "😊 +"); add.type = "button"; add.title = "Ajouter une réaction";
      add.setAttribute("aria-haspopup", "true");
      add.onclick = function (ev) {
        ev.stopPropagation();
        if (!J.me) { alert("Connecte-toi avec Discord pour réagir."); return; }
        var open = box.querySelector(".rx-pop");
        closePops();
        if (open) return;
        var pop = el("div", "rx-pop");
        EMOJIS.forEach(function (e) {
          var k = el("button", "rx-pick" + (mine[e] ? " on" : ""), e); k.type = "button"; k.title = e;
          k.onclick = function () { closePops(); toggle(e); };
          pop.appendChild(k);
        });
        box.appendChild(pop);
      };
      box.appendChild(add);
    }

    async function toggle(e) {
      if (!J.me) { alert("Connecte-toi avec Discord pour réagir."); return; }
      if (busy) return;
      busy = true;
      var on = !!mine[e];
      function flip(wasOn) {
        if (wasOn) { delete mine[e]; counts[e] = Math.max(0, (counts[e] || 1) - 1); }
        else { mine[e] = 1; counts[e] = (counts[e] || 0) + 1; }
      }
      flip(on); draw();
      var x = on
        ? await J.sb.from("reactions").delete().eq("post_id", postId).eq("user_id", J.me.id).eq("emoji", e)
        : await J.sb.from("reactions").insert({ post_id: postId, emoji: e });
      if (x.error) { flip(!on); draw(); alert("Erreur : " + x.error.message); }
      busy = false;
    }

    draw();
    return box;
  };

  /* ---------- Publications ---------- */
  J.card = function (p, prof, counts, mine, reload) {
    var c = el("div", "post"), h = el("div", "ph");
    var who = {
      display_name: (prof && prof.display_name) || p.author_name,
      avatar_url: (prof && prof.avatar_url) || p.author_avatar,
      accent: prof && prof.accent
    };
    var al = el("a", "pl"); al.href = J.profileUrl(p.user_id); al.title = "Voir le profil"; al.appendChild(J.avatar(who));
    h.appendChild(al);
    var n = el("div"), b = el("b"), nl = el("a", "pname", who.display_name); nl.href = J.profileUrl(p.user_id);
    b.appendChild(nl); n.appendChild(b); n.appendChild(el("span", "mut", J.ago(p.created_at)));
    h.appendChild(n);
    if (J.me && J.me.id === p.user_id) {
      var d = el("button", "del", "Supprimer");
      d.onclick = async function () {
        if (!confirm("Supprimer cette publication ?")) return;
        var x = await J.sb.from("posts").delete().eq("id", p.id);
        if (x.error) alert("Erreur : " + x.error.message); else reload();
      };
      h.appendChild(d);
    }
    c.appendChild(h);
    if (p.body) c.appendChild(el("p", "body", p.body));
    var im = (p.images || []).filter(function (u) { return typeof u === "string" && u.indexOf(SUPABASE_URL + "/storage/") === 0; });
    if (im.length) {
      var g = el("div", "imgs n" + im.length);
      im.forEach(function (u) {
        var i = el("img"); i.src = u; i.loading = "lazy"; i.alt = "";
        i.onclick = function () { window.open(u, "_blank", "noopener"); };
        g.appendChild(i);
      });
      c.appendChild(g);
    }
    c.appendChild(J.reactions(p.id, counts, mine));
    return c;
  };

  /* Charge et affiche les publications dans `box`.
     opts : { userId, limit, empty, reload } */
  J.renderPosts = async function (box, opts) {
    opts = opts || {};
    var q = J.sb.from("posts").select("*").order("created_at", { ascending: false }).limit(opts.limit || 50);
    if (opts.userId) q = q.eq("user_id", opts.userId);
    var r = await q;
    if (r.error) { box.textContent = "Erreur : " + r.error.message; return 0; }
    var posts = r.data || [], ids = posts.map(function (p) { return p.id; });
    var profs = await J.fetchProfiles(posts.map(function (p) { return p.user_id; }));

    var counts = {}, mine = {}, rxErr = null;
    if (ids.length) {
      var a = await J.sb.from("reaction_counts").select("post_id,emoji,n").in("post_id", ids).limit(1000);
      if (a.error) rxErr = a.error;
      (a.data || []).forEach(function (x) { (counts[x.post_id] = counts[x.post_id] || {})[x.emoji] = x.n; });
      if (J.me && !rxErr) {
        var m = await J.sb.from("reactions").select("post_id,emoji").eq("user_id", J.me.id).in("post_id", ids).limit(1000);
        (m.data || []).forEach(function (x) { (mine[x.post_id] = mine[x.post_id] || {})[x.emoji] = 1; });
      }
    }

    /* Rien n'a changé depuis le dernier affichage : on ne touche pas au DOM (pas de saut de page) */
    var sig = JSON.stringify([posts.map(function (p) { return p.id; }), counts, mine, Object.keys(profs).map(function (k) { return k + profs[k].updated_at; }), J.me && J.me.id, !!rxErr]);
    if (box._sig === sig) return posts.length;
    box._sig = sig;

    var frag = document.createDocumentFragment();
    if (rxErr) frag.appendChild(el("div", "note", "Réactions non activées : exécute fil-profils-setup.sql dans Supabase (SQL Editor)."));
    if (!posts.length) frag.appendChild(el("div", "note", opts.empty || "Aucune publication pour le moment."));
    posts.forEach(function (p) {
      frag.appendChild(J.card(p, profs[p.user_id], counts[p.id] || {}, mine[p.id] || {}, opts.reload || function () { J.renderPosts(box, opts); }));
    });
    box.textContent = "";
    box.appendChild(frag);
    return posts.length;
  };
})();
