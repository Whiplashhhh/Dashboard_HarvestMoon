# 🌱 Le Carnet de la Ferme

**Compagnon de partie pour _Harvest Moon DS_** (Nintendo DS, 2005, version européenne).
Pour les joueuses occasionnelles qui reprennent leur partie après des semaines : le site rappelle **où tu en étais**,
propose **quoi faire maintenant** selon ton avancement et la saison dans le jeu, et garde tes notes de session.

> Site de fan **non officiel**, non affilié à Natsume, Marvelous ou Rising Star Games. Aucun asset du jeu n'est
> utilisé : illustrations, icônes pixel-art, lutins et sons sont des créations originales. Les données du jeu
> proviennent du [wiki Harvest Moon (Fandom)](https://harvestmoon.fandom.com/) sous licence CC BY-SA 3.0
> (voir la page « Crédits & sources » du site).

![Accueil sur ordinateur](docs/screenshots/accueil--spring--1440x900.png)

## Fonctionnalités

- **Ma ferme** : accueil dialogué (« Bon retour à la ferme ! Ça fait 12 jours… »), objectif épinglé, dernière note,
  progression vers 60 puis 101 lutins, festivals et anniversaires des prochains jours.
- **Que faire maintenant ?** : un moteur de suggestions (`shared/engine`) qui ne propose que les objectifs faisables
  (prérequis remplis, bonne saison), triés et expliqués (« Faisable seulement en été », « Le festival a lieu dans
  3 jours », « Te rapproche des 60 lutins »…).
- **Objectifs** (≈ 240, dont les 101 lutins) : filtres, recherche, méthodes alternatives, étapes cochables,
  prérequis manquants, ce que ça débloque, sources et fiabilité (« info à vérifier »).
- **Lutins**, **Calendrier**, **Carnet**, **Recettes** (134), **Mon compte** (export JSON, suppression),
  **Réglages** (sons WebAudio, animations réduites, saison du thème), **Crédits & sources**.
- **Fin de session** en moins de 30 s : date du jeu, ce qui a été fait, une note pour son « moi du futur ».
- Interface « DS ouverte » : écran du haut = la vallée vivante (thème par saison du jeu, cycle jour/nuit selon
  l'heure réelle, particules, lutins trouvés qui se promènent) ; écran du bas = le carnet. Mobile : bandeau compact
  et navigation au pouce. Installable (PWA).

## Stack

Nuxt 3 (Vue 3, `<script setup>`, TypeScript strict) · PostgreSQL 16 + Drizzle ORM · Zod · CSS natif à design tokens
(aucune librairie de composants) · Vitest + Playwright · Docker Compose + Caddy.

## Lancer en local

Prérequis : Node.js ≥ 22, Docker (pour PostgreSQL).

```bash
cp .env.example .env                                           # variables locales (aucun secret commité)
docker compose -f docker-compose.dev.yml -p carnet-dev up -d   # PostgreSQL sur 127.0.0.1:5433 (+ base de test)
npm install
npm run db:seed-demo                                           # facultatif : compte demo / Tournesol-Lumineux-42
npm run dev                                                    # http://localhost:3000
```

Les migrations sont appliquées automatiquement au démarrage du serveur (`npm run db:migrate` pour le faire à la main).

### Qualité

| Commande              | Rôle                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| `npm run lint`        | ESLint + Prettier (`npm run lint:fix` pour corriger)                        |
| `npm run typecheck`   | vue-tsc en mode strict                                                      |
| `npm test`            | Vitest : unitaires, données du jeu, API (l'API exige `npm run build` avant) |
| `npm run test:e2e`    | Playwright : parcours principaux sur ordinateur et mobile (après un build)  |
| `npm run build`       | build de production (valide et pré-rend les données du jeu)                 |
| `npm run screenshots` | captures d'écran tailles × saisons (boucle d'auto-critique visuelle)        |

La CI GitHub Actions exécute lint, typecheck, build, Vitest (avec PostgreSQL) et Playwright sur chaque pull request.

## Variables d'environnement

| Variable                           | Obligatoire    | Rôle                                                                                                                                       |
| ---------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `NUXT_DATABASE_URL`                | oui            | URL PostgreSQL (`postgres://user:mdp@hôte:port/base`)                                                                                      |
| `NUXT_SESSION_SECRET`              | recommandé     | ≥ 32 caractères aléatoires (`openssl rand -base64 48`) pour signer les jetons CSRF. Absent : secret temporaire régénéré à chaque démarrage |
| `NUXT_PUBLIC_SITE_URL`             | oui en prod    | URL publique exacte (`https://carnet.example.fr`), sert à vérifier l'en-tête `Origin`                                                      |
| `NUXT_TRUST_PROXY`                 | derrière Caddy | `true` pour lire l'IP cliente dans `X-Forwarded-For` (limitation de débit)                                                                 |
| `NUXT_COOKIE_SECURE`               | non            | `false` uniquement pour une démo en HTTP hors `localhost` (déconseillé)                                                                    |
| `NUXT_AUTH_IP_FREE_ATTEMPTS`       | non (20)       | échecs de connexion tolérés par IP avant délai progressif                                                                                  |
| `NUXT_AUTH_REGISTRATIONS_PER_HOUR` | non (5)        | inscriptions par IP et par heure                                                                                                           |
| `POSTGRES_PASSWORD`                | oui en prod    | mot de passe PostgreSQL utilisé par `docker-compose.yml`                                                                                   |

## Déploiement (serveur Ubuntu + Docker + Caddy)

```bash
git clone https://github.com/Whiplashhhh/Dashboard_HarvestMoon.git carnet && cd carnet
cat > .env <<'ENV'
POSTGRES_PASSWORD=<mot de passe long et aléatoire>
NUXT_SESSION_SECRET=<openssl rand -base64 48>
NUXT_PUBLIC_SITE_URL=https://carnet.example.fr
NUXT_TRUST_PROXY=true
ENV
docker compose up -d --build                  # app (non-root, lecture seule) + PostgreSQL (réseau interne)
docker compose --profile demo run --rm seed   # facultatif : compte de démonstration
```

L'application écoute sur `127.0.0.1:3000`. Installe [Caddy](https://caddyserver.com/docs/install) sur l'hôte et
adapte [`deploy/Caddyfile.example`](deploy/Caddyfile.example) : HTTPS automatique, compression, reverse proxy.
Mise à jour : `git pull && docker compose up -d --build` (les migrations s'appliquent au démarrage).

Pour un essai rapide sans configuration : `docker compose up -d --build` puis http://localhost:3000 (valeurs par
défaut de démonstration — **à changer avant toute mise en ligne**).

## Mettre à jour les données du jeu

Les données vivent dans `data/*.json` (versionnées, jamais en base) et sont validées par les schémas Zod de
`shared/schemas/` :

1. `npm run data:fetch` rafraîchit le cache du wikitext Fandom dans `data/raw/` (API MediaWiki, délai poli,
   User-Agent explicite). Pour ajouter une page : `npm run data:fetch -- "Titre exact (DS)"` et son titre dans
   `scripts/wiki-pages.txt`.
2. Modifie les fichiers JSON (en français, tutoiement, `sources` obligatoires, `confidence: "low"` si incertain).
3. `npm run data:validate -- data/sprites.json` (un fichier) puis `npm run data:check` (intégrité complète :
   références, absence de cycle, 101 lutins).

Un lutin est automatiquement un objectif `sprite-<id>` : ne pas le dupliquer dans `data/objectives/`.

## Structure

```
assets/css/         design tokens (bois, parchemin, thèmes saisonniers), base, polices auto-hébergées
components/         ui/ (boutons, panneaux, dialogues…), scene/ (vallée animée), farm/, objectives/, layout/
composables/        useFarm, useGame, usePlayer (moteur), useAuth, useSettings, useSound…
data/               données du jeu (JSON) + raw/ (cache wikitext Fandom)
deploy/             exemple de Caddyfile
docs/screenshots/   captures finales (tailles × saisons)
pages/              écrans (accueil, objectifs, lutins, calendrier, carnet, recettes, compte…)
scripts/            fetch-wiki, validate-data, seed-demo, migrate, screenshots, generate-icons
server/             API Nitro, middlewares (en-têtes, session, CSRF), base Drizzle + migrations
shared/             schémas Zod, assemblage des données, moteur « Que faire maintenant ? »
tests/              unit/, data/, api/ (Vitest), e2e/ (Playwright)
```

Voir aussi [`PLAN.md`](PLAN.md) (architecture), [`DECISIONS.md`](DECISIONS.md) (choix faits),
[`TODO.md`](TODO.md) (reste à faire, données incertaines) et [`RAPPORT.md`](RAPPORT.md).

## Licence

Code sous licence MIT. Données issues du wiki Fandom : CC BY-SA 3.0 (adaptations partagées sous la même licence).
