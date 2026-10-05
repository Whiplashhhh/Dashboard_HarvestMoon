import {
  DAYS_PER_SEASON,
  SEASON_LABELS,
  SEASONS,
  WEEKDAYS,
  type GameDate,
  type Season,
  type SeasonDay,
  type Weekday,
} from '../schemas'

export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length

/** Numéro absolu du jour depuis le 1er printemps de l'an 1 (0-indexé). */
export function dayNumber(date: GameDate): number {
  return (date.year - 1) * DAYS_PER_YEAR + SEASONS.indexOf(date.season) * DAYS_PER_SEASON + (date.day - 1)
}

export function fromDayNumber(n: number): GameDate {
  const year = Math.floor(n / DAYS_PER_YEAR) + 1
  const inYear = n % DAYS_PER_YEAR
  return {
    year,
    season: SEASONS[Math.floor(inYear / DAYS_PER_SEASON)]!,
    day: (inYear % DAYS_PER_SEASON) + 1,
  }
}

export function addDays(date: GameDate, days: number): GameDate {
  return fromDayNumber(Math.max(0, dayNumber(date) + days))
}

/** Nombre de jours jusqu'à la prochaine occurrence d'un jour de l'année (0 = aujourd'hui). */
export function daysUntil(from: GameDate, target: SeasonDay): number {
  const today = dayNumber({ ...from, year: 1 })
  const then = dayNumber({ year: 1, ...target })
  return (then - today + DAYS_PER_YEAR) % DAYS_PER_YEAR
}

/** Jours restants dans la saison en cours, aujourd'hui exclu. */
export function daysLeftInSeason(date: GameDate): number {
  return DAYS_PER_SEASON - date.day
}

export function weekdayOf(date: GameDate, firstWeekday: Weekday): Weekday {
  const offset = WEEKDAYS.indexOf(firstWeekday)
  return WEEKDAYS[(offset + dayNumber(date)) % WEEKDAYS.length]!
}

export function nextSeason(season: Season): Season {
  return SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length]!
}

/** « 12 Printemps, an 2 » */
export function formatGameDate(date: GameDate): string {
  return `${date.day} ${SEASON_LABELS[date.season]}, an ${date.year}`
}

/** « 12 printemps » */
export function formatSeasonDay(date: SeasonDay): string {
  return `${date.day} ${SEASON_LABELS[date.season].toLowerCase()}`
}

/** « aujourd'hui », « demain », « dans 3 jours » */
export function formatIn(days: number): string {
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'demain'
  return `dans ${days} jours`
}
