import { describe, expect, it } from 'vitest'
import { buildGameData, findCycles, GameDataError, spriteObjectiveId } from '../../shared/data/game'
import { miniGame } from '../fixtures/mini-game'

describe('buildGameData', () => {
  it('valide un jeu de données correct et génère un objectif par lutin', () => {
    const game = buildGameData(miniGame())
    expect(game.sprites).toHaveLength(10)
    const venus = game.objectives.find((o) => o.id === spriteObjectiveId('leader-3'))
    expect(venus).toMatchObject({
      category: 'lutins',
      title: 'Débloquer le lutin Leader 3',
      onboarding: true,
    })
    expect(game.objectives).toHaveLength(13)
  })

  it('rejette un fichier qui ne respecte pas son schéma, avec un message lisible', () => {
    const raw = miniGame()
    ;(raw.sprites as Record<string, unknown>[])[0]!.difficulty = 4
    expect(() => buildGameData(raw)).toThrowError(/sprites\.json › 0\.difficulty/)
  })

  it('détecte un prérequis vers un objectif inexistant', () => {
    const raw = miniGame()
    raw.objectives['ferme.json']!.push({
      ...(raw.objectives['ferme.json']![0] as object),
      id: 'batiments-barn',
      prerequisites: [{ type: 'objective', id: 'nexiste-pas' }],
    })
    expect(() => buildGameData(raw)).toThrowError(/objectif inconnu « nexiste-pas »/)
  })

  it('détecte un id en double', () => {
    const raw = miniGame()
    raw.objectives['ferme.json']!.push(raw.objectives['ferme.json']![0])
    expect(() => buildGameData(raw)).toThrowError(GameDataError)
  })

  it('détecte un chef d’équipe incohérent', () => {
    const raw = miniGame()
    ;(raw.sprites as Record<string, unknown>[])[1]!.isLeader = false
    expect(() => buildGameData(raw)).toThrowError(/n'est pas marqué chef/)
  })
})

describe('findCycles', () => {
  it('trouve un cycle, y compris via un prérequis « lutin »', () => {
    const game = buildGameData(miniGame())
    // sprite-leader-0 → deesse-after → deesse-restore → (lutin) leader-0
    const looped = game.objectives.map((o) => {
      if (o.id === spriteObjectiveId('leader-0'))
        return { ...o, prerequisites: [{ type: 'objective' as const, id: 'deesse-after' }] }
      if (o.id === 'deesse-restore')
        return { ...o, prerequisites: [{ type: 'sprite' as const, id: 'leader-0' }] }
      return o
    })
    const cycles = findCycles(looped)
    expect(cycles.length).toBeGreaterThan(0)
    expect(cycles[0]).toContain('sprite-leader-0')
  })

  it('ne signale rien sur un graphe acyclique', () => {
    expect(findCycles(buildGameData(miniGame()).objectives)).toEqual([])
  })
})
