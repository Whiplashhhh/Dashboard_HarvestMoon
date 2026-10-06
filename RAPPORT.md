# Rapport — Le Carnet de la Ferme

## Lancer la démo

```bash
git clone https://github.com/Whiplashhhh/Dashboard_HarvestMoon.git && cd Dashboard_HarvestMoon
docker compose up -d --build                 # app + PostgreSQL, migrations appliquées au démarrage
docker compose --profile demo run --rm seed  # compte de démonstration
```

Puis ouvrir **http://localhost:3000** et se connecter avec **`demo`** / **`Tournesol-Lumineux-42`**
(ferme « Les Tournesols », 12 Été an 1, 34 lutins trouvés, objectif épinglé « Débloquer le lutin Venus », notes).

En local sans Docker pour l'application : voir le [README](README.md#lancer-en-local).

## Ce qui est fait

Toutes les phases du cahier des charges sont livrées, par pull requests fusionnées après CI verte
(lint, typecheck, Vitest avec PostgreSQL, build, Playwright, image Docker).

| Domaine                               | Livré                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Données du jeu**                    | 101 lutins / 10 équipes, 237 objectifs (dont 101 générés depuis les lutins : déesse 11, bâtiments 17, outils 44, mine 9, mariage 10, festivals 14, animaux 7, recettes 6…), 49 personnages, 15 festivals, calendrier + 13 horaires, 17 bâtiments, 13 outils, 5 mines, 134 recettes. Schémas Zod, tests d'intégrité (références, cycles), cache du wikitext de 88 pages Fandom, `scripts/fetch-wiki.ts`.                                                                                 |
| **Moteur « Que faire maintenant ? »** | `shared/engine` : disponibilité (prérequis + saison + dates), ce qui manque, suggestions triées avec raisons lisibles (épinglé, déjà commencé, festival imminent, saison exclusive, fin de saison, débloque N objectifs, palier des 60 lutins, rapidité), festivals et anniversaires à venir.                                                                                                                                                                                           |
| **Sécurité**                          | argon2id (OWASP), sessions serveur hachées en base (cookie `__Host-`, rotation, glissement 30 j, déconnexion qui invalide), CSRF double-submit signé + Origin, limitation de débit IP + nom avec délai progressif (comptage atomique), messages génériques, CSP stricte à nonce, HSTS & co, contrôle d'appartenance testé (Bob ne voit rien d'Alice), corps ≤ 64 Ko, export JSON, suppression de compte. Revue de sécurité indépendante : aucun point critique, points moyens corrigés. |
| **Interface**                         | Mise en page « DS ouverte », scène SVG en couches (parallax, jour/nuit réel, particules et météo de saison, lutins promeneurs), boîtes de dialogue à machine à écrire, tableau de liège, onglets marque-pages, collection des lutins avec célébration, calendrier mural, carnet, recettes, compte, réglages (sons WebAudio, animations réduites, saison forcée), crédits CC BY-SA. Icônes pixel-art et lutin originaux, polices auto-hébergées. PWA installable.                        |
| **Accessibilité**                     | Audit WCAG 2.2 AA corrigé (contrastes, focus, ARIA, annonces) ; test axe-core automatique sur 11 pages × 4 saisons, sans violation sérieuse. Lighthouse accessibilité 92–96.                                                                                                                                                                                                                                                                                                            |
| **Performance**                       | Lighthouse mobile (build de prod) : performance 95–98, CLS 0, TBT 0 ms.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Tests**                             | 114 tests Vitest (unitaires, données, 30 tests d'API sur serveur réel) + 5 parcours Playwright × 2 appareils (ordinateur, mobile) + 1 audit axe-core.                                                                                                                                                                                                                                                                                                                                   |
| **Déploiement**                       | Dockerfile multi-étapes non-root, Compose (Postgres sur réseau interne, conteneur en lecture seule), `deploy/Caddyfile.example`, README complet.                                                                                                                                                                                                                                                                                                                                        |
| **Auto-critique visuelle**            | `npm run screenshots` / `npm run screenshots:final` : 70 captures finales dans `docs/screenshots/` (6 tailles, 4 saisons, nuit). Itérations faites : statistiques de l'accueil, débordement du calendrier mobile, cercle du jour du jeu, sources lisibles, jour/nuit à l'hydratation, filtres sur tablette, typographie française, densité du décor mobile, contrastes.                                                                                                                 |

## Ce qui n'est pas fait / limites

- **Noms français** (`nameFr`) : aucun renseigné, faute de source fiable pour la traduction officielle EU — les noms
  anglais du jeu sont affichés (règle « n'invente jamais »).
- **32 prérequis restent « à vérifier toi-même »** (conditions non modélisables automatiquement : nombre de festivals
  pour Saturn, « avoir engagé un lutin violet », cœurs des prétendantes, 3 étables…). Ils sont affichés mais ne
  bloquent pas les suggestions.
- La météo de la scène est **décorative** (déterministe par date), pas celle du jeu.
- Pas d'envoi d'e-mails (l'e-mail est facultatif et inutilisé, comme demandé) ; pas de réinitialisation de mot de
  passe par e-mail.
- Les dépendances de **build** signalées par `npm audit` (outils Nuxt/CLI) ne sont pas dans l'image d'exécution ;
  à mettre à jour quand des correctifs amont sortent.

## À vérifier manuellement (données `confidence: "low"`)

Toutes affichées « info à vérifier » dans le site ; détail dans [`TODO.md`](TODO.md).

1. **Premier jour de la semaine** (`calendar.json`) : déduit « dimanche » — décale les jours de fermeture affichés.
2. **Mariages Witch Princess / Harvest Goddess** : réputés impossibles (bugs) en version US 1.0, statut EU inconnu.
3. **Chef de l'équipe noire** (Sprite Station) : Neptune choisi par convention, non sourcé.
4. **Turbojolt / Bodigizer (+ XL)** : effets inversés entre le wiki et Fogu.

Et parmi les 86 entrées `medium` : jours de fermeture du supermarché (mardi seul ou mardi + dimanche), horaires de la
forge, lutins liés aux outils maudits/bénis, coûts d'amélioration d'un palier à l'autre.

## Où regarder

- [`PLAN.md`](PLAN.md) — architecture et modèle de données
- [`DECISIONS.md`](DECISIONS.md) — tous les choix faits en autonomie et pourquoi
- [`TODO.md`](TODO.md) — incertitudes et pistes
- `docs/screenshots/` — captures finales
- Pull requests #1 → #11 sur GitHub : l'historique détaillé
