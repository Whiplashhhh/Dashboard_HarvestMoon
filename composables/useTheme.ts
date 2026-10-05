import type { Season } from '#shared/schemas'

export type Daytime = 'dawn' | 'day' | 'dusk' | 'night'

/** Moment de la journée d'après l'heure réelle de l'appareil. */
export function daytimeFromHour(hour: number): Daytime {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'dusk'
  return 'night'
}

/** Saison du thème : saison forcée dans les réglages, sinon celle de la partie, sinon le printemps. */
export function useThemeSeason() {
  const settings = useSettings()
  const gameSeason = useState<Season | null>('game-season', () => null)
  return computed<Season>(() => settings.value.forcedSeason ?? gameSeason.value ?? 'spring')
}

export function useDaytime() {
  return useState<Daytime>('daytime', () => 'day')
}
