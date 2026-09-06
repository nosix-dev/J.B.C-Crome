// team-sync.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const trucksbookApi = require('./trucksbook');

// Configuration GitHub
const GITHUB_USER = "nosix-dev";
const GITHUB_REPO = "J.B.C-Crome";
const GITHUB_BRANCH = "main";
const REPO_PATH = path.join(__dirname, '..', GITHUB_REPO); // Dossier du repo cloné

// IDs des rôles (à ajuster selon votre serveur)
const ROLE_IDS = {
  patron: "1495109483028807740",
  gerants: "1495109879403385003",
  discord: "1495141640262647989",
  chauffeurs: "1495111013949902999",
  chauffeurs_essai: "1527806431519314183",
};

const ROLE_LABELS = {
  patron: 'Patron',
  gerants: 'Gérant',
  discord: 'Responsable Discord',
  chauffeurs: 'Chauffeur',
  chauffeurs_essai: 'Chauffeur Test',
};

const ROLE_ORDER = ['patron', 'gerants', 'discord', 'chauffeurs', 'chauffeurs_essai'];

// Fonction pour obtenir les membres d'un rôle
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

// Calculer l'ancienneté
function calculerAnciennete(joinedAt) {
  if (!joinedAt) return 'Nouveau';
  const now = new Date();
  const diff = now - new Date(joinedAt);
  const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (jours < 7) return 'Nouveau';
  if (jours < 30) return '1 mois';
  if (jours < 90) return '3 mois';
  if (jours < 180) return '6 mois';
  if (jours < 365) return '1 an';
  return 'Vétéran';
}

// Générer le fichier team.json
async function generateTeamJson(client, guildId) {
  try {
    const guild = client.guilds.cache.get(guildId) || client.guilds.cache.first();
    if (!guild) {
      console.error('[team-sync] Aucun serveur trouvé');
      return false;
    }

    console.log(`[team-sync] Génération de team.json pour ${guild.name}...`);

    const teamData = {};
    
    for (const key of ROLE_ORDER) {
      const members = await getMembersByRole(guild, ROLE_IDS[key]);
      teamData[key] = members;
      console.log(`[team-sync] ${key}: ${members.length} membre(s)`);
    }

    // Chemin du fichier team.json
    const teamPath = path.join(REPO_PATH, 'team.json');
    
    // Écrire le fichier
    fs.writeFileSync(teamPath, JSON.stringify(teamData, null, 2));
    console.log(`[team-sync] team.json généré (${Object.values(teamData).reduce((a,b) => a + b.length, 0)} membres au total)`);

    return true;
  } catch (err) {
    console.error('[team-sync] Erreur génération team.json:', err.message);
    return false;
  }
}

// Pousser sur GitHub
async function pushToGitHub() {
  return new Promise((resolve) => {
    const commands = [
      `cd "${REPO_PATH}"`,
      'git add team.json',
      `git commit -m "Mise à jour automatique de l'équipe - ${new Date().toLocaleString('fr-FR')}"`,
      'git push origin ' + GITHUB_BRANCH
    ];

    const cmd = commands.join(' && ');
    
    console.log('[team-sync] Push vers GitHub...');
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('[team-sync] Erreur push:', error.message);
        resolve(false);
        return;
      }
      if (stderr && !stderr.includes('nothing to commit')) {
        console.warn('[team-sync] stderr:', stderr);
      }
      if (stdout) {
        console.log('[team-sync] stdout:', stdout);
      }
      console.log('[team-sync] ✅ Push terminé');
      resolve(true);
    });
  });
}

// Fonction principale : génère ET push
async function syncTeamToGitHub(client, guildId) {
  console.log('[team-sync] Début synchronisation...');
  const generated = await generateTeamJson(client, guildId);
  if (!generated) {
    console.error('[team-sync] ❌ Échec de la génération');
    return false;
  }
  
  // Attendre un peu pour que le fichier soit écrit
  await new Promise(r => setTimeout(r, 500));
  
  const pushed = await pushToGitHub();
  if (!pushed) {
    console.error('[team-sync] ❌ Échec du push');
    return false;
  }
  
  console.log('[team-sync] ✅ Synchronisation complète');
  return true;
}

// Vérifier que le repo existe
function ensureRepoExists() {
  if (!fs.existsSync(REPO_PATH)) {
    console.log(`[team-sync] ⚠️ Le dossier ${REPO_PATH} n'existe pas.`);
    console.log(`[team-sync] Clone le repo avec :`);
    console.log(`git clone https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git "${REPO_PATH}"`);
    return false;
  }
  
  // Vérifier que c'est bien un repo git
  const gitPath = path.join(REPO_PATH, '.git');
  if (!fs.existsSync(gitPath)) {
    console.log(`[team-sync] ⚠️ ${REPO_PATH} n'est pas un dépôt git.`);
    return false;
  }
  
  return true;
}

module.exports = {
  generateTeamJson,
  pushToGitHub,
  syncTeamToGitHub,
  ensureRepoExists,
  ROLE_IDS,
  ROLE_LABELS,
  ROLE_ORDER
};
