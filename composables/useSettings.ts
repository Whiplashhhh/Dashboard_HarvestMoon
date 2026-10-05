import type { Season } from '#shared/schemas'

export interface UserSettings {
  /** Retours sonores WebAudio (désactivés par défaut). */
  sounds: boolean
  /** Réduire les animations (en plus de prefers-reduced-motion). */
  reducedMotion: boolean
  /** Saison imposée au thème (sinon : saison de la partie). */
  forcedSeason: Season | null
}

export const DEFAULT_SETTINGS: UserSettings = { sounds: false, reducedMotion: false, forcedSeason: null }

/**
 * Réglages de l'utilisatrice. Conservés dans un cookie non sensible (lisible au rendu serveur, donc pas de
 * « flash » de thème) et synchronisés avec le compte une fois connectée.
 */
export function useSettings() {
  return useCookie<UserSettings>('carnet-settings', {
    default: () => ({ ...DEFAULT_SETTINGS }),
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    watch: 'shallow',
  })
}

/** Vrai si les animations doivent être réduites (réglage ou préférence système). */
export function useReducedMotion() {
  const settings = useSettings()
  const systemPrefers = useState('system-reduced-motion', () => false)
  if (import.meta.client) {
    onMounted(() => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      systemPrefers.value = query.matches
      query.addEventListener('change', (event) => (systemPrefers.value = event.matches))
    })
  }
  return computed(() => settings.value.reducedMotion || systemPrefers.value)
}
