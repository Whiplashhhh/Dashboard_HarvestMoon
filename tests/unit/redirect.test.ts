import { describe, expect, it } from 'vitest'
import { safeRedirect } from '../../utils/redirect'

describe('safeRedirect', () => {
  it.each(['/objectifs', '/objectifs/sprite-venus?x=1', '/'])('accepte le chemin interne %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })
  it.each([
    '//evil.com',
    '/\\evil.com',
    '/ /evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    '',
    undefined,
    ['/a'],
  ])('refuse %s', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})
