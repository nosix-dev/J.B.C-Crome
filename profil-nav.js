/* J.B.C Crome — bouton « Profil » tout à droite du header, sur toutes les pages */
(function () {
  "use strict";
  var me = document.currentScript, base = me && me.src ? me.src.slice(0, me.src.lastIndexOf("/") + 1) : "";
  function init() {
    var header = document.querySelector("header");
    if (!header || header.querySelector(".header-profile")) return;

    if (!document.getElementById("pnav-css")) {
      var st = document.createElement("style"); st.id = "pnav-css";
      st.textContent =
        ".header-right{display:flex;align-items:center;gap:12px;margin-left:auto;justify-self:end;flex:none}" +
        ".header-profile{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:inherit;text-decoration:none;font:inherit;font-size:.9rem;white-space:nowrap;transition:.2s}" +
        ".header-profile:hover,.header-profile.active{border-color:#5da8ff;background:rgba(93,168,255,.14)}" +
        ".header-profile img{width:24px;height:24px;border-radius:50%;object-fit:cover;display:block}" +
        "@media(max-width:700px){.header-profile span{display:none}.header-profile{padding:5px}}";
      document.head.appendChild(st);
    }

    /* Retire l'ancien lien « Profil » du menu central (évite le doublon) */
    [].forEach.call(header.querySelectorAll('nav a[href$="profil.html"]'), function (a) {
      var li = a.closest("li"); (li || a).remove();
    });

    var link = document.createElement("a");
    link.className = "header-profile"; link.href = base + "profil.html"; link.title = "Mon profil";
    if (/profil\.html$/.test(location.pathname)) link.classList.add("active");
    var ico = document.createElement("b"); ico.textContent = "👤"; ico.style.fontWeight = "400";
    var lab = document.createElement("span"); lab.textContent = "Profil";
    link.appendChild(ico); link.appendChild(lab);

    var cta = header.querySelector(".header-cta");
    if (cta && /absolute|fixed/.test(getComputedStyle(cta).position)) {
      /* « Rejoindre » est positionné en absolu : on place Profil à sa droite et on décale « Rejoindre » vers la gauche */
      var cs = getComputedStyle(cta), r = parseFloat(cs.right) || 0;
      link.style.cssText = "position:" + cs.position + ";right:" + r + "px;top:50%;transform:translateY(-50%)";
      header.appendChild(link);
      cta.style.right = (r + link.offsetWidth + 12) + "px";
      window.addEventListener("resize", function () { cta.style.right = (r + link.offsetWidth + 12) + "px"; });
    } else if (cta) {
      var w = document.createElement("div"); w.className = "header-right";
      cta.replaceWith(w); w.appendChild(cta); w.appendChild(link);
    } else header.appendChild(link);

    /* Sur les pages qui chargent social.js : affiche l'avatar du membre connecté */
    var tries = 0, t = setInterval(function () {
      if (++tries > 20) return clearInterval(t);
      var p = window.JBC && JBC.profile;
      if (p && typeof p.avatar_url === "string" && /^https:\/\//.test(p.avatar_url)) {
        clearInterval(t);
        var im = document.createElement("img"); im.alt = ""; im.referrerPolicy = "no-referrer"; im.src = p.avatar_url;
        ico.replaceWith(im);
      }
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
