import type { ObjectiveCategory } from '#shared/schemas'
import type { PixelIconName } from './pixel-icons'

export const CATEGORY_ICONS: Record<ObjectiveCategory, PixelIconName> = {
  lutins: 'sprite',
  deesse: 'goddess',
  mariage: 'ring',
  ferme: 'farm',
  batiments: 'house',
  outils: 'hammer',
  animaux: 'chicken',
  cultures: 'turnip',
  mine: 'pickaxe',
  festivals: 'flag',
  recettes: 'recipe',
  amitie: 'heart',
  argent: 'moneybag',
}

export const STATUS_LABELS = {
  available: 'Disponible',
  'out-of-season': 'Pas cette saison',
  locked: 'Verrouillé',
  completed: 'Accompli',
} as const
