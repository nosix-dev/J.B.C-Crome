// team-api.js
// Module qui expose GET /api/team, GET /api/stats, GET /api/classement et GET /api/events pour le site J.B.C Crome,
// exposé en HTTPS via un tunnel ngrok.

const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawn, execFileSync } = require("child_process");
const express = require("express");
const cors = require("cors");
const trucksbookApi = require("./trucksbook");

// ==== CONFIG ====
const GUILD_ID = process.env.GUILD_ID || null;
const PORT = process.env.TEAM_API_PORT || 26079;

const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN || null;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN || null;

const ROLE_IDS = {
  patron: "1495109483028807740",
  gerants: "1495109879403385003",
  discord: "1495141640262647989",
  chauffeurs: "1495111013949902999",
  chauffeurs_essai: "1527806431519314183",
};

const ROLES_CHAUFFEURS_STATS = [
  ROLE_IDS.patron,
  ROLE_IDS.gerants,
  ROLE_IDS.chauffeurs,
  ROLE_IDS.chauffeurs_essai,
];

const DATA_PATH = path.join(__dirname, "data.json");

const NGROK_DIR = path.join(__dirname, "ngrok-bin");
const NGROK_BIN = path.join(NGROK_DIR, "ngrok");
const NGROK_TARBALL = path.join(NGROK_DIR, "ngrok.tgz");
const NGROK_URL = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz";
// =================

function resoudreGuild(client) {
  if (GUILD_ID) {
    const g = client.guilds.cache.get(GUILD_ID);
    if (g) return g;
  }
  return client.guilds.cache.first() || null;
}

// Nouvelle fonction pour obtenir un guild par ID ou utiliser le guild par défaut
function getGuildById(client, guildId) {
  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) return guild;
    throw new Error(`Serveur ${guildId} introuvable pour le bot.`);
  }
  return resoudreGuild(client);
}

function chargerDonneesBot() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { guilds: {} };
  }
}

// Cache des membres
const MEMBERS_CACHE_MS = 10 * 60 * 1000; // 10 minutes
let membersCache = null;
let membersCacheTime = 0;
let membersFetchPromise = null;
let lastMembersFetchError = null;
let lastMembersFetchErrorTime = 0;

// Cache général pour l'API
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

let cache = null;
let cacheTime = 0;
let cacheStats = null;
let cacheStatsTime = 0;
let cacheClassement = null;
let cacheClassementTime = 0;
let cacheEvents = null;
let cacheEventsTime = 0;
let started = false;

// Fonction pour obtenir les membres avec un cache et une gestion d'erreur
async function getGuildMembers(guild) {
  const now = Date.now();
  if (membersCache && now - membersCacheTime < MEMBERS_CACHE_MS) {
    return membersCache;
  }

  if (lastMembersFetchError && now - lastMembersFetchErrorTime < 60 * 1000) {
    if (membersCache) return membersCache;
    throw lastMembersFetchError;
  }

  if (!membersFetchPromise) {
    membersFetchPromise = guild.members.fetch()
      .then((members) => {
        membersCache = members;
        membersCacheTime = Date.now();
        lastMembersFetchError = null;
        return members;
      })
      .catch((err) => {
        lastMembersFetchError = err;
        lastMembersFetchErrorTime = Date.now();
        if (membersCache) return membersCache;
        throw err;
      })
      .finally(() => {
        membersFetchPromise = null;
      });
  }

  return membersFetchPromise;
}

// Modifier les fonctions build* pour accepter un paramètre guild
async function buildTeamData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");

  const members = await getGuildMembers(guild);
  const result = {};

  for (const [key, roleId] of Object.entries(ROLE_IDS)) {
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      result[key] = [];
      continue;
    }
    result[key] = members
      .filter((m) => m.roles.cache.has(role.id))
      .map((m) => ({
        pseudo: m.displayName || m.user.username,
        avatar: m.displayAvatarURL({ extension: "png", size: 128 }),
        id: m.id,
        joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
        // Pour l'instant on met des données fictives ou on pourra les récupérer ailleurs
        km: 0,
        convois: 0,
        anciennete: "Nouveau",
      }));
  }

  return result;
}

async function getTeamData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
  const cacheKey = guild.id; // on cache par serveur
  // On pourrait faire un cache par guild, mais pour simplifier on garde le cache global
  // et on invalide si le guild change
  if (cache && cache._guildId === guild.id && now - cacheTime < CACHE_MS) return cache;
  cache = await buildTeamData(client, guild);
  cache._guildId = guild.id;
  cacheTime = now;
  return cache;
}

async function buildStatsData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");

  const members = await getGuildMembers(guild);
  const nbChauffeurs = members.filter((m) =>
    ROLES_CHAUFFEURS_STATS.some((roleId) => m.roles.cache.has(roleId))
  ).size;

  let km = 0;
  let trajets = 0;
  try {
    const statsTrucksBook = await trucksbookApi.getCompanyStats("all");
    km = statsTrucksBook.km;
    trajets = statsTrucksBook.trajets;
  } catch (err) {
    console.error("[team-api] TrucksBook injoignable, repli sur les stats internes :", err.message);
    const botData = chargerDonneesBot();
    const guildData = (botData.guilds && botData.guilds[guild.id]) || {};
    if (guildData.societe) {
      km = guildData.societe.km || 0;
      trajets = guildData.societe.trajets || 0;
    }
  }

  return { chauffeurs: nbChauffeurs, km, trajets };
}

async function getStatsData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
  // Pour éviter de mélanger les caches entre guilds, on utilise un cache par guild
  // (on pourrait améliorer avec un Map)
  if (cacheStats && cacheStats._guildId === guild.id && now - cacheStatsTime < CACHE_MS) return cacheStats;
  cacheStats = await buildStatsData(client, guild);
  cacheStats._guildId = guild.id;
  cacheStatsTime = now;
  return cacheStats;
}

// ==== CLASSEMENT ====
function construireTop(entries, champ, limite = 10) {
  return entries
    .filter((e) => (e[champ] || 0) > 0)
    .slice()
    .sort((a, b) => (b[champ] || 0) - (a[champ] || 0))
    .slice(0, limite)
    .map((e, i) => ({ rang: i + 1, pseudo: e.pseudo, valeur: e[champ] || 0 }));
}

async function buildClassementData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");

  // Récupérer les stats du mois depuis TrucksBook (pour chaque chauffeur)
  let trucksbookDrivers = {};
  try {
    trucksbookDrivers = await trucksbookApi.getDriversStats("month");
  } catch (err) {
    console.error("[team-api] Erreur récupération stats chauffeurs TrucksBook:", err.message);
  }

  const entries = Object.entries(trucksbookDrivers).map(([pseudo, stats]) => ({
    pseudo,
    km: stats.km || 0,
    missions: stats.trajets || 0
  }));

  const topKm = construireTop(entries, "km", 10);
  const topMissions = construireTop(entries, "missions", 10);

  return {
    updatedAt: new Date().toISOString(),
    top_km: topKm,
    top_missions: topMissions
  };
}

async function getClassementData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
  if (cacheClassement && cacheClassement._guildId === guild.id && now - cacheClassementTime < CACHE_MS) return cacheClassement;

  try {
    cacheClassement = await buildClassementData(client, guild);
    cacheClassement._guildId = guild.id;
    cacheClassementTime = now;
    return cacheClassement;
  } catch (err) {
    if (cacheClassement) {
      console.warn("[team-api] Erreur rafraîchissement classement, retour du cache périmé:", err.message);
      return cacheClassement;
    }
    throw err;
  }
}

// ==== EVENEMENTS ====
async function buildEventsData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");

  const botData = chargerDonneesBot();
  const guildData = (botData.guilds && botData.guilds[guild.id]) || {};
  const evenements = Array.isArray(guildData.evenements) ? guildData.evenements : [];

  return evenements
    .filter((ev) => ev && ev.date && !isNaN(new Date(ev.date)))
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function getEventsData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
  if (cacheEvents && cacheEvents._guildId === guild.id && now - cacheEventsTime < CACHE_MS) return cacheEvents;
  cacheEvents = await buildEventsData(client, guild);
  cacheEvents._guildId = guild.id;
  cacheEventsTime = now;
  return cacheEvents;
}

// ==== TÉLÉCHARGEMENT NGROK ====
function telechargerFichier(url, destPath, redirectsRestants = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "team-api-script" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirectsRestants <= 0) return reject(new Error("Trop de redirections"));
        res.resume();
        return resolve(telechargerFichier(res.headers.location, destPath, redirectsRestants - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Téléchargement échoué, HTTP ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on("finish", () => fileStream.close(() => resolve()));
      fileStream.on("error", reject);
    }).on("error", reject);
  });
}

async function assurerBinaireNgrok() {
  if (fs.existsSync(NGROK_BIN)) return;

  if (!fs.existsSync(NGROK_DIR)) fs.mkdirSync(NGROK_DIR, { recursive: true });

  console.log("[team-api] binaire ngrok absent, téléchargement...");
  await telechargerFichier(NGROK_URL, NGROK_TARBALL);

  console.log("[team-api] extraction...");
  execFileSync("tar", ["xzf", NGROK_TARBALL, "-C", NGROK_DIR]);
  fs.chmodSync(NGROK_BIN, 0o755);
  fs.unlinkSync(NGROK_TARBALL);

  console.log("[team-api] binaire ngrok installé :", NGROK_BIN);
}

async function ouvrirTunnelNgrok(port) {
  if (!NGROK_AUTHTOKEN) {
    console.error("[team-api] NGROK_AUTHTOKEN manquant dans le .env — impossible de lancer le tunnel.");
    return;
  }
  if (!NGROK_DOMAIN) {
    console.error("[team-api] NGROK_DOMAIN manquant dans le .env — impossible de lancer le tunnel.");
    return;
  }

  try {
    await assurerBinaireNgrok();
  } catch (err) {
    console.error("[team-api] impossible de télécharger/extraire ngrok:", err.message);
    console.error("[team-api] vérifie que 'tar' est disponible sur l'hébergeur, et que l'OS est bien linux-amd64.");
    return;
  }

  const child = spawn(
    NGROK_BIN,
    ["http", `--url=${NGROK_DOMAIN}`, String(port)],
    { env: { ...process.env, NGROK_AUTHTOKEN } }
  );

  let annonce = false;
  const gererLigne = (buf) => {
    const text = buf.toString();
    console.log("[ngrok]", text.trim());

    if (!annonce && /started tunnel|client session established/i.test(text)) {
      annonce = true;
      console.log(`[team-api] tunnel ngrok actif : https://${NGROK_DOMAIN}`);
      console.log(`[team-api] ⚠️ mets à jour les pages du site avec :`);
      console.log(`[team-api]    - TEAM_API_URL       = https://${NGROK_DOMAIN}/api/team`);
      console.log(`[team-api]    - STATS_API_URL      = https://${NGROK_DOMAIN}/api/stats`);
      console.log(`[team-api]    - CLASSEMENT_API_URL = https://${NGROK_DOMAIN}/api/classement`);
      console.log(`[team-api]    - EVENTS_API_URL     = https://${NGROK_DOMAIN}/api/events`);
    }
  };

  child.stdout.on("data", gererLigne);
  child.stderr.on("data", gererLigne);

  child.on("exit", (code) => {
    console.error(`[team-api] ngrok s'est arrêté (code ${code}). Relance dans 5s...`);
    setTimeout(() => ouvrirTunnelNgrok(port), 5000);
  });

  child.on("error", (err) => {
    console.error("[team-api] impossible de lancer ngrok:", err.message);
  });
}

// ==== START ====
function startTeamApi(client, options = {}) {
  if (started) {
    console.warn("[team-api] déjà démarré, appel ignoré.");
    return;
  }
  started = true;

  const port = options.port || PORT;
  const app = express();

  app.use(cors({
    origin: true,
    methods: ["GET", "OPTIONS"],
  }));

  app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
  });

  app.get("/api/team", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getTeamData(client, guildId);
      res.json(data);
    } catch (err) {
      console.error("[team-api] erreur team:", err);
      res.status(500).json({ error: "internal_error" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getStatsData(client, guildId);
      res.json(data);
    } catch (err) {
      console.error("[team-api] erreur stats:", err);
      res.status(500).json({ error: "internal_error" });
    }
  });

  app.get("/api/classement", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getClassementData(client, guildId);
      res.json(data);
    } catch (err) {
      console.error("[team-api] erreur classement:", err);
      res.status(500).json({ error: "internal_error" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getEventsData(client, guildId);
      res.json(data);
    } catch (err) {
      console.error("[team-api] erreur events:", err);
      res.status(500).json({ error: "internal_error" });
    }
  });

  app.listen(port, "0.0.0.0", async () => {
    console.log(`[team-api] écoute en interne sur le port ${port}`);
    await ouvrirTunnelNgrok(port);
  });
}

module.exports = { startTeamApi, getClassementData };
