/* Ajoute <script src="profil-nav.js"> dans tous les .html du dépôt (relançable sans risque).
   Usage : mettre ce fichier + profil-nav.js à la racine du site, puis :  node add-profil-nav.js */
const fs = require("fs"), path = require("path");
const root = process.cwd(), skip = new Set(["node_modules", ".git", ".github"]);
let done = 0, already = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!skip.has(e.name)) walk(p); continue; }
    if (!/\.html?$/i.test(e.name)) continue;
    let s = fs.readFileSync(p, "utf8");
    if (s.includes("profil-nav.js")) { already++; continue; }
    if (!/<\/body>/i.test(s)) { console.log("⚠ pas de </body> :", path.relative(root, p)); continue; }
    const rel = path.relative(path.dirname(p), path.join(root, "profil-nav.js")).split(path.sep).join("/");
    s = s.replace(/<\/body>/i, `<script src="${rel}" defer></script>\n</body>`);
    fs.writeFileSync(p, s); done++; console.log("✔", path.relative(root, p));
  }
})(root);
console.log(`\n${done} page(s) modifiée(s), ${already} déjà à jour.`);
