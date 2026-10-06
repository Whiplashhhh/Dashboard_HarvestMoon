# TODO

## Données incertaines (à vérifier en jeu)

Toute entrée `confidence: "low"` est signalée dans l'interface par « info à vérifier ». Points ouverts :

- **Premier jour de la semaine** (`calendar.json`, `firstWeekday`) : déduit « dimanche » d'après un guide ;
  le calendrier imprimable de Fogu suggère plutôt « samedi ». Impacte les jours de fermeture affichés.
- **Supermarché** : fermé mardi **et** dimanche (Fogu, GameRevolution) ou seulement mardi (wiki).
- **Forge (Saibara / Gray)** : 10 h – 16 h ou 10 h – 17 h selon les pages de Fogu.
- **Chef de l'équipe noire (Sprite Station)** : aucune source ne nomme de chef ; Neptune choisi par convention.
- **Turbojolt / Bodigizer** (recettes) : effets inversés entre le wiki (repris de FoMT) et Fogu.
- **Mariages Harvest Goddess / Witch Princess** : réputés impossibles (bugs) en version US 1.0 ; statut EU inconnu.
- **Lutins des outils maudits** (Maddie, Matthew, Sammy, Fen) : liés à l'objectif « outil béni » ; on ignore si
  lever la malédiction par le vœu de la Déesse débloque aussi le lutin.
- **Betty, Chamy, Ole / Sue, Magic, Bali** : les étapes évoquent la tondeuse / trayeuse avec le Touch Glove (non confirmé).
- **Naissance de l'enfant** : le moment exact où elle ouvre la source chaude du cirque n'est pas documenté.
- **Améliorations d'outils** : coût d'un palier depuis un outil déjà amélioré non documenté (prix depuis l'outil de base).
- **Noms français** : aucun `nameFr` renseigné faute de source fiable pour la traduction officielle EU.

## Limites du modèle de prérequis

- **Saturn** (« participer activement à 3 festivals ») et l'**équipe violette** (« avoir engagé un lutin violet ») restent
  des conditions `manual` : il faudrait un compteur de festivals ou un prérequis « un lutin de l'équipe X ».
- Conditions de nombre (« 3 étables au total », « 5 poulaillers ») : référence au premier bâtiment + condition `manual`.

## Pistes d'amélioration

- Trouver une source fiable des noms français de la version EU (`nameFr`).
- Modéliser « nombre de festivals participés » et « avoir un lutin de l'équipe X » pour supprimer les derniers
  prérequis `manual`.
- Réinitialisation du mot de passe (nécessiterait l'envoi d'e-mails, exclu pour l'instant).
- Vérifier en jeu le premier jour de la semaine et mettre à jour `calendar.json` (`firstWeekday`).
