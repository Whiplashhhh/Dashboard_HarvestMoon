#!/usr/bin/env bash
# Régénère le jeu de captures final de docs/screenshots/ (serveur lancé + compte demo requis).
# Usage : BASE_URL=http://localhost:3000 bash scripts/screenshots-final.sh
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
LOGIN="${LOGIN:-demo:Tournesol-Lumineux-42}"
export BASE_URL
run() { npx tsx scripts/screenshots.ts "$@" --format=jpeg; }

run /connexion /inscription --out=docs/screenshots --seasons=spring --daytime=day --viewport-only
run / /objectifs /objectifs/sprite-venus /lutins /calendrier /carnet /recettes /compte \
  --out=docs/screenshots --seasons=spring --daytime=day --viewport-only --login="$LOGIN"
run / --out=docs/screenshots --seasons=summer,autumn,winter --sizes=1440x900,390x844 --daytime=day \
  --viewport-only --login="$LOGIN"
run / --out=docs/screenshots/pages-entieres --seasons=spring --sizes=1440x900,390x844 --daytime=day --login="$LOGIN"
run / --out=docs/screenshots/nuit --seasons=winter,summer --sizes=1440x900 --daytime=night --viewport-only \
  --login="$LOGIN"
