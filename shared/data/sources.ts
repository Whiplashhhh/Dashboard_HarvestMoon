/**
 * Import statique des fichiers JSON de `data/` (embarqués dans le bundle serveur).
 * Pour ajouter un fichier d'objectifs : l'importer ici et l'ajouter à `objectives`.
 */
import teams from '../../data/teams.json'
import sprites from '../../data/sprites.json'
import characters from '../../data/characters.json'
import festivals from '../../data/festivals.json'
import calendar from '../../data/calendar.json'
import buildings from '../../data/buildings.json'
import tools from '../../data/tools.json'
import recipes from '../../data/recipes.json'
import mines from '../../data/mines.json'
import deesse from '../../data/objectives/deesse.json'
import ferme from '../../data/objectives/ferme.json'
import social from '../../data/objectives/social.json'
import recettes from '../../data/objectives/recettes.json'
import { buildGameData, type GameData, type RawGameData } from './game'

export const rawGameData: RawGameData = {
  teams,
  sprites,
  objectives: {
    'deesse.json': deesse,
    'ferme.json': ferme,
    'social.json': social,
    'recettes.json': recettes,
  },
  characters,
  festivals,
  calendar,
  buildings,
  tools,
  recipes,
  mines,
}

let cached: GameData | null = null

/** Données du jeu validées (mises en cache après la première validation). */
export function loadGameData(): GameData {
  cached ??= buildGameData(rawGameData)
  return cached
}
