import { describe, expect, it } from 'vitest'
import { buildGameData, spriteObjectiveId as sid } from '../../shared/data/game'
import {
  addDays,
  dayNumber,
  daysUntil,
  evaluateAll,
  evaluateObjective,
  formatGameDate,
  ObjectiveIndex,
  suggest,
  upcomingEvents,
  weekdayOf,
  type PlayerState,
} from '../../shared/engine'
import type { GameDate } from '../../shared/schemas'
import { miniGame } from '../fixtures/mini-game'

const game = buildGameData(miniGame())
const index = new ObjectiveIndex(game)
const spring = (day: number, year = 1): GameDate => ({ year, season: 'spring', day })
const state = (over: Partial<PlayerState> = {}): PlayerState => ({
  date: spring(1),
  completed: new Set(),
  ...over,
})
const byId = (id: string) => game.objectives.find((o) => o.id === id)!

describe('calendrier du jeu', () => {
  it('numérote les jours et sait avancer dans le temps', () => {
    expect(dayNumber(spring(1))).toBe(0)
    expect(dayNumber({ year: 2, season: 'summer', day: 3 })).toBe(120 + 30 + 2)
    expect(addDays({ year: 1, season: 'winter', day: 30 }, 1)).toEqual(spring(1, 2))
    expect(addDays(spring(1), -5)).toEqual(spring(1))
  })

  it('calcule les jours jusqu’à la prochaine occurrence, en passant l’année', () => {
    expect(daysUntil(spring(5), { season: 'spring', day: 8 })).toBe(3)
    expect(daysUntil(spring(8), { season: 'spring', day: 8 })).toBe(0)
    expect(daysUntil(spring(9), { season: 'spring', day: 8 })).toBe(119)
    expect(daysUntil({ year: 1, season: 'winter', day: 29 }, { season: 'spring', day: 1 })).toBe(2)
  })

  it('donne le jour de la semaine à partir du premier jour de l’an 1', () => {
    expect(weekdayOf(spring(1), 'monday')).toBe('monday')
    expect(weekdayOf(spring(8), 'monday')).toBe('monday')
    expect(weekdayOf(spring(3), 'saturday')).toBe('monday')
  })

  it('formate une date en français', () => {
    expect(formatGameDate({ year: 2, season: 'summer', day: 12 })).toBe('12 Été, an 2')
  })
})

describe('évaluation des objectifs', () => {
  it('un objectif sans prérequis est disponible, un accompli est marqué accompli', () => {
    expect(evaluateObjective(index, state(), byId(sid('leader-0'))).status).toBe('available')
    const done = state({ completed: new Set([sid('leader-0')]) })
    expect(evaluateObjective(index, done, byId(sid('leader-0'))).status).toBe('completed')
  })

  it('liste ce qui manque à un objectif verrouillé, avec un lien vers l’objectif requis', () => {
    const evaluation = evaluateObjective(index, state(), byId(sid('leader-1')))
    expect(evaluation.status).toBe('locked')
    expect(evaluation.missing).toEqual([
      expect.objectContaining({ objectiveId: sid('leader-0'), label: 'Débloquer le lutin Leader 0' }),
    ])
  })

  it('compte les lutins manquants pour un palier', () => {
    const completed = new Set([sid('leader-0'), sid('leader-1')])
    const evaluation = evaluateObjective(index, state({ completed }), byId('deesse-restore'))
    expect(evaluation.status).toBe('locked')
    expect(evaluation.missing[0]!.label).toBe('Encore 3 lutins à trouver (5 requis)')
    const five = new Set([0, 1, 2, 3, 4].map((i) => sid(`leader-${i}`)))
    expect(evaluateObjective(index, state({ completed: five }), byId('deesse-restore')).status).toBe(
      'available',
    )
  })

  it('vérifie l’année minimale et garde les conditions manuelles comme non bloquantes', () => {
    const coop = byId('batiments-coop')
    const year1 = evaluateObjective(index, state(), coop)
    expect(year1.status).toBe('locked')
    expect(year1.missing[0]!.label).toBe("À partir de l'an 2")
    const year2 = evaluateObjective(index, state({ date: spring(1, 2) }), coop)
    expect(year2.status).toBe('available')
    expect(year2.manual).toEqual(['Avoir 5000 G'])
  })

  it('respecte les saisons : hors saison, l’objectif est consultable mais pas disponible', () => {
    const completed = new Set([sid('leader-0')])
    const summerOnly = byId(sid('leader-5'))
    expect(evaluateObjective(index, state({ completed }), summerOnly).status).toBe('out-of-season')
    const summer = state({ completed, date: { year: 1, season: 'summer', day: 2 } })
    expect(evaluateObjective(index, summer, summerOnly).status).toBe('available')
  })

  it('un objectif daté n’est disponible que si la date tombe dans la saison en cours', () => {
    const completed = new Set([sid('leader-0')])
    const dated = byId(sid('leader-6')) // le 8 printemps
    const before = evaluateObjective(index, state({ completed, date: spring(5) }), dated)
    expect(before).toMatchObject({ status: 'available', nextDateInDays: 3 })
    const after = evaluateObjective(index, state({ completed, date: spring(9) }), dated)
    expect(after).toMatchObject({ status: 'out-of-season', nextDateInDays: 119 })
  })

  it('évalue tous les objectifs', () => {
    const all = evaluateAll(game, state())
    expect(all).toHaveLength(game.objectives.length)
    expect(all.filter((e) => e.status === 'available').map((e) => e.objective.id)).toEqual([sid('leader-0')])
  })
})

describe('suggestions « Que faire maintenant ? »', () => {
  const afterStart = new Set([sid('leader-0')])

  it('ne propose que des objectifs disponibles', () => {
    const ids = suggest(game, state({ completed: afterStart })).map((s) => s.objective.id)
    expect(ids).not.toContain(sid('leader-0')) // accompli
    expect(ids).not.toContain(sid('leader-5')) // été seulement
    expect(ids).not.toContain('deesse-restore') // verrouillé
    expect(ids).toContain(sid('leader-1'))
  })

  it('place l’objectif épinglé en premier', () => {
    const [first] = suggest(game, state({ completed: afterStart, pinnedId: sid('leader-9') }))
    expect(first!.objective.id).toBe(sid('leader-9'))
    expect(first!.reasons[0]!.text).toBe('Ton objectif épinglé')
  })

  it('fait remonter un objectif daté imminent, avec une raison lisible', () => {
    const [first] = suggest(game, state({ completed: afterStart, date: spring(6) }))
    expect(first!.objective.id).toBe(sid('leader-6'))
    expect(first!.reasons.map((r) => r.text)).toContain("C'est possible dans 2 jours")
  })

  it('signale les objectifs faisables uniquement cette saison et la fin de saison', () => {
    const summer = state({ completed: afterStart, date: { year: 1, season: 'summer', day: 26 } })
    const summerOnly = suggest(game, summer).find((s) => s.objective.id === sid('leader-5'))!
    expect(summerOnly.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining(['season-only', 'season-ending']),
    )
    expect(summerOnly.reasons.find((r) => r.code === 'season-ending')!.text).toBe(
      'Plus que 4 jours dans la saison',
    )
  })

  it('met en avant les lutins tant que la Déesse n’est pas restaurée', () => {
    const suggestion = suggest(game, state({ completed: afterStart })).find(
      (s) => s.objective.id === sid('leader-1'),
    )!
    expect(suggestion.reasons.map((r) => r.code)).toContain('goddess')
  })

  it('valorise ce qui débloque d’autres objectifs', () => {
    const five = new Set([0, 1, 2, 3, 4].map((i) => sid(`leader-${i}`)))
    const restore = suggest(game, state({ completed: five })).find(
      (s) => s.objective.id === 'deesse-restore',
    )!
    expect(restore.reasons.map((r) => r.text)).toEqual(
      expect.arrayContaining(['Débloque 1 autre objectif', 'Un grand jalon de ta partie']),
    )
  })

  it('fait remonter un objectif déjà commencé et respecte la limite', () => {
    const list = suggest(game, state({ completed: afterStart, started: new Set([sid('leader-8')]) }), {
      limit: 3,
    })
    expect(list).toHaveLength(3)
    expect(list[0]!.objective.id).toBe(sid('leader-8'))
  })

  it('est déterministe à score égal (ordre alphabétique)', () => {
    const a = suggest(game, state({ completed: afterStart })).map((s) => s.objective.id)
    const b = suggest(game, state({ completed: afterStart })).map((s) => s.objective.id)
    expect(a).toEqual(b)
  })
})

describe('événements à venir', () => {
  it('liste festivals et anniversaires dans l’horizon, triés', () => {
    expect(upcomingEvents(game, spring(1), 7)).toEqual([
      expect.objectContaining({ kind: 'birthday', id: 'celia', inDays: 2 }),
    ])
    const events = upcomingEvents(game, spring(15), 7)
    expect(events).toEqual([expect.objectContaining({ kind: 'festival', id: 'flower-festival', inDays: 3 })])
  })
})
