import { describe, expect, it } from 'vitest'
import { elapsedSince, normalizeSearch, sourceLabel } from '../../utils/text'

describe('utilitaires de texte', () => {
  it('normalise sans accents ni majuscules', () => {
    expect(normalizeSearch('  Été Déesse ')).toBe('ete deesse')
  })
  it('formate le temps écoulé', () => {
    const now = new Date('2026-10-06T12:00:00Z')
    expect(elapsedSince('2026-10-06T08:00:00Z', now).label).toBe("aujourd'hui")
    expect(elapsedSince('2026-10-05T08:00:00Z', now).label).toBe('hier')
    expect(elapsedSince('2026-09-24T12:00:00Z', now)).toEqual({ days: 12, label: 'il y a 12 jours' })
    expect(elapsedSince('2026-06-01T12:00:00Z', now).label).toBe('il y a 4 mois')
  })
  it('donne un libellé lisible aux sources', () => {
    expect(sourceLabel('https://harvestmoon.fandom.com/wiki/Harvest_Sprites_(DS)')).toBe(
      'Wiki — Harvest Sprites (DS)',
    )
    expect(sourceLabel('https://fogu.com/hm6/chan3/sprites/index.php')).toBe('Fogu — hm6/chan3/sprites/index')
  })
})

describe('frenchSpacing', () => {
  it('insère des espaces insécables dans la ponctuation double', async () => {
    const { frenchSpacing } = await import('../../utils/text')
    expect(frenchSpacing('Bonjour, Lili ! Ça va ? « Oui »')).toBe(
      'Bonjour, Lili\u00a0! Ça va\u00a0? «\u00a0Oui\u00a0»',
    )
  })
})
