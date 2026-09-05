// team-api.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const trucksbookApi = require("./trucksbook");

const GUILD_ID = process.env.GUILD_ID || null;
const PORT = process.env.TEAM_API_PORT || 26079;

const ROLE_IDS = {
  patron: "1495109483028807740",
  gerants: "1495109879403385003",
  discord: "1495141640262647989",
  chauffeurs: "1495111013949902999",
  chauffeurs_essai: "1527806431519314183",
};

const ROLES_CHAUFFEURS_STATS = [
  ROLE_IDS.patron, ROLE_IDS.gerants, ROLE_IDS.chauffeurs, ROLE_IDS.chauffeurs_essai,
];

const DATA_PATH = path.join(__dirname, "data.json");

function resoudreGuild(client) {
  if (GUILD_ID) {
    const g = client.guilds.cache.get(GUILD_ID);
    if (g) return g;
  }
  return client.guilds.cache.first() || null;
}

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

const MEMBERS_CACHE_MS = 10 * 60 * 1000;
let membersCache = null;
let membersCacheTime = 0;
let membersFetchPromise = null;
let lastMembersFetchError = null;
let lastMembersFetchErrorTime = 0;

const CACHE_MS = 5 * 60 * 1000;
let cache = null; let cacheTime = 0;
let cacheStats = null; let cacheStatsTime = 0;
let cacheClassement = null; let cacheClassementTime = 0;
let cacheEvents = null; let cacheEventsTime = 0;
let started = false;

async function getGuildMembers(guild) {
  const now = Date.now();
  if (membersCache && now - membersCacheTime < MEMBERS_CACHE_MS) return membersCache;
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
      .finally(() => { membersFetchPromise = null; });
  }
  return membersFetchPromise;
}

async function buildTeamData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");
  const members = await getGuildMembers(guild);
  const result = {};

  for (const [key, roleId] of Object.entries(ROLE_IDS)) {
    const role = guild.roles.cache.get(roleId);
    if (!role) { result[key] = []; continue; }
    result[key] = members
      .filter((m) => m.roles.cache.has(role.id))
      .map((m) => ({
        pseudo: m.displayName || m.user.username,
        avatar: m.displayAvatarURL({ extension: "png", size: 128 }),
        id: m.id,
        joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
        km: 0, convois: 0, anciennete: "Nouveau",
      }));
  }
  return result;
}

async function getTeamData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
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
  const nbChauffeurs = members.filter((m) => ROLES_CHAUFFEURS_STATS.some((roleId) => m.roles.cache.has(roleId))).size;

  let km = 0; let trajets = 0;
  try {
    const statsTrucksBook = await trucksbookApi.getCompanyStats("all");
    km = statsTrucksBook.km; trajets = statsTrucksBook.trajets;
  } catch (err) {
    console.error("[team-api] TrucksBook injoignable, repli sur les stats internes :", err.message);
    const botData = chargerDonneesBot();
    const guildData = (botData.guilds && botData.guilds[guild.id]) || {};
    if (guildData.societe) { km = guildData.societe.km || 0; trajets = guildData.societe.trajets || 0; }
  }
  return { chauffeurs: nbChauffeurs, km, trajets };
}

async function getStatsData(client, guildId) {
  const now = Date.now();
  const guild = getGuildById(client, guildId);
  if (cacheStats && cacheStats._guildId === guild.id && now - cacheStatsTime < CACHE_MS) return cacheStats;
  cacheStats = await buildStatsData(client, guild);
  cacheStats._guildId = guild.id;
  cacheStatsTime = now;
  return cacheStats;
}

function construireTop(entries, champ, limite = 10) {
  return entries
    .filter((e) => (e[champ] || 0) > 0)
    .slice().sort((a, b) => (b[champ] || 0) - (a[champ] || 0))
    .slice(0, limite)
    .map((e, i) => ({ rang: i + 1, pseudo: e.pseudo, valeur: e[champ] || 0 }));
}

async function buildClassementData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");

  // 1. Essayer TrucksBook
  let trucksbookDrivers = {};
  try { trucksbookDrivers = await trucksbookApi.getDriversStats("month"); } catch (err) { console.error("[team-api] Erreur récupération stats chauffeurs TrucksBook:", err.message); }
  
  let entries = Object.entries(trucksbookDrivers).map(([pseudo, stats]) => ({
    pseudo,
    km: stats.km || 0,
    missions: stats.trajets || 0
  }));

  // 2. Si TrucksBook est vide, on utilise les données internes du bot (via /trajet ajouter)
  if (entries.length === 0) {
    console.log("[team-api] TrucksBook vide, fallback sur les données internes du bot...");
    const botData = chargerDonneesBot();
    const guildData = (botData.guilds && botData.guilds[guild.id]) || {};
    const driversData = guildData.drivers || {};

    const members = await getGuildMembers(guild);
    const membersMap = new Map();
    members.forEach(m => membersMap.set(m.id, m.displayName || m.user.username));

    entries = Object.entries(driversData)
      .filter(([userId, stats]) => stats && (stats.km > 0 || stats.trajets > 0))
      .map(([userId, stats]) => ({
        pseudo: membersMap.get(userId) || "Chauffeur inconnu",
        km: stats.km || 0,
        missions: stats.trajets || 0
      }));
  }

  const topKm = construireTop(entries, "km", 10);
  const topMissions = construireTop(entries, "missions", 10);

  return { updatedAt: new Date().toISOString(), top_km: topKm, top_missions: topMissions };
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
    if (cacheClassement) { console.warn("[team-api] Erreur rafraîchissement classement, retour du cache périmé:", err.message); return cacheClassement; }
    throw err;
  }
}

async function buildEventsData(client, guild) {
  if (!guild) guild = resoudreGuild(client);
  if (!guild) throw new Error("Aucun serveur Discord disponible pour le bot.");
  const botData = chargerDonneesBot();
  const guildData = (botData.guilds && botData.guilds[guild.id]) || {};
  const evenements = Array.isArray(guildData.evenements) ? guildData.evenements : [];
  return evenements.filter((ev) => ev && ev.date && !isNaN(new Date(ev.date))).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
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

function startTeamApi(client, options = {}) {
  if (started) { console.warn("[team-api] déjà démarré, appel ignoré."); return; }
  started = true;

  const port = options.port || PORT;
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.get("/api/team", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getTeamData(client, guildId);
      res.json(data);
    } catch (err) { console.error("[team-api] erreur team:", err); res.status(500).json({ error: "internal_error" }); }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getStatsData(client, guildId);
      res.json(data);
    } catch (err) { console.error("[team-api] erreur stats:", err); res.status(500).json({ error: "internal_error" }); }
  });

  app.get("/api/classement", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getClassementData(client, guildId);
      res.json(data);
    } catch (err) { console.error("[team-api] erreur classement:", err); res.status(500).json({ error: "internal_error" }); }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const data = await getEventsData(client, guildId);
      res.json(data);
    } catch (err) { console.error("[team-api] erreur events:", err); res.status(500).json({ error: "internal_error" }); }
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`[team-api] API exposée en interne sur le port ${port}`);
    console.log(`[team-api] (aucun tunnel Cloudflare/ngrok) – l'API n'est accessible que depuis le serveur local.`);
  });
}

module.exports = { startTeamApi, getClassementData };
