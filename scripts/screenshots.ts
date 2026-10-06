/**
 * Boucle d'auto-critique visuelle : captures de chaque écran, sur 6 tailles et pour les 4 saisons.
 *
 * Usage : BASE_URL=http://localhost:3000 npm run screenshots -- /styleguide /objectifs
 *   Options : --out=docs/screenshots  --sizes=360x740,1440x900  --seasons=spring,winter  --login=demo:motdepasse
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const option = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const routes = args.filter((a) => !a.startsWith('--'))
const base = process.env.BASE_URL ?? 'http://localhost:3000'
const out = option('out') ?? 'docs/screenshots/_work'
const sizes = (option('sizes') ?? '360x740,390x844,768x1024,1024x768,1440x900,1920x1080').split(',')
const seasons = (option('seasons') ?? 'spring,summer,autumn,winter').split(',')
const login = option('login')
const daytime = option('daytime')
const fullPage = !args.includes('--viewport-only')
const jpeg = option('format') === 'jpeg'

const browser = await chromium.launch()
await mkdir(out, { recursive: true })

for (const season of seasons) {
  const context = await browser.newContext({ locale: 'fr-FR', reducedMotion: 'reduce' })
  const forceSeason = () =>
    context.addCookies([
      {
        name: 'carnet-settings',
        value: encodeURIComponent(
          JSON.stringify({ sounds: false, reducedMotion: false, forcedSeason: season }),
        ),
        url: base,
      },
    ])
  await forceSeason()
  if (daytime) {
    const hours: Record<string, number> = { dawn: 6, day: 12, dusk: 19, night: 23 }
    await context.addInitScript(`{
      const RealDate = Date
      const fixed = new RealDate(); fixed.setHours(${hours[daytime] ?? 12}, 0, 0, 0)
      globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [fixed.getTime()])) } static now() { return fixed.getTime() } }
    }`)
  }
  const page = await context.newPage()
  if (login) {
    const [username, password] = login.split(':')
    await page.goto(`${base}/connexion`, { waitUntil: 'networkidle' })
    await page.getByLabel("Nom d'utilisateur").fill(username!)
    await page.getByLabel('Mot de passe').fill(password!)
    await page.getByRole('button', { name: /entrer|connexion|ouvrir/i }).click()
    await page.waitForFunction(() => !location.pathname.startsWith('/connexion'))
    // Les réglages du compte font foi : on y enregistre la saison voulue pour la capture.
    await page.evaluate(async (forcedSeason) => {
      const csrf = document.cookie.match(/(?:^|;\s*)(?:__Host-)?carnet_csrf=([^;]+)/)?.[1] ?? ''
      await fetch('/api/account/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': decodeURIComponent(csrf) },
        body: JSON.stringify({ sounds: false, reducedMotion: false, forcedSeason }),
      })
    }, season)
    await forceSeason()
  }
  for (const route of routes) {
    for (const size of sizes) {
      const [width, height] = size.split('x').map(Number) as [number, number]
      await page.setViewportSize({ width, height })
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(900)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      const name = `${route.replace(/\//g, '_').replace(/^_/, '') || 'accueil'}--${season}--${size}.${jpeg ? 'jpg' : 'png'}`
      await page.screenshot({
        path: join(out, name),
        fullPage,
        ...(jpeg ? { type: 'jpeg' as const, quality: 78 } : {}),
      })
      console.log(`${overflow ? '⚠ débordement horizontal ' : '✓ '}${name}`)
    }
  }
  await context.close()
}
await browser.close()
