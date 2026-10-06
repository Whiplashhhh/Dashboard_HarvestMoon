import { describe, expect, it } from 'vitest'
import { DAYS_PER_SEASON, SEASONS } from '../../shared/schemas'
import { weatherFor } from '../../utils/weather'

describe('météo décorative', () => {
  it('est déterministe et cohérente avec la saison', () => {
    const counts: Record<string, number> = {}
    for (const season of SEASONS)
      for (let day = 1; day <= DAYS_PER_SEASON; day++) {
        const date = { year: 2, season, day }
        const weather = weatherFor(date)
        expect(weatherFor(date)).toBe(weather)
        if (season === 'winter') expect(weather).not.toBe('rain')
        else expect(weather).not.toBe('snow')
        counts[weather] = (counts[weather] ?? 0) + 1
      }
    // Le beau temps domine, mais toutes les météos apparaissent sur une année.
    expect(counts.sunny).toBeGreaterThan(60)
    for (const w of ['cloudy', 'rain', 'snow']) expect(counts[w]).toBeGreaterThan(0)
  })
})
