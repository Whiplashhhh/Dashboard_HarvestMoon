/**
 * Récupère le wikitext brut de pages du wiki Harvest Moon (Fandom) via l'API MediaWiki
 * et le met en cache dans `data/raw/`, pour que la base de connaissances soit reproductible.
 *
 * Usage :
 *   npm run data:fetch                     # pages de scripts/wiki-pages.txt + pages déjà en cache (si absentes)
 *   npm run data:fetch -- --force          # re-télécharge tout
 *   npm run data:fetch -- "Harvest Moon DS" "Harvest Sprites (DS)"
 *
 * Politesse : une requête à la fois, délai entre chaque, User-Agent explicite.
 * Le contenu Fandom est sous licence CC BY-SA 3.0 (voir la page Crédits & sources du site).
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const API = 'https://harvestmoon.fandom.com/api.php'
const WIKI = 'https://harvestmoon.fandom.com/wiki/'
const RAW_DIR = join(import.meta.dirname, '..', 'data', 'raw')
const PAGE_LIST = join(import.meta.dirname, 'wiki-pages.txt')
const DELAY_MS = 1500
const USER_AGENT =
  'CarnetDeLaFerme/0.1 (site de fan non officiel ; https://github.com/Whiplashhhh/Dashboard_HarvestMoon)'

export interface RawWikiPage {
  title: string
  url: string
  revid: number
  fetchedAt: string
  license: 'CC BY-SA 3.0'
  wikitext: string
}

export function pageFileName(title: string): string {
  return (
    title
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') + '.json'
  )
}

export function pageUrl(title: string): string {
  return WIKI + encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPage(title: string): Promise<RawWikiPage> {
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'wikitext|revid',
    redirects: '1',
    format: 'json',
    formatversion: '2',
  })
  const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`HTTP ${response.status} pour « ${title} »`)
  const body = (await response.json()) as {
    parse?: { title: string; revid: number; wikitext: string }
    error?: { info: string }
  }
  if (!body.parse) throw new Error(`« ${title} » : ${body.error?.info ?? 'réponse inattendue'}`)
  return {
    title: body.parse.title,
    url: pageUrl(body.parse.title),
    revid: body.parse.revid,
    fetchedAt: new Date().toISOString(),
    license: 'CC BY-SA 3.0',
    wikitext: body.parse.wikitext,
  }
}

async function cachedTitles(): Promise<string[]> {
  if (!existsSync(RAW_DIR)) return []
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith('.json'))
  const titles = await Promise.all(
    files.map(async (f) => (JSON.parse(await readFile(join(RAW_DIR, f), 'utf8')) as RawWikiPage).title),
  )
  return titles
}

async function listedTitles(): Promise<string[]> {
  if (!existsSync(PAGE_LIST)) return []
  return (await readFile(PAGE_LIST, 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const explicit = args.filter((a) => !a.startsWith('--'))
  const titles =
    explicit.length > 0 ? explicit : [...new Set([...(await listedTitles()), ...(await cachedTitles())])]

  await mkdir(RAW_DIR, { recursive: true })
  let fetched = 0
  let failures = 0
  for (const title of titles) {
    const file = join(RAW_DIR, pageFileName(title))
    if (!force && explicit.length === 0 && existsSync(file)) continue
    try {
      if (fetched > 0) await sleep(DELAY_MS)
      const page = await fetchPage(title)
      await writeFile(join(RAW_DIR, pageFileName(page.title)), JSON.stringify(page, null, 2) + '\n')
      fetched++
      console.log(`✓ ${page.title} (rev ${page.revid}, ${page.wikitext.length} caractères)`)
    } catch (error) {
      failures++
      console.error(`✗ ${title} : ${(error as Error).message}`)
    }
  }
  console.log(`${fetched} page(s) récupérée(s), ${failures} échec(s), ${titles.length} page(s) au total.`)
  if (failures > 0) process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
