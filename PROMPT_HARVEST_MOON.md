# Mission : « Le Carnet de la Ferme », compagnon de jeu pour Harvest Moon DS

Tu vas construire **de A à Z, en autonomie complète**, un site web publié qui aide une joueuse occasionnelle de **Harvest Moon DS** (Nintendo DS, 2005, cartouche européenne NTR-ABCP-EUR) à reprendre sa partie là où elle l'avait laissée.

Je ne serai pas disponible pendant plusieurs heures. **Ne me pose aucune question.** Quand tu hésites, prends la décision la plus raisonnable, note-la dans `DECISIONS.md` et continue. Prends tout le temps nécessaire : la qualité compte plus que la vitesse. Mais garde l'ordre de priorité de la section 8, pour qu'il y ait **une version démontrable demain matin** même si tout n'est pas fini.

---

## 1. Le besoin (à garder en tête en permanence)

La joueuse joue de temps en temps, avec des semaines d'écart. À chaque reprise, elle ne sait plus ce qu'elle faisait ni quoi faire ensuite.

Parcours idéal :
1. Elle ouvre le site, se connecte, et voit immédiatement **où elle en était** : date dans le jeu, objectif en cours, dernière note, et depuis combien de temps elle n'a pas joué.
2. Le site lui propose **une liste d'objectifs réalisables maintenant**, en fonction de son avancement et de la saison en cours dans le jeu.
3. Elle en choisit un et voit **plusieurs moyens d'y arriver** (méthodes alternatives, étapes concrètes, astuces, contraintes de saison ou d'horaire).
4. Après sa session, elle coche ce qu'elle a fait, met à jour la date du jeu et laisse une note pour son « moi du futur ».

Elle doit pouvoir retrouver ses données sur téléphone, tablette et ordinateur : **un compte utilisateur est obligatoire**.

Tout le site est **en français**.

---

## 2. Stack technique imposée

- **Nuxt 3** (Vue 3, Composition API, `<script setup>`), **TypeScript strict**
- **PostgreSQL 16** + **Drizzle ORM** (migrations versionnées dans le repo)
- Validation de toutes les entrées serveur avec **Zod**
- CSS : CSS natif avec variables (design tokens), éventuellement SCSS. **Pas de Tailwind, pas de librairie de composants** : toute l'interface est sur mesure (voir section 5).
- Tests : **Vitest** (logique métier + API) et **Playwright** (parcours principaux + captures d'écran responsive)
- Déploiement : **Docker Compose** (app + postgres), avec un exemple de **Caddyfile** pour le reverse proxy HTTPS. Le site sera auto-hébergé sur un serveur Ubuntu avec Docker.
- ESLint + Prettier ; `npm run build`, `npm run lint`, `npm run typecheck` et `npm test` doivent passer à la fin.

---

## 3. Sécurité (site publié sur Internet)

- Inscription par **nom d'utilisateur + mot de passe**. L'e-mail est optionnel et non utilisé pour l'instant : pas d'envoi de mails.
- Hachage **argon2id** (paramètres OWASP recommandés).
- **Sessions côté serveur** stockées en base. Cookie `HttpOnly`, `Secure` (en production), `SameSite=Lax`, rotation de l'identifiant à la connexion, expiration glissante (30 jours) et déconnexion qui invalide la session en base.
- **Protection CSRF** sur toutes les routes qui modifient des données (token synchronisé ou double-submit cookie, plus vérification de l'en-tête Origin).
- **Rate limiting** sur la connexion et l'inscription (par IP et par nom d'utilisateur), avec délai progressif. Messages d'erreur génériques (pas de « cet utilisateur n'existe pas »).
- Politique de mot de passe raisonnable (≥ 10 caractères, vérification contre une petite liste de mots de passe courants embarquée).
- En-têtes de sécurité : **CSP stricte** (pas de `unsafe-inline` pour les scripts), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors 'none'.
- Chaque requête API vérifie que les données appartiennent bien à l'utilisateur connecté. Écris des tests qui tentent d'accéder aux données d'un autre utilisateur.
- Aucun secret dans le repo : `.env.example` documenté, secrets lus depuis l'environnement.
- Conteneur applicatif en utilisateur non-root ; Postgres non exposé hors du réseau Docker.
- Page « Mon compte » : changer de mot de passe, **exporter ses données en JSON**, **supprimer son compte** (avec confirmation).
- Pas de traqueurs, pas d'analytics, pas de ressources tierces chargées au runtime : les polices sont auto-hébergées.

---

## 4. Les données du jeu : la partie la plus importante

### 4.1 Recherche

Tu dois constituer toi-même la base de connaissances du jeu en allant chercher les informations sur le web. Sources principales :
- Le wiki Fandom : https://harvestmoon.fandom.com — utilise de préférence l'**API MediaWiki** pour récupérer le wikitext brut, par exemple `https://harvestmoon.fandom.com/api.php?action=parse&page=Harvest_Sprites_(DS)&prop=wikitext&format=json`. Pages clés à explorer : `Harvest Sprites (DS)`, la page du jeu `Harvest Moon DS`, les personnages, les festivals, les bâtiments et agrandissements, les outils et leurs améliorations, la mine, les recettes, le calendrier et les anniversaires, le mariage et les événements de cœur.
- Fogu.com (guides Harvest Moon DS) et les FAQ/walkthroughs GameFAQs pour recouper.

Règles de recherche :
- **Attention aux confusions** : il existe *Harvest Moon DS* et *Harvest Moon DS Cute* (version avec héroïne), aux contenus proches mais différents. Ne garde que **Harvest Moon DS**. Ignore aussi Island of Happiness, Sunshine Islands, etc.
- **Version européenne** : la fonctionnalité de connexion avec *Friends of Mineral Town* via le slot GBA (qui faisait venir certaines prétendantes) **a été retirée** de la version européenne. Exclus ou marque clairement comme « non disponible en version EU » tout ce qui en dépend.
- La version européenne existe peut-être en français, avec des noms traduits. Garde le **nom anglais** comme référence et ajoute un champ `nameFr` uniquement si tu trouves une source fiable. N'invente jamais de traduction de nom propre ; laisse `null` sinon.
- Quand deux sources se contredisent, garde la plus détaillée ou la plus récente, et note le désaccord dans un champ `notes`.
- **N'invente rien.** Si une information est incertaine, mets `confidence: "low"` et affiche-le discrètement dans l'interface (« info à vérifier »).

### 4.2 Stockage

Toutes les données du jeu vivent dans des **fichiers JSON versionnés** dans `data/` (pas en base) : `sprites.json`, `objectives.json`, `characters.json`, `festivals.json`, `calendar.json`, `buildings.json`, `tools.json`, `recipes.json`… Chaque fichier a un **schéma Zod** dans `shared/schemas/` et un test qui valide le fichier contre ce schéma, puis vérifie l'intégrité référentielle (pas de prérequis qui pointe vers un id inexistant, pas de cycle dans les prérequis).

Chaque entrée porte un champ `sources: string[]` (URL). Le contenu Fandom est sous licence **CC BY-SA** : crée une page « Crédits & sources » qui l'attribue correctement, avec un lien vers chaque page utilisée.

Écris un script `scripts/fetch-wiki.ts` qui récupère le wikitext brut dans `data/raw/` (cache, avec un délai poli entre les requêtes et un User-Agent explicite), pour que les données soient reproductibles. La transformation en JSON structuré, c'est toi qui la fais en lisant ces sources ; relis-toi.

### 4.3 Modèle d'un objectif

```ts
Objective {
  id: string                    // slug stable, ex. "sprite-venus"
  category: "lutins" | "deesse" | "mariage" | "ferme" | "batiments" | "outils"
          | "animaux" | "cultures" | "mine" | "festivals" | "recettes" | "amitie" | "argent"
  title: string                 // en français, orienté action : "Débloquer le lutin Venus"
  summary: string               // 1-2 phrases
  prerequisites: Prerequisite[] // autres objectifs, nb de lutins trouvés, saison, année, bâtiment, niveau d'outil…
  methods: Method[]             // AU MOINS 1, idéalement 2-3 quand le jeu le permet
  rewards?: string[]
  availableSeasons?: Season[]   // si l'objectif n'est faisable qu'à certaines saisons
  difficulty: 1 | 2 | 3
  estimatedDuration: "une session" | "quelques jours de jeu" | "une saison" | "long terme"
  relatedSpriteIds?: string[]
  confidence: "high" | "medium" | "low"
  sources: string[]
}

Method {
  title: string                 // ex. "Par les cadeaux quotidiens"
  steps: string[]               // étapes concrètes et actionnables
  tips?: string[]
  constraints?: string[]        // ex. "seulement en été", "magasin fermé le mercredi"
  cost?: string                 // or, objets…
}
```

Couverture visée, par ordre de priorité :
1. **Les 101 lutins** (Harvest Sprites), avec leur équipe de couleur et leur condition de déblocage : c'est le fil rouge du jeu. Le palier des 60 lutins (restauration de la Déesse) doit être un objectif majeur.
2. Restaurer la Déesse, et l'arbre de progression qui en découle.
3. Les bâtiments et agrandissements de la ferme, l'amélioration des outils, la mine.
4. Le mariage (prétendantes, conditions, événements) et l'amitié avec les villageois.
5. Festivals, calendrier et anniversaires.
6. Recettes (tableau consultable, sans forcément un objectif par recette).

### 4.4 Le moteur « Que faire maintenant ? »

Logique pure dans `shared/engine/`, entièrement testée :
- Entrée : les données du jeu et l'état de la partie de la joueuse (date du jeu, objectifs accomplis, lutins trouvés, indicateurs déclarés : bâtiments, niveau des outils, etc.).
- Sortie : les objectifs **disponibles maintenant** (prérequis remplis + saison compatible), triés par pertinence. Critères : objectif épinglé, rapidité, débloque beaucoup d'autres objectifs, uniquement faisable cette saison (urgence), festival ou anniversaire dans les prochains jours.
- Pour chaque suggestion, une **raison lisible** : « Faisable cette saison seulement », « Te rapproche des 60 lutins », « Le festival X a lieu dans 3 jours »…
- Les objectifs verrouillés restent consultables, avec la liste de ce qui manque.

---

## 5. Interface : la priorité absolue de qualité

L'objectif : quand elle ouvre le site, elle doit avoir l'impression d'ouvrir **le carnet de sa ferme**, tout droit sorti de l'univers de Harvest Moon DS. Chaleureux, rustique, coloré, pixel-art doux, typiquement DS milieu des années 2000. Ce n'est pas un dashboard SaaS : c'est un objet de jeu.

### 5.1 Contraintes de propriété intellectuelle (non négociables)

- **N'utilise aucun asset officiel** : pas de logo Harvest Moon, pas de sprites extraits du jeu, pas d'images de personnages, pas de musique du jeu.
- Tout le visuel est **original** : illustrations en SVG ou en CSS, pixel-art que tu dessines toi-même (SVG pixellisé ou grilles CSS), icônes faites main.
- Les lutins sont représentés de manière **générique et originale** : par exemple une petite silhouette ronde avec un chapeau pointu dans la couleur de l'équipe, que tu conçois toi-même. Pas de copie du design officiel.
- Titre du site original (« Le Carnet de la Ferme » ou mieux si tu trouves), avec la mention discrète « site de fan non officiel, non affilié à Natsume / Marvelous » dans le pied de page.

### 5.2 Direction artistique

**Ambiance** : vallée paisible, ciel bleu tendre, collines vertes, bois clair, papier ou parchemin, panneaux en bois cloués, fenêtres de dialogue à bordure épaisse et arrondie comme dans les jeux DS de l'époque.

**Typographie** (auto-hébergée, via `@fontsource` ou les fichiers dans `public/fonts`) :
- Titres : une police ronde, épaisse et joyeuse façon logo de jeu de ferme, par exemple *Fredoka*, *Baloo 2* ou *Chewy* (choisis la plus réussie après essai), avec un contour ou une ombre portée façon lettrage sur panneau de bois.
- Texte courant : une police très lisible et douce (*Nunito* par exemple).
- Accents « interface de jeu » (date du jeu, compteurs, or, nombre de lutins) : une police pixel lisible (*Pixelify Sans* ou *DotGothic16*), utilisée avec parcimonie.

**Palette** : définis des design tokens. Une base commune (bois, parchemin, encre brune, vert prairie, bleu ciel), puis **un thème par saison** que le site applique selon la saison *dans le jeu* saisie par la joueuse :
- Printemps : roses cerisier, verts tendres, ciel clair
- Été : jaunes soleil, bleus vifs, verts profonds
- Automne : oranges, rouges brique, ocres
- Hiver : blancs neige, bleus glacés, violets doux

Le changement de saison doit être une transition visible et agréable (fondu des couleurs et du décor).

Les **10 équipes de lutins** ont chacune leur couleur, utilisée de façon cohérente partout (badges, filtres, collection).

### 5.3 L'idée centrale : la métaphore des deux écrans DS

- **Sur ordinateur et tablette en paysage**, la mise en page évoque une DS ouverte. En haut, l'« écran du haut » : la scène vivante (décor de la vallée selon la saison, date du jeu, météo décorative, lutins trouvés qui se baladent). En bas, l'« écran tactile » : la navigation et le contenu interactif. N'imite pas l'objet DS de façon kitsch ou en plastique gris : c'est une **inspiration de composition**, élégante et intégrée.
- **Sur mobile**, la scène devient un bandeau compact et animé en haut. Le contenu passe dessous, et la navigation devient une barre en bas, accessible au pouce, avec des icônes faites main (Ferme, Objectifs, Lutins, Calendrier, Carnet).

### 5.4 Éléments d'immersion à réaliser

- **Décor de scène en SVG en couches** (parallax léger) : ciel, collines, une ferme stylisée, clôtures, arbres qui changent avec la saison. Particules saisonnières : pétales au printemps, lucioles en été, feuilles en automne, neige en hiver.
- **Cycle jour/nuit décoratif** selon l'heure réelle de l'appareil (aube, jour, crépuscule, nuit étoilée).
- **Boîtes de dialogue façon jeu** pour les messages importants : texte qui s'écrit lettre par lettre (passable d'un clic), petit triangle clignotant « suivant ». Par exemple l'accueil : « Bon retour à la ferme ! Ça fait 12 jours… La dernière fois, tu voulais débloquer le lutin Venus. »
- **Cartes d'objectif** façon panneau en bois ou fiche épinglée sur un tableau de liège, avec une icône de catégorie, des étoiles de difficulté et la raison de la suggestion.
- **Page détail d'un objectif** : les méthodes présentées comme des **onglets en marque-page** de carnet ; les étapes en liste cochable (cocher une étape la sauvegarde) ; les contraintes sous forme de petites étiquettes (saison, horaire, coût en or).
- **Collection des lutins** : grille par équipe de couleur, lutins non trouvés en silhouette avec un « ? », animation de célébration quand on en coche un (petit saut, confettis de feuilles), barre de progression vers 60 puis 101 en forme de chemin ou de jauge en bois.
- **Calendrier** façon calendrier de ferme accroché au mur : saisons sous forme d'onglets, jour actuel du jeu entouré, festivals et anniversaires illustrés.
- **Micro-interactions** : boutons qui s'enfoncent légèrement comme des boutons physiques, survols chaleureux, transitions de page en glissement doux. Retours sonores optionnels générés en **WebAudio** (petits « pop » et « ding » synthétisés, aucun fichier audio tiers), **désactivés par défaut**, activables dans les réglages.
- **Écran de connexion et d'inscription** : un portail ou une boîte aux lettres de ferme, formulaire présenté comme une lettre, accueil dialogué. L'inscription enchaîne sur un **onboarding** pour créer sa ferme (nom du fermier, nom de la ferme, date actuelle dans le jeu), puis une étape rapide « Qu'as-tu déjà fait ? » pour déclarer en quelques clics les lutins déjà trouvés et les bâtiments déjà construits, par grandes cases à cocher.
- **États vides et chargements** soignés et thématiques (un lutin qui fait une sieste, une graine qui pousse…). Jamais de spinner générique.

### 5.5 Exigences transverses

- **Responsive à fond** : teste et soigne au minimum 360×740, 390×844, 768×1024, 1024×768, 1440×900 et 1920×1080. Aucun débordement horizontal, cibles tactiles ≥ 44 px, textes lisibles sans zoom.
- **Accessibilité** : contrastes AA minimum (attention aux textes sur décor), navigation clavier complète, focus visibles et stylés, `aria-*` corrects, textes alternatifs, et **`prefers-reduced-motion` respecté** (particules, parallax et machine à écrire désactivés).
- **Performance** : décor léger (SVG optimisés, animations CSS et transform/opacity uniquement), pas de jank sur un téléphone moyen. Vise un Lighthouse ≥ 90 en performance et en accessibilité sur mobile.
- Mode PWA basique (manifest + icône originale) pour pouvoir l'ajouter à l'écran d'accueil du téléphone.

### 5.6 Boucle d'auto-critique visuelle (obligatoire)

Après avoir construit chaque écran principal, lance un script Playwright qui prend des **captures d'écran** sur les tailles listées ci-dessus, pour chacune des 4 saisons. **Regarde ces captures** et critique-toi sans complaisance : est-ce que ça ressemble à un objet de jeu chaleureux, ou à un template web ? Les alignements, la hiérarchie et les espacements sont-ils impeccables ? Itère au moins deux fois par écran principal. Garde les captures finales dans `docs/screenshots/`.

---

## 6. Fonctionnalités (pages)

1. **Accueil / Ma ferme** : récapitulatif « bon retour » (temps écoulé depuis la dernière visite, date du jeu, objectif épinglé, dernière note), compteurs clés (lutins x/101, objectifs accomplis), top 3 à 5 des suggestions « Que faire maintenant ? », festivals et anniversaires des prochains jours du jeu.
2. **Objectifs** : liste filtrable par catégorie, disponibilité (disponible / verrouillé / accompli) et saison ; recherche texte ; épingler un objectif en cours.
3. **Détail d'un objectif** : méthodes alternatives, étapes cochables, prérequis (avec liens), ce que ça débloque ensuite, sources.
4. **Lutins** : la collection des 101, par équipe, avec la condition de déblocage de chacun.
5. **Calendrier** : festivals, anniversaires, contraintes saisonnières.
6. **Carnet** : notes de session datées (date réelle + date du jeu), pour se souvenir. Au moment d'ajouter une note, proposer aussi de mettre à jour la date du jeu.
7. **Mettre à jour ma partie** : action rapide accessible partout (bouton flottant ou dans la barre) pour changer la date du jeu, cocher des objectifs et des lutins, écrire une note. C'est le geste de fin de session : il doit prendre moins de 30 secondes.
8. **Recettes** : tableau consultable et filtrable.
9. **Mon compte**, **Réglages** (sons, animations réduites, saison forcée pour le thème), **Crédits & sources**.

Une joueuse peut avoir **plusieurs fermes** (sauvegardes) par compte, mais l'interface reste centrée sur la ferme active.

---

## 7. Méthode de travail

1. Commence par écrire `PLAN.md` : architecture, modèle de données (BDD + JSON), liste des écrans, découpage en phases. Mets-le à jour au fil de l'eau.
2. Initialise un dépôt git et **commite à la fin de chaque étape cohérente** avec des messages clairs (en français).
3. Tiens `DECISIONS.md` (choix faits sans moi, et pourquoi) et `TODO.md` (ce qui reste, ce qui est incertain dans les données).
4. Lance régulièrement build, lint, typecheck et tests ; ne laisse pas l'erreur s'accumuler.
5. Fournis un `docker compose up` qui marche du premier coup (migrations appliquées automatiquement au démarrage) et un compte de démonstration créé par un script de seed séparé, désactivé par défaut en production, avec une partie déjà avancée pour montrer le site.
6. Termine par un `README.md` en français : présentation, lancement en local, variables d'environnement, déploiement Docker + Caddy, mise à jour des données du jeu, structure du projet.

---

## 8. Ordre de priorité (pour avoir une démo quoi qu'il arrive)

1. Squelette Nuxt + design system (tokens, polices, thèmes saisonniers, composants de base : panneau, boîte de dialogue, bouton, carte, onglets)
2. Données des **101 lutins** + objectifs principaux (Déesse, bâtiments, outils), avec leurs schémas et tests
3. Moteur « Que faire maintenant ? » + tests
4. Auth sécurisée + persistance de la partie en base
5. Pages Accueil, Objectifs, Détail objectif, Lutins, Mise à jour rapide
6. Scène animée, particules, cycle jour/nuit, boîtes de dialogue
7. Boucle d'auto-critique visuelle (captures + itérations)
8. Calendrier, Carnet, Recettes, Mon compte (export / suppression)
9. Compléter les données (mariage, amitié, festivals, recettes)
10. Docker, Caddy, README, PWA, passes finales sécurité et accessibilité

À la fin, écris dans `RAPPORT.md` un résumé de ce qui est fait, de ce qui ne l'est pas, des points à vérifier manuellement (notamment les données marquées `confidence: "low"`) et de la commande exacte pour lancer la démo.
