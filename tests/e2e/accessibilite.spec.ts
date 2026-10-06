import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const password = 'Les-Vaches-Adorent-Le-Foin-7'

/** Audit axe-core (WCAG 2.x A/AA) des écrans principaux, dans les 4 thèmes de saison. */
test.describe('accessibilité (axe-core)', () => {
  test.skip(({ isMobile }) => isMobile, 'Un seul passage suffit (ordinateur)')

  test('pages publiques et pages connectées, sans violation sérieuse', async ({ page, context, baseURL }) => {
    test.setTimeout(300_000)
    const audit = async (label: string) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(
        serious.map(
          (v) =>
            `${label} › ${v.id} : ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 3)
              .join(' | ')}`,
        ),
      ).toEqual([])
    }

    await page.goto('/connexion')
    await audit('connexion')

    await page.goto('/inscription')
    await page.getByLabel("Nom d'utilisateur").fill(`axe${Date.now().toString(36)}`)
    await page.getByLabel('Mot de passe', { exact: true }).fill(password)
    await page.getByLabel('Confirme le mot de passe').fill(password)
    await page.getByRole('button', { name: 'Créer mon carnet' }).click()
    await expect(page).toHaveURL(/\/bienvenue$/)
    await audit('bienvenue')
    await page.getByLabel('Nom du fermier').fill('Lili')
    await page.getByLabel('Nom de la ferme').fill('Les Tournesols')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: /C'est parti/ }).click()
    await expect(page).toHaveURL(/\/$/)

    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      await context.addCookies([
        {
          name: 'carnet-settings',
          value: encodeURIComponent(
            JSON.stringify({ sounds: false, reducedMotion: true, forcedSeason: season }),
          ),
          url: baseURL!,
        },
      ])
      await page.evaluate(async (forcedSeason) => {
        const csrf = document.cookie.match(/(?:^|;\s*)(?:__Host-)?carnet_csrf=([^;]+)/)?.[1] ?? ''
        await fetch('/api/account/settings', {
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-csrf-token': decodeURIComponent(csrf) },
          body: JSON.stringify({ sounds: false, reducedMotion: true, forcedSeason }),
        })
      }, season)
      for (const route of [
        '/',
        '/objectifs',
        '/objectifs/sprite-venus',
        '/lutins',
        '/calendrier',
        '/carnet',
        '/recettes',
        '/compte',
        '/reglages',
      ]) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await audit(`${season} ${route}`)
      }
    }
  })
})
