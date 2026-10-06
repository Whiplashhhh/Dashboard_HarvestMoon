# PLAN — Le Carnet de la Ferme

Compagnon de jeu (site de fan non officiel) pour **Harvest Moon DS** (version européenne, NTR-ABCP-EUR).
Le cahier des charges complet est dans [`PROMPT_HARVEST_MOON.md`](./PROMPT_HARVEST_MOON.md).

> Document vivant : mis à jour à chaque phase. Les choix faits en autonomie sont dans [`DECISIONS.md`](./DECISIONS.md),
> le reste à faire dans [`TODO.md`](./TODO.md).

## 1. Architecture

```
┌───────────────────────── Navigateur ──────────────────────────┐
│ Nuxt 3 (Vue 3, <script setup>, TS strict)                     │
│  pages/ ─ components/ ─ composables/ ─ assets/css (tokens)     │
│  useGameData() : données du jeu (JSON) chargées une fois       │
│  useFarm()     : état de la ferme active (API)                 │
│  moteur « Que faire maintenant ? » (shared/engine) exécuté     │
│  côté client → recalcul instantané à chaque case cochée        │
└──────────────────────────────┬────────────────────────────────┘
                               │ fetch JSON + cookie de session
                               │ + en-tête x-csrf-token
┌──────────────────────────────▼────────────────────────────────┐
│ Nitro (server/)                                               │
│  middleware : en-têtes sécurité/CSP, session, CSRF + Origin   │
│  api/auth/*  api/account/*  api/farms/*  api/game             │
│  services/ : logique d'accès aux données (toujours filtrée    │
│              par user_id)                                     │
│  validation Zod de toutes les entrées                          │
└──────────────────────────────┬────────────────────────────────┘
                               │ Drizzle ORM (postgres.js)
                     ┌─────────▼─────────┐
                     │ PostgreSQL 16     │  utilisateurs, sessions,
                     │                   │  fermes, progression, notes,
                     └───────────────────┘  limitation de débit
```

- **Données du jeu** : fichiers JSON versionnés dans `data/`, validés par des schémas Zod (`shared/schemas/`),
  jamais en base. Le serveur les charge, les valide au démarrage et les sert via `GET /api/game` (cache + ETag).
- **Données de la joueuse** : en base, via Drizzle, migrations SQL versionnées dans `server/database/migrations/`
  et appliquées automatiquement au démarrage du serveur (plugin Nitro).
- **Code partagé** (`shared/`) : schémas Zod, types, moteur de suggestions, calendrier du jeu. Aucune dépendance à Nuxt
  → testable avec Vitest pur.

## 2. Modèle de données

### 2.1 Base de données (PostgreSQL)

| Table             | Rôle                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `users`           | id (uuid), username (unique, insensible à la casse), email (optionnel), hash argon2id, réglages (jsonb), ferme active     |
| `sessions`        | id = SHA-256 du jeton (le jeton brut n'est jamais stocké), user_id, jeton CSRF, expiration glissante                      |
| `farms`           | ferme (sauvegarde) : nom du fermier, nom de la ferme, date du jeu (année/saison/jour), objectif épinglé, dernière session |
| `farm_objectives` | objectifs accomplis (un lutin trouvé = objectif `sprite-<id>` accompli)                                                   |
| `farm_steps`      | étapes cochées (objectif, méthode, étape)                                                                                 |
| `notes`           | notes de session : texte, date réelle, date du jeu                                                                        |
| `auth_throttle`   | limitation de débit connexion/inscription (clé = IP ou nom d'utilisateur)                                                 |

### 2.2 Fichiers JSON (`data/`)

| Fichier                                        | Contenu                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `sprites.json`                                 | 101 lutins : nom, équipe, condition de déblocage, étapes, prérequis |
| `teams.json`                                   | 10 équipes de lutins (couleur, chef)                                |
| `objectives/*.json`                            | objectifs hors lutins, regroupés par thème (déesse, ferme, social…) |
| `characters.json`                              | villageois, anniversaires, cadeaux, prétendantes                    |
| `festivals.json`                               | festivals (saison, jour, lieu, participation)                       |
| `calendar.json`                                | règles du calendrier (30 jours/saison, jours de la semaine)         |
| `buildings.json`, `tools.json`, `recipes.json` | référentiels consultables                                           |
| `raw/`                                         | cache du wikitext brut récupéré par `scripts/fetch-wiki.ts`         |

Les objectifs « lutins » sont **générés** à partir de `sprites.json` (une seule source de vérité).
Chaque entrée porte `sources: string[]`, `confidence` et éventuellement `notes`.

## 3. Écrans

| Route                        | Écran                                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| `/connexion`, `/inscription` | Boîte aux lettres / lettre, accueil dialogué                             |
| `/bienvenue`                 | Onboarding : créer sa ferme, puis « Qu'as-tu déjà fait ? »               |
| `/`                          | Ma ferme : bon retour, compteurs, suggestions, prochains événements      |
| `/objectifs`                 | Liste filtrable + recherche                                              |
| `/objectifs/[id]`            | Détail : méthodes en marque-pages, étapes cochables, prérequis, débloque |
| `/lutins`                    | Collection des 101 lutins par équipe                                     |
| `/calendrier`                | Calendrier mural par saison                                              |
| `/carnet`                    | Notes de session                                                         |
| `/recettes`                  | Tableau filtrable                                                        |
| `/compte`                    | Mot de passe, export JSON, suppression, gestion des fermes               |
| `/reglages`                  | Sons, animations réduites, saison forcée                                 |
| `/credits`                   | Crédits & sources (CC BY-SA)                                             |
| (partout)                    | « Fin de session » : mise à jour rapide en < 30 s                        |

## 4. Phases (ordre de priorité du cahier des charges)

1. [x] Squelette Nuxt + outillage (lint, prettier, typecheck, CI) + design system
2. [x] Données : 101 lutins + objectifs principaux (Déesse, bâtiments, outils) + schémas + tests
3. [x] Moteur « Que faire maintenant ? » + tests
4. [x] Auth sécurisée + persistance de la partie
5. [x] Pages Accueil, Objectifs, Détail, Lutins, Mise à jour rapide
6. [x] Scène animée, particules, jour/nuit, boîtes de dialogue
7. [x] Boucle d'auto-critique visuelle (captures Playwright, itérations)
8. [x] Calendrier, Carnet, Recettes, Mon compte
9. [x] Compléter les données (mariage, amitié, festivals, recettes)
10. [x] Docker, Caddy, README, PWA, passes sécurité/accessibilité

## 5. État

Toutes les phases sont livrées (voir [`RAPPORT.md`](./RAPPORT.md)). Historique : PR #1 à #11 sur GitHub, chacune
fusionnée après une CI verte (lint, typecheck, Vitest avec PostgreSQL, build, Playwright, image Docker).

## 6. Workflow git

- Tout passe par une branche `feat/…`, `chore/…`, `data/…` puis une **pull request** dont la CI (lint, typecheck,
  tests, build) doit être verte avant fusion (squash) dans `main`.
- Messages de commit en français, style Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `data:`).
