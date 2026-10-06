/** Génère les icônes PNG de la PWA à partir de public/icons/icon.svg (rendu via Chromium/Playwright). */
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile('public/icons/icon.svg', 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()
const targets: [string, number, boolean][] = [
  ['public/icons/icon-192.png', 192, false],
  ['public/icons/icon-512.png', 512, false],
  ['public/icons/maskable-512.png', 512, true],
  ['public/apple-touch-icon.png', 180, false],
  ['public/favicon-32.png', 32, false],
]
for (const [file, size, maskable] of targets) {
  await page.setViewportSize({ width: size, height: size })
  const inner = maskable ? Math.round(size * 0.8) : size
  await page.setContent(
    `<html><body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${maskable ? '#8fd3f4' : 'transparent'}">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </body></html>`,
  )
  await writeFile(file, await page.screenshot({ omitBackground: !maskable }))
  console.log(`✓ ${file}`)
}
await browser.close()
