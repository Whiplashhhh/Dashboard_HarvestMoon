import { describe, expect, it } from 'vitest'
import { buildGameData, checkIntegrity, GODDESS_SPRITES, TOTAL_SPRITES } from '../../shared/data/game'
import { rawGameData } from '../../shared/data/sources'

describe('données du jeu (data/*.json)', () => {
  const game = buildGameData(rawGameData)

  it('chaque fichier respecte son schéma et l’intégrité référentielle est assurée', () => {
    expect(checkIntegrity(game)).toEqual([])
  })

  it('contient les 101 lutins répartis en 10 équipes, chacune avec un chef', () => {
    expect(game.sprites).toHaveLength(TOTAL_SPRITES)
    expect(game.teams).toHaveLength(10)
    for (const team of game.teams) {
      expect(game.sprites.filter((s) => s.teamId === team.id && s.isLeader)).toHaveLength(1)
    }
  })

  it('contient le jalon majeur des 60 lutins (restauration de la Déesse)', () => {
    const milestone = game.objectives.find(
      (o) => o.milestone && o.prerequisites.some((p) => p.type === 'spriteCount' && p.min === GODDESS_SPRITES),
    )
    expect(milestone?.category).toBe('deesse')
  })

  it('chaque objectif a au moins une méthode avec des étapes, et des sources', () => {
    for (const objective of game.objectives) {
      expect(objective.methods.length, objective.id).toBeGreaterThan(0)
      expect(objective.sources.length, objective.id).toBeGreaterThan(0)
    }
  })

  it('les sources pointent vers des sites connus (wiki Fandom, Fogu…)', () => {
    const allowed = /^https:\/\/(harvestmoon\.fandom\.com|fogu\.com|www\.fogu\.com|gamefaqs\.gamespot\.com|www\.gamerevolution\.com)\//
    const all = [
      ...game.objectives,
      ...game.sprites,
      ...game.characters,
      ...game.festivals,
      ...game.buildings,
      ...game.tools,
      ...game.recipes,
    ].flatMap((entry) => entry.sources)
    expect(all.filter((url) => !allowed.test(url))).toEqual([])
  })

  it('n’utilise pas de prérequis « manual » quand un objectif équivalent existe déjà', () => {
    const titles = new Set(game.objectives.map((o) => o.title.toLowerCase()))
    const redundant = game.objectives.flatMap((o) =>
      o.prerequisites.filter((p) => p.type === 'manual' && titles.has(p.label.toLowerCase())).map(() => o.id),
    )
    expect(redundant).toEqual([])
  })
})
