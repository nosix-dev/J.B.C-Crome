/* J.B.C Crome — page profil : affichage + éditeur avec aperçu en direct */
(function () {
  "use strict";
  var el = JBC.el, root = document.getElementById("pf");
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var GAMES = { ets2: "ETS2", ats: "ATS", both: "ETS2 + ATS" };
  var ACCENTS = ["#5da8ff", "#4cc9f0", "#7c5cff", "#e84fa0", "#ff6b57", "#f39c12", "#2ecc71", "#e7ecf5"];
  var BANNERS = ["#142338", "#1b2a4a", "#2d1b4e", "#4a1b2d", "#4a2e1b", "#1b4a3a", "#3a3a3a", "#0f1726"];
  var STATUS = ["", "🚛", "🛣️", "🎮", "🎧", "☕", "😴", "🔥", "⛽", "🅿️", "🏁"];

  /* Doivent rester identiques aux contraintes SQL (profils-setup-complet.sql) */
  var BIO_MAX = 2000, BADGE_MAX = 5;
  var EFFECTS = { none: "Aucun", snow: "❄️ Neige", sparkle: "✨ Étincelles", embers: "🔥 Braises", rain: "🌧️ Pluie", confetti: "🎉 Confettis", fireflies: "🟡 Lucioles", stars: "⭐ Étoiles", hearts: "💖 Cœurs", bubbles: "🫧 Bulles", matrix: "💚 Matrix", lightning: "⚡ Éclairs", petals: "🌸 Pétales", smoke: "💨 Fumée" };
  var FRAMES = { none: "Aucun", neon: "Néon", rainbow: "Arc-en-ciel", chrome: "Chrome", fire: "Feu", gold: "Or", glitch: "Glitch", pulse: "Pulsation", ice: "Glace" };
  var NAMES = { plain: "Normal", gradient: "Dégradé", neon: "Néon", chrome: "Chrome", gold: "Or", glitch: "Glitch", rainbow: "Arc-en-ciel", fire: "Feu" };
  var CARDS = { classic: "Classique", glow: "Lueur", aurora: "Aurore", glass: "Verre", neon: "Néon", carbon: "Carbone" };
  var BANNER_FX = { none: "Normal", dim: "Assombrie", blur: "Floue", scanlines: "Scanlines", gradient: "Fondu" };
  var BADGES = {
    convoyeur: { e: "🚛", l: "Convoyeur" }, nocturne: { e: "🌙", l: "Nocturne" }, matinal: { e: "🌅", l: "Matinal" },
    rapide: { e: "⚡", l: "Rapide" }, photographe: { e: "📸", l: "Photographe" }, mecano: { e: "🔧", l: "Mécano" },
    voyageur: { e: "🧭", l: "Voyageur" }, champion: { e: "🏆", l: "Champion" }, cafe: { e: "☕", l: "Accro au café" },
    dev: { e: "💻", l: "Développeur" }, fondateur: { e: "👑", l: "Fondateur" }, legende: { e: "🌟", l: "Légende" }
  };

  var LINKS = [
    { k: "haulmp_url", e: "🚚", l: "HaulMP" },
    { k: "trucksbook_url", e: "📘", l: "TrucksBook" },
    { k: "milevox_url", e: "🛣️", l: "Milevox" }
  ];
  function okUrl(u) { return typeof u === "string" && /^https:\/\/[^\s<>"']{4,200}$/.test(u); }
  function normUrl(v) {
    v = String(v || "").trim(); if (!v) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    return v.replace(/^http:\/\//i, "https://");
  }

  var P = null,        /* profil enregistré */
      D = null,        /* brouillon en cours d'édition */
      own = false, viewId = null,
      headEl = null, editEl = null, plist = null, countEl = null;

  function pick(map, v, d) { return Object.prototype.hasOwnProperty.call(map, v) ? v : d; }

  /* ---------- Affichage ---------- */
  function view(d) {
    return {
      display_name: d.display_name, bio: d.bio, accent: d.accent, banner_color: d.banner_color,
      status_emoji: d.status_emoji, status_text: d.status_text, truck: d.truck, game: d.game, created_at: d.created_at,
      effect: d.effect, frame: d.frame, name_style: d.name_style, card_style: d.card_style, banner_style: d.banner_style,
      badges: d.badges, location: d.location, truckersmp_id: d.truckersmp_id,
      haulmp_url: d.haulmp_url, trucksbook_url: d.trucksbook_url, milevox_url: d.milevox_url,
      avatar_url: d.avatarBlob ? d.avatarPrev : d.avatar_url,
      banner_url: d.bannerBlob ? d.bannerPrev : d.banner_url
    };
  }

  function buildHead(v) {
    var accent = JBC.okColor(v.accent, "#5da8ff"), bc = JBC.okColor(v.banner_color, "#142338");
    var card = el("div", "pf-card cs-" + pick(CARDS, v.card_style, "classic"));
    card.style.setProperty("--pf", accent);
    card.dataset.fx = pick(EFFECTS, v.effect, "none");

    var ban = el("div", "pf-banner bn-" + pick(BANNER_FX, v.banner_style, "none"));
    if (JBC.okImg(v.banner_url)) { var bi = el("img"); bi.alt = ""; bi.referrerPolicy = "no-referrer"; bi.src = v.banner_url; ban.appendChild(bi); }
    else ban.style.background = "linear-gradient(120deg," + bc + " 0%," + bc + " 45%," + accent + "88 100%)";
    card.appendChild(ban);

    var body = el("div", "pf-body"), top = el("div", "pf-top");
    var av = JBC.avatar({ display_name: v.display_name, avatar_url: v.avatar_url, accent: accent }, "xl");
    var fr = pick(FRAMES, v.frame, "none");
    if (fr !== "none") { av.classList.add("pf-fr"); av.classList.add("fr-" + fr); }
    top.appendChild(av);
    if (own && !D) {
      var eb = el("button", "pill", "✏️ Personnaliser mon profil"); eb.type = "button"; eb.onclick = openEdit;
      top.appendChild(eb);
    }
    body.appendChild(top);
    body.appendChild(el("h1", "pf-name ns-" + pick(NAMES, v.name_style, "plain"), v.display_name));

    var st = ((v.status_emoji ? v.status_emoji + " " : "") + (v.status_text || "")).trim();
    if (st) body.appendChild(el("div", "pf-status", st));

    var tags = el("div", "pf-tags");
    tags.appendChild(el("span", "pf-tag", GAMES[v.game] || "ETS2"));
    if (v.truck) tags.appendChild(el("span", "pf-tag", "🚛 " + v.truck));
    if (v.location) tags.appendChild(el("span", "pf-tag", "📍 " + v.location));
    if (v.truckersmp_id && /^[0-9]{1,10}$/.test(v.truckersmp_id)) {
      var tl = el("a", "pf-tag", "🌍 TruckersMP #" + v.truckersmp_id);
      tl.href = "https://truckersmp.com/user/" + v.truckersmp_id; tl.target = "_blank"; tl.rel = "noopener noreferrer";
      tags.appendChild(tl);
    }
    LINKS.forEach(function (L) {
      if (!okUrl(v[L.k])) return;
      var a = el("a", "pf-tag", L.e + " " + L.l);
      a.href = v[L.k]; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
      tags.appendChild(a);
    });
    if (v.created_at) tags.appendChild(el("span", "pf-tag", "Membre depuis " + new Date(v.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })));
    body.appendChild(tags);

    var bd = (v.badges || []).filter(function (k) { return BADGES[k]; }).slice(0, BADGE_MAX);
    if (bd.length) {
      var bw = el("div", "pf-badges");
      bd.forEach(function (k) { bw.appendChild(el("span", "pf-badge", BADGES[k].e + " " + BADGES[k].l)); });
      body.appendChild(bw);
    }

    if (v.bio) {
      var bio = el("div", "pf-bio");
      if (window.DiscordMD) bio.innerHTML = DiscordMD.render(v.bio); else bio.textContent = v.bio;
      body.appendChild(bio);
    }
    card.appendChild(body);
    return card;
  }

  /* Effet : réutilise le canvas existant si l'effet n'a pas changé (pas de redémarrage à chaque frappe) */
  function fx(card, old) {
    var n = card.dataset.fx;
    if (!n || n === "none" || !window.PFX) return;
    var cv = old && old.dataset.fx === n ? old.querySelector(".pf-fx") : null;
    if (cv) card.appendChild(cv); else PFX.start(card, n, card.style.getPropertyValue("--pf"));
  }
  function swap(v) { var n = buildHead(v); fx(n, headEl); headEl.replaceWith(n); headEl = n; }
  function refresh() { swap(view(D)); }
  function redrawHead() { swap(view(P)); }

  /* ---------- Éditeur ---------- */
  function field(label, node, hint) {
    var f = el("div", "fld"); f.appendChild(el("label", null, label)); f.appendChild(node);
    if (hint) f.appendChild(el("div", "hint", hint));
    return f;
  }
  function btn(txt, fn, cls) { var b = el("button", cls || "pill", txt); b.type = "button"; b.onclick = fn; return b; }
  function filePick(onFile) {
    var i = el("input"); i.type = "file"; i.accept = "image/*"; i.hidden = true;
    i.onchange = function () { var f = i.files[0]; i.value = ""; if (f) onFile(f); };
    return i;
  }
  function choices(list, key, label, cls) {
    var w = el("div", "btns");
    function sync() { [].forEach.call(w.children, function (b) { b.classList.toggle("on", (D[key] || "") === b.dataset.v); }); }
    list.forEach(function (v) {
      var b = btn(label(v), function () { D[key] = v; sync(); refresh(); }, cls); b.dataset.v = v; w.appendChild(b);
    });
    sync(); return w;
  }
  function mapChoices(map, key) { return choices(Object.keys(map), key, function (v) { return map[v]; }, "pill sm"); }
  function swatches(list, key) {
    var w = el("div", "sw"), ci = el("input"); ci.type = "color";
    function sync() { [].forEach.call(w.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.c === String(D[key]).toLowerCase()); }); ci.value = D[key]; }
    list.forEach(function (c) {
      var b = el("button"); b.type = "button"; b.style.background = c; b.dataset.c = c; b.title = c;
      b.onclick = function () { D[key] = c; sync(); refresh(); }; w.appendChild(b);
    });
    ci.oninput = function () { D[key] = ci.value; sync(); refresh(); };
    w.appendChild(ci); sync(); return w;
  }
  function textInput(key, max) {
    var i = el("input"); i.type = "text"; i.maxLength = max; i.value = D[key] || "";
    i.oninput = function () { D[key] = i.value; refresh(); };
    return i;
  }
  function idInput() {
    var i = el("input"); i.type = "text"; i.inputMode = "numeric"; i.maxLength = 10; i.placeholder = "ex. 1234567"; i.value = D.truckersmp_id || "";
    i.oninput = function () { i.value = i.value.replace(/\D/g, "").slice(0, 10); D.truckersmp_id = i.value; refresh(); };
    return i;
  }
  function urlInput(key) {
    var i = el("input"); i.type = "url"; i.maxLength = 200; i.placeholder = "https://…"; i.value = D[key] || "";
    i.oninput = function () { D[key] = i.value; refresh(); };
    return i;
  }
  function badgePicker() {
    var w = el("div", "btns");
    function sync() { [].forEach.call(w.children, function (b) { b.classList.toggle("on", D.badges.indexOf(b.dataset.v) > -1); }); }
    Object.keys(BADGES).forEach(function (k) {
      var b = btn(BADGES[k].e + " " + BADGES[k].l, function () {
        var i = D.badges.indexOf(k);
        if (i > -1) D.badges.splice(i, 1); else if (D.badges.length < BADGE_MAX) D.badges.push(k); else return;
        sync(); refresh();
      }, "pill sm");
      b.dataset.v = k; w.appendChild(b);
    });
    sync(); return w;
  }
  function dropPreview(k) { if (D[k + "Prev"]) URL.revokeObjectURL(D[k + "Prev"]); D[k + "Prev"] = null; D[k + "Blob"] = null; }

  /* Barre de mise en forme de la bio */
  function fire(ta) { ta.dispatchEvent(new Event("input")); }
  function wrapSel(ta, pre, suf) {
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e) || "texte";
    var nv = v.slice(0, s) + pre + sel + suf + v.slice(e);
    if (nv.length > BIO_MAX) return;
    ta.value = nv; ta.focus(); ta.setSelectionRange(s + pre.length, s + pre.length + sel.length); fire(ta);
  }
  function prefixLine(ta, pre) {
    var s = ta.selectionStart, v = ta.value, ls = v.lastIndexOf("\n", s - 1) + 1;
    var nv = v.slice(0, ls) + pre + v.slice(ls);
    if (nv.length > BIO_MAX) return;
    ta.value = nv; ta.focus(); ta.setSelectionRange(s + pre.length, s + pre.length); fire(ta);
  }

  function buildEditor() {
    var e = el("div", "pf-edit"), msgEl = el("span", "pf-msg");
    function msg(t, err) { msgEl.textContent = t || ""; msgEl.className = "pf-msg" + (err ? " err" : ""); }

    async function setImg(f, w, h, k) {
      if (f.size > 10485760) { msg("Image trop lourde (10 Mo max).", 1); return; }
      try {
        var b = await JBC.crop(f, w, h);
        dropPreview(k); D[k + "Blob"] = b; D[k + "Prev"] = URL.createObjectURL(b); msg(""); refresh();
      } catch (er) { msg(er.message || "Image illisible", 1); }
    }

    /* Avatar */
    var avIn = filePick(function (f) { setImg(f, 256, 256, "avatar"); });
    var avB = el("div", "btns");
    avB.appendChild(btn("📷 Changer l'avatar", function () { avIn.click(); }));
    avB.appendChild(btn("Utiliser ma photo Discord", function () {
      var m = JBC.meta(JBC.me);
      if (!m.avatar) { msg("Aucune photo Discord trouvée sur ton compte.", 1); return; }
      dropPreview("avatar"); D.avatar_url = m.avatar; msg(""); refresh();
    }));
    avB.appendChild(btn("Retirer", function () { dropPreview("avatar"); D.avatar_url = null; refresh(); }));
    var avF = field("Avatar", avB, "L'image est recadrée au centre en carré.");
    avF.appendChild(avIn);

    /* Bannière */
    var bnIn = filePick(function (f) { setImg(f, 1500, 500, "banner"); });
    var bnB = el("div", "btns");
    bnB.appendChild(btn("🖼️ Changer la bannière", function () { bnIn.click(); }));
    bnB.appendChild(btn("Retirer", function () { dropPreview("banner"); D.banner_url = null; refresh(); }));
    var bnF = field("Bannière", bnB, "Recadrée en 3:1 (idéal : une capture large de ton camion). Sans image, la couleur ci-dessous est utilisée.");
    bnF.appendChild(bnIn);

    /* Bio (markdown façon Discord) */
    var bio = el("textarea"); bio.maxLength = BIO_MAX; bio.rows = 8; bio.value = D.bio || "";
    bio.placeholder = "Parle de toi, de ton style de conduite, de ton camion…\n# Titre\n**gras** *italique* __souligné__ ~~barré~~ ||spoiler|| ^^MAJUSCULES^^";
    var cnt = el("div", "hint", bio.value.length + " / " + BIO_MAX);
    bio.oninput = function () { D.bio = bio.value; cnt.textContent = bio.value.length + " / " + BIO_MAX; refresh(); };
    var tb = el("div", "pf-tb");
    [["B", "**", "**"], ["I", "*", "*"], ["U", "__", "__"], ["S", "~~", "~~"], ["Spoiler", "||", "||"], ["MAJ", "^^", "^^"], ["Code", "`", "`"]].forEach(function (t) {
      tb.appendChild(btn(t[0], function () { wrapSel(bio, t[1], t[2]); }, "pill sm"));
    });
    [["H1", "# "], ["H2", "## "], ["H3", "### "], ["Petit", "-# "], ["Citation", "> "], ["Liste", "- "]].forEach(function (t) {
      tb.appendChild(btn(t[0], function () { prefixLine(bio, t[1]); }, "pill sm"));
    });
    var bioBox = el("div"); bioBox.appendChild(tb); bioBox.appendChild(bio);
    var bioF = field("Bio", bioBox, "Syntaxe Discord : # titre · **gras** · *italique* · __souligné__ · ~~barré~~ · ||spoiler|| · ^^MAJUSCULES^^ · `code` · > citation · - liste · [texte](https://lien)");
    bioF.appendChild(cnt);

    var stRow = el("div"); stRow.style.cssText = "display:grid;gap:10px";
    stRow.appendChild(choices(STATUS, "status_emoji", function (v) { return v || "∅"; }, "pill sm"));
    stRow.appendChild(textInput("status_text", 60));

    e.appendChild(avF);
    e.appendChild(bnF);
    e.appendChild(field("Pseudo", textInput("display_name", 32)));
    e.appendChild(field("Statut", stRow, "Un emoji + une phrase courte (ex. « En route pour Calais »)."));
    e.appendChild(bioF);
    e.appendChild(field("Jeu", choices(["ets2", "ats", "both"], "game", function (v) { return GAMES[v]; })));
    e.appendChild(field("Camion préféré", textInput("truck", 60)));
    e.appendChild(field("Localisation", textInput("location", 40), "Ville, pays… (40 caractères max)"));
    e.appendChild(field("ID TruckersMP", idInput(), "Chiffres uniquement : affiche un lien vers ton profil TruckersMP."));
    LINKS.forEach(function (L) {
      e.appendChild(field("Lien " + L.l, urlInput(L.k), "Colle l'adresse de ton profil " + L.l + " (https://…)."));
    });
    e.appendChild(field("Badges", badgePicker(), "Jusqu'à " + BADGE_MAX + " badges."));
    e.appendChild(field("Effet de profil", mapChoices(EFFECTS, "effect"), "Animation affichée sur toute ta carte."));
    e.appendChild(field("Cadre d'avatar", mapChoices(FRAMES, "frame")));
    e.appendChild(field("Style du pseudo", mapChoices(NAMES, "name_style")));
    e.appendChild(field("Style de la carte", mapChoices(CARDS, "card_style")));
    e.appendChild(field("Style de la bannière", mapChoices(BANNER_FX, "banner_style")));
    e.appendChild(field("Couleur d'accent", swatches(ACCENTS, "accent"), "Anneau de l'avatar, étiquettes, néon… visible aussi dans le fil."));
    e.appendChild(field("Couleur de la bannière", swatches(BANNERS, "banner_color")));

    var sv = el("button", "btn btn-discord", "Enregistrer"); sv.type = "button";
    sv.onclick = function () { save(sv, msg); };
    var bar = el("div", "pf-save"); bar.appendChild(sv); bar.appendChild(btn("Annuler", closeEdit)); bar.appendChild(msgEl);
    e.appendChild(bar);
    return e;
  }

  function openEdit() {
    if (D) return;
    D = Object.assign({}, P, { avatarBlob: null, bannerBlob: null, avatarPrev: null, bannerPrev: null });
    D.bio = D.bio || ""; D.truck = D.truck || ""; D.status_text = D.status_text || ""; D.location = D.location || "";
    D.truckersmp_id = D.truckersmp_id || "";
    LINKS.forEach(function (L) { D[L.k] = D[L.k] || ""; });
    D.effect = pick(EFFECTS, D.effect, "none"); D.frame = pick(FRAMES, D.frame, "none");
    D.name_style = pick(NAMES, D.name_style, "plain"); D.card_style = pick(CARDS, D.card_style, "classic");
    D.banner_style = pick(BANNER_FX, D.banner_style, "none");
    D.badges = (D.badges || []).filter(function (k) { return BADGES[k]; }).slice(0, BADGE_MAX);
    D.accent = JBC.okColor(D.accent, "#5da8ff"); D.banner_color = JBC.okColor(D.banner_color, "#142338");
    refresh();
    editEl = buildEditor();
    headEl.after(editEl);
    editEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeEdit() {
    if (D) { dropPreview("avatar"); dropPreview("banner"); }
    D = null;
    if (editEl) { editEl.remove(); editEl = null; }
    redrawHead();
  }

  async function save(b, msg) {
    var name = D.display_name.trim();
    if (name.length < 2 || name.length > 32) { msg("Le pseudo doit faire entre 2 et 32 caractères.", 1); return; }
    var urls = {};
    for (var li = 0; li < LINKS.length; li++) {
      var L = LINKS[li], u = normUrl(D[L.k]);
      if (u && !okUrl(u)) { msg("Lien " + L.l + " invalide (https://… , 200 caractères max).", 1); return; }
      urls[L.k] = u || null;
    }
    b.disabled = true; msg("Enregistrement…");
    var upA = null, upB = null;
    try {
      var row = {
        display_name: name, bio: D.bio.trim().slice(0, BIO_MAX), accent: D.accent, banner_color: D.banner_color,
        status_emoji: D.status_emoji || null, status_text: D.status_text.trim().slice(0, 60),
        truck: D.truck.trim().slice(0, 60), game: D.game, avatar_url: D.avatar_url || null, banner_url: D.banner_url || null,
        effect: D.effect, frame: D.frame, name_style: D.name_style, card_style: D.card_style, banner_style: D.banner_style,
        badges: D.badges.slice(0, BADGE_MAX), location: D.location.trim().slice(0, 40),
        truckersmp_id: D.truckersmp_id ? D.truckersmp_id : null
      };
      LINKS.forEach(function (L) { row[L.k] = urls[L.k]; });
      if (D.avatarBlob) { upA = await JBC.upload(D.avatarBlob, "avatar"); row.avatar_url = upA; }
      if (D.bannerBlob) { upB = await JBC.upload(D.bannerBlob, "banner"); row.banner_url = upB; }
      var r = await JBC.sb.from("profiles").update(row).eq("user_id", JBC.me.id).select().single();
      if (r.error) throw r.error;
      if (P.avatar_url && P.avatar_url !== r.data.avatar_url) JBC.removeFile(P.avatar_url);
      if (P.banner_url && P.banner_url !== r.data.banner_url) JBC.removeFile(P.banner_url);
      JBC.setProfile(r.data); P = r.data;
      document.title = P.display_name + " — J.B.C Crome";
      closeEdit();
      loadPosts();
    } catch (er) {
      if (upA) JBC.removeFile(upA);
      if (upB) JBC.removeFile(upB);
      var m = String(er.message || er);
      msg(/column|constraint|check/i.test(m) ? "Base non à jour : exécute profils-setup-complet.sql dans Supabase. (" + m + ")" : "Erreur : " + m, 1);
      b.disabled = false;
    }
  }

  /* ---------- Publications du membre ---------- */
  async function loadPosts() {
    if (!plist) return;
    var c = await JBC.sb.from("posts").select("id", { count: "exact", head: true }).eq("user_id", viewId);
    if (countEl && c.count != null) countEl.textContent = "(" + c.count + ")";
    JBC.renderPosts(plist, { userId: viewId, reload: loadPosts, empty: own ? "Tu n'as encore rien publié — va sur le fil d'actualité !" : "Aucune publication pour le moment." });
  }

  /* ---------- Démarrage ---------- */
  function note(txt, link) {
    var n = el("div", "note", txt);
    if (link) { var a = el("a", "btn btn-discord", link[0]); a.href = link[1]; a.style.cssText = "display:inline-flex;margin-top:14px"; n.appendChild(el("br")); n.appendChild(a); }
    root.appendChild(n);
  }

  async function init() {
    if (D) closeEdit();
    root.textContent = ""; headEl = editEl = plist = countEl = null;
    if (!JBC.sb) { note("Profils non configurés (voir social.js)."); return; }

    var id = new URLSearchParams(location.search).get("id") || (JBC.me && JBC.me.id);
    if (!id) { note("Connecte-toi depuis le fil d'actualité pour accéder à ton profil.", ["Aller au fil d'actualité", "fil.html"]); return; }
    if (!UUID.test(id)) { note("Profil introuvable."); return; }
    viewId = id; own = !!(JBC.me && JBC.me.id === id);

    if (own) {
      if (JBC.profilesError) { note("Profils non activés : exécute fil-profils-setup.sql puis profils-setup-complet.sql dans Supabase (SQL Editor), puis recharge la page."); return; }
      P = JBC.profile;
    } else {
      var r = await JBC.sb.from("profiles").select("*").eq("user_id", id).maybeSingle();
      P = r.data; if (P) JBC.setProfile(P);
    }
    if (!P) { note("Profil introuvable.", ["Retour au fil", "fil.html"]); return; }

    document.title = P.display_name + " — J.B.C Crome";
    headEl = buildHead(view(P)); fx(headEl, null); root.appendChild(headEl);

    var h = el("h2", "pf-h", "Publications "); countEl = el("span", null, ""); h.appendChild(countEl);
    root.appendChild(h);
    plist = el("div"); root.appendChild(plist);
    loadPosts();
  }

  /* Charge tout seul les dépendances si profil.html n'est pas à jour */
  function loadDeps() {
    function js(src, ok) {
      return ok() ? Promise.resolve() : new Promise(function (r) {
        var t = document.createElement("script"); t.src = src + "?v=4"; t.onload = t.onerror = function () { r(); }; document.head.appendChild(t);
      });
    }
    return js("discord-md.js", function () { return !!window.DiscordMD; }).then(function () { return js("profil-fx.js", function () { return !!window.PFX; }); });
  }

  (async function () {
    await loadDeps();
    if (JBC.sb) {
      await JBC.start(init);
      setInterval(function () { if (!document.hidden && !D && !JBC.popOpen() && plist) loadPosts(); }, 30000);
    }
    init();
  })();
})();
