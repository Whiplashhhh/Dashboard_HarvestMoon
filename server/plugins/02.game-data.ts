import { loadGameData } from '#shared/data/sources'

/** Valide les données du jeu au démarrage : un fichier invalide empêche le serveur de démarrer. */
export default defineNitroPlugin(() => {
  const game = loadGameData()
  console.info(`[données] ${game.objectives.length} objectifs, ${game.sprites.length} lutins chargés`)
})
