import { describe, expect, it } from 'vitest'
import { gridToLayers, PIXEL_ICONS, PIXEL_PALETTE } from '../../utils/pixel-icons'

describe('icônes pixel-art', () => {
  it.each(Object.entries(PIXEL_ICONS))(
    '%s est une grille 12×12 qui n’utilise que la palette',
    (_name, grid) => {
      expect(grid).toHaveLength(12)
      for (const row of grid) {
        expect(row).toHaveLength(12)
        for (const char of row) expect(char === '.' || char in PIXEL_PALETTE).toBe(true)
      }
    },
  )

  it('fusionne les pixels contigus de même couleur', () => {
    const layers = gridToLayers(['kkk.', '..rr'])
    expect(layers).toEqual([
      { color: PIXEL_PALETTE.k, d: 'M0 0h3v1h-3z' },
      { color: PIXEL_PALETTE.r, d: 'M2 1h2v1h-2z' },
    ])
  })
})
