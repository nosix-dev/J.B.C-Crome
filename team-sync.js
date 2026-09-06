// team-sync.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const GITHUB_USER = "nosix-dev";
const GITHUB_REPO = "J.B.C-Crome";
const GITHUB_BRANCH = "main";
const REPO_PATH = path.join(__dirname, '..', GITHUB_REPO);

const ROLE_IDS = {
  patron: "1495109483028807740",
  gerants: "1495109879403385003",
  discord: "1495141640262647989",
  chauffeurs: "1495111013949902999",
  chauffeurs_essai: "1527806431519314183",
};

const ROLE_ORDER = ['patron', 'gerants', 'discord', 'chauffeurs', 'chauffeurs_essai'];

// Données par défaut (fallback si le repo n'existe pas)
const DEFAULT_TEAM = {
  patron: [{ pseudo: "Jerem0982", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Fondateur" }],
  gerants: [
    { pseudo: "bobi79", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "RastaTranKill", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" }
  ],
  discord: [{ pseudo: "Bratony", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" }],
  chauffeurs: [
    { pseudo: "bobi79", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Brique_decompote", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "bruno", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Denis", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "fastory 3", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "gozy2025", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "kik59", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Kylian972", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Ratah", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Soyeon", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "Stuky", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" },
    { pseudo: "zeox62", avatar: "", id: "", joinedAt: null, km: 0, convois: 0, anciennete: "Membre" }
  ],
  chauffeurs_essai: []
};

function calculerAnciennete(joinedAt) {
  if (!joinedAt) return 'Nouveau';
  const jours = Math.floor((Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (jours < 7) return 'Nouveau';
  if (jours < 30) return '1 mois';
  if (jours < 90) return '3 mois';
  if (jours < 180) return '6 mois';
  if (jours < 365) return '1 an';
  return 'Vétéran';
}

async function getMembersByRole(guild, roleId) {
  if (!roleId) return [];
  const role = guild.roles.cache.get(roleId);
  if (!role) return [];
  await guild.members.fetch();
  return role.members.map(m => ({
    pseudo: m.displayName || m.user.username,
    avatar: m.displayAvatarURL({ extension: 'png', size: 128 }),
    id: m.id,
    joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
    km: 0,
    convois: 0,
    anciennete: calculerAnciennete(m.joinedAt)
  }));
}

async function generateTeamJson(client, guildId) {
  try {
    const guild = client.guilds.cache.get(guildId) || client.guilds.cache.first();
    if (!guild) {
      console.log('[team-sync] ⚠️ Aucun serveur trouvé, utilisation des données par défaut');
      return DEFAULT_TEAM;
    }

    const teamData = {};
    for (const key of ROLE_ORDER) {
      teamData[key] = await getMembersByRole(guild, ROLE_IDS[key]);
      // Si un rôle est vide, on garde les données par défaut
      if (teamData[key].length === 0 && DEFAULT_TEAM[key]) {
        teamData[key] = DEFAULT_TEAM[key];
      }
    }

    // Créer le dossier du repo s'il n'existe pas
    if (!fs.existsSync(REPO_PATH)) {
      fs.mkdirSync(REPO_PATH, { recursive: true });
      console.log(`[team-sync] 📁 Dossier ${REPO_PATH} créé`);
    }

    // Écrire le fichier
    const teamPath = path.join(REPO_PATH, 'team.json');
    fs.writeFileSync(teamPath, JSON.stringify(teamData, null, 2));
    console.log('[team-sync] ✅ team.json généré');
    return teamData;
  } catch (err) {
    console.error('[team-sync] Erreur génération:', err.message);
    // En cas d'erreur, on utilise les données par défaut
    const teamPath = path.join(REPO_PATH, 'team.json');
    if (!fs.existsSync(REPO_PATH)) fs.mkdirSync(REPO_PATH, { recursive: true });
    fs.writeFileSync(teamPath, JSON.stringify(DEFAULT_TEAM, null, 2));
    return DEFAULT_TEAM;
  }
}

function pushToGitHub() {
  return new Promise((resolve) => {
    // Initialiser le repo git s'il n'existe pas
    const gitPath = path.join(REPO_PATH, '.git');
    let initCmd = '';
    if (!fs.existsSync(gitPath)) {
      initCmd = `cd "${REPO_PATH}" && git init && git remote add origin https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git && git branch -M ${GITHUB_BRANCH} && `;
    }

    const cmd = `${initCmd}cd "${REPO_PATH}" && git add team.json && (git commit -m "Mise à jour équipe - ${new Date().toISOString()}" || echo "Rien à commiter") && git push -u origin ${GITHUB_BRANCH} 2>&1`;
    
    console.log('[team-sync] Push vers GitHub...');
    exec(cmd, (error, stdout, stderr) => {
      if (error && !error.message.includes('nothing to commit') && !error.message.includes('already exists')) {
        console.error('[team-sync] Erreur push:', error.message);
        resolve(false);
        return;
      }
      if (stdout) console.log('[team-sync]', stdout.trim());
      console.log('[team-sync] ✅ Push terminé');
      resolve(true);
    });
  });
}

async function syncTeamToGitHub(client, guildId) {
  console.log('[team-sync] 🔄 Début synchronisation...');
  await generateTeamJson(client, guildId);
  await new Promise(r => setTimeout(r, 500));
  return await pushToGitHub();
}

function ensureRepoExists() {
  if (!fs.existsSync(REPO_PATH)) {
    fs.mkdirSync(REPO_PATH, { recursive: true });
    console.log(`[team-sync] 📁 Dossier ${REPO_PATH} créé automatiquement`);
    return true;
  }
  return true;
}

module.exports = { syncTeamToGitHub, ensureRepoExists };
