import type { PixelIconName } from '~/utils/pixel-icons'

export interface NavItem {
  to: string
  label: string
  icon: PixelIconName
}

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Ferme', icon: 'farm' },
  { to: '/objectifs', label: 'Objectifs', icon: 'objectives' },
  { to: '/lutins', label: 'Lutins', icon: 'sprite' },
  { to: '/calendrier', label: 'Calendrier', icon: 'calendar' },
  { to: '/carnet', label: 'Carnet', icon: 'notebook' },
]

export const MORE_NAV: NavItem[] = [
  { to: '/recettes', label: 'Recettes', icon: 'recipe' },
  { to: '/compte', label: 'Mon compte', icon: 'account' },
  { to: '/reglages', label: 'Réglages', icon: 'settings' },
  { to: '/credits', label: 'Crédits & sources', icon: 'book' },
]

export function isActive(currentPath: string, to: string): boolean {
  return to === '/' ? currentPath === '/' : currentPath === to || currentPath.startsWith(`${to}/`)
}
