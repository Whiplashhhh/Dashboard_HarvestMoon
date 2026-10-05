import type { GameData } from '../data/game'
import type { GameDate } from '../schemas'
import { daysUntil } from './calendar'

export type UpcomingEvent =
  | {
      kind: 'festival'
      id: string
      name: string
      inDays: number
      season: GameDate['season']
      day: number
      objectiveId?: string
    }
  | {
      kind: 'birthday'
      id: string
      name: string
      inDays: number
      season: GameDate['season']
      day: number
      bachelorette: boolean
    }

/** Festivals et anniversaires dans les `horizon` prochains jours du jeu (aujourd'hui inclus), triés par date. */
export function upcomingEvents(game: GameData, date: GameDate, horizon = 7): UpcomingEvent[] {
  const events: UpcomingEvent[] = []
  for (const festival of game.festivals) {
    if (festival.euUnavailable) continue
    const inDays = daysUntil(date, festival)
    if (inDays <= horizon)
      events.push({
        kind: 'festival',
        id: festival.id,
        name: festival.nameFr ?? festival.name,
        inDays,
        season: festival.season,
        day: festival.day,
        ...(festival.objectiveId ? { objectiveId: festival.objectiveId } : {}),
      })
  }
  for (const character of game.characters) {
    if (!character.birthday || character.euUnavailable) continue
    const inDays = daysUntil(date, character.birthday)
    if (inDays <= horizon)
      events.push({
        kind: 'birthday',
        id: character.id,
        name: character.nameFr ?? character.name,
        inDays,
        season: character.birthday.season,
        day: character.birthday.day,
        bachelorette: character.bachelorette,
      })
  }
  return events.sort(
    (a, b) => a.inDays - b.inDays || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
  )
}
