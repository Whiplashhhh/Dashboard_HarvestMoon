import type { GameDate } from '#shared/schemas'

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'snow'

/**
 * Météo purement décorative, déterministe pour une date du jeu (la même date donne toujours le même temps).
 * Elle n'imite pas la météo réelle du jeu, qu'on ne peut pas prévoir.
 */
export function weatherFor(date: GameDate): Weather {
  let hash =
    date.year * 7919 + ['spring', 'summer', 'autumn', 'winter'].indexOf(date.season) * 131 + date.day * 31
  hash = Math.abs((hash ^ (hash >>> 7)) * 2654435761) % 100
  if (date.season === 'winter') return hash < 30 ? 'snow' : hash < 50 ? 'cloudy' : 'sunny'
  if (date.season === 'summer') return hash < 10 ? 'rain' : hash < 25 ? 'cloudy' : 'sunny'
  return hash < 18 ? 'rain' : hash < 38 ? 'cloudy' : 'sunny'
}

export const WEATHER_LABELS: Record<Weather, string> = {
  sunny: 'Beau temps',
  cloudy: 'Nuageux',
  rain: 'Pluie',
  snow: 'Neige',
}
