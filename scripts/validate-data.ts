/**
 * Valide un ou plusieurs fichiers de `data/` contre leur schéma Zod, sans exiger que tout le jeu de données
 * soit complet (utile pendant la saisie). La validation complète + intégrité est faite par `npm run data:check`.
 *
 * Usage : npm run data:validate -- data/sprites.json data/objectives/deesse.json
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import type { z } from 'zod'
import {
  buildingListSchema,
  calendarSchema,
  characterListSchema,
  festivalListSchema,
  mineListSchema,
  objectiveListSchema,
  recipeListSchema,
  spriteListSchema,
  teamListSchema,
  toolListSchema,
} from '../shared/schemas'

const SCHEMAS: Record<string, z.ZodType> = {
  'teams.json': teamListSchema,
  'sprites.json': spriteListSchema,
  'characters.json': characterListSchema,
  'festivals.json': festivalListSchema,
  'calendar.json': calendarSchema,
  'buildings.json': buildingListSchema,
  'tools.json': toolListSchema,
  'recipes.json': recipeListSchema,
  'mines.json': mineListSchema,
}

function schemaFor(file: string): z.ZodType | undefined {
  if (basename(dirname(file)) === 'objectives') return objectiveListSchema
  return SCHEMAS[basename(file)]
}

let failed = false
for (const file of process.argv.slice(2)) {
  const schema = schemaFor(file)
  if (!schema) {
    console.error(`✗ ${file} : aucun schéma connu pour ce fichier`)
    failed = true
    continue
  }
  let json: unknown
  try {
    json = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    console.error(`✗ ${file} : lecture impossible (${(error as Error).message})`)
    failed = true
    continue
  }
  const result = schema.safeParse(json)
  if (result.success) {
    const count = Array.isArray(result.data) ? `${result.data.length} entrée(s)` : 'objet'
    console.log(`✓ ${file} (${count})`)
  } else {
    failed = true
    console.error(`✗ ${file}`)
    for (const issue of result.error.issues.slice(0, 50)) {
      console.error(`  - ${issue.path.join('.') || '(racine)'} : ${issue.message}`)
    }
  }
}
process.exitCode = failed ? 1 : 0
