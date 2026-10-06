# Décisions prises en autonomie

Format : **décision** — pourquoi.

## Outillage

- **Nuxt 3.21 (et non Nuxt 4, pourtant « latest » sur npm)** — le cahier des charges impose Nuxt 3 ; la branche 3.x
  est toujours maintenue.
- **Node 22 LTS dans Docker et la CI** — version LTS stable ; le poste de dev tourne en Node 26, compatible.
- **`@node-rs/argon2`** plutôt que `argon2` — binaires précompilés (pas de toolchain C dans l'image Docker,
  compatible Alpine/musl), API argon2id complète.
- **`postgres` (postgres.js) comme pilote** — léger, très bien supporté par Drizzle.
- **Workflow git par pull requests** même en solo — demandé par le propriétaire du dépôt ; chaque PR est fusionnée
  (squash) uniquement si la CI est verte.

## Sécurité et données

- **Sessions** : jeton aléatoire de 256 bits dans un cookie `__Host-` HttpOnly/Secure/SameSite=Lax ; seule son
  empreinte SHA-256 est stockée en base. Expiration glissante de 30 jours (prolongée au plus une fois par heure pour
  limiter les écritures). Nouvelle session à chaque connexion, suppression en base à la déconnexion, autres sessions
  invalidées au changement de mot de passe.
- **CSRF** : « double-submit cookie » signé par HMAC + vérification de l'en-tête `Origin` (ou `Sec-Fetch-Site`) sur
  toutes les requêtes `/api` qui modifient des données. Choisi plutôt qu'un jeton synchronisé pour couvrir aussi
  l'inscription et la connexion (pas encore de session).
- **CSP** : nonce aléatoire par réponse ajouté à chaque `<script>` généré par Nuxt (hook `render:html`). Les styles
  gardent `'unsafe-inline'` (attributs `style` dynamiques de Vue) ; les scripts jamais.
- **Limitation de débit en base** (table `auth_throttle`) plutôt qu'en mémoire : survit aux redémarrages.
  Connexion : 5 échecs libres par nom d'utilisateur et 20 par IP, puis délai doublé à chaque échec (plafond 15 min).
  Inscription : 5 par IP et par heure. Seuils configurables par variables d'environnement.
- **Inscription** : un nom déjà pris renvoie « Ce nom d'utilisateur n'est pas disponible » — inévitable pour
  l'inscription ; la connexion, elle, a un message unique et un temps de réponse constant (vérification factice).
- **Accès aux fermes d'une autre personne** : réponse 404 (et non 403) pour ne pas révéler l'existence de la ferme.
- **Un lutin trouvé = un objectif `sprite-<id>` accompli** : une seule table de progression, pas de double état.
- **Les données du jeu ne passent pas par la base** : elles sont validées au démarrage (un fichier invalide empêche le
  serveur de démarrer) et servies telles quelles par `GET /api/game` avec un ETag.

## Interface et front

- **Design system maison** : tokens CSS + `@property` pour animer le passage d'une saison à l'autre ; ombres
  « solides » façon jeu plutôt que des ombres floues ; icônes pixel-art 12×12 dessinées en grilles de caractères et
  rendues en SVG (un `<path>` par couleur, rendu `crispEdges`).
- **Polices** : Fredoka (titres) retenue face à Baloo 2 et Chewy : plus lisible avec les accents français tout en
  restant ronde et « logo de jeu » ; Nunito pour le texte ; Pixelify Sans pour les accents de jeu.
- **Lutin original** : corps rond crème, grands yeux, chapeau pointu recourbé à pompon dans la couleur de l'équipe.
- **Données du jeu chargées côté client** depuis un fichier statique pré-rendu et compressé (`/api/game.json`,
  ≈ 75 Ko en gzip) plutôt qu'injectées dans chaque page rendue côté serveur (≈ 520 Ko de JSON) : pages légères,
  cache navigateur, moteur de suggestions recalculé instantanément à chaque case cochée.
- **Jour/nuit appliqué après l'hydratation** (`onNuxtReady`) pour éviter tout écart d'hydratation.
- **Réglages** stockés sur le compte (source de vérité) et recopiés dans un cookie non sensible pour que le thème soit
  appliqué dès le rendu serveur (pas de flash).
- **Accueil « Bon retour »** : le temps écoulé est mesuré depuis la dernière mise à jour de la partie (case cochée,
  date changée, note), pas depuis la dernière visite du site.

## Déploiement

- **`docker compose up` fonctionne sans configuration** : valeurs par défaut de démonstration pour le mot de passe
  PostgreSQL (base jamais exposée hors du réseau Docker interne) et secret CSRF aléatoire généré au démarrage si
  `NUXT_SESSION_SECRET` est absent (avertissement dans les logs). La documentation insiste pour les changer en
  production.
- **Conteneur applicatif** : utilisateur `node` (non-root), système de fichiers en lecture seule, `no-new-privileges`,
  toutes les capacités Linux retirées, sonde `/api/health`.
- **Seed de démonstration** : service Docker séparé derrière le profil `demo` (jamais lancé par défaut) ; le script
  refuse de tourner avec `NODE_ENV=production` sauf `ALLOW_DEMO_SEED=true`.
- **Captures d'écran** : les captures finales gardées dans `docs/screenshots/` couvrent les écrans principaux sur les
  6 tailles au printemps + les 4 saisons de l'accueil, en JPEG, pour ne pas alourdir le dépôt de centaines d'images.
