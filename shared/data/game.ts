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
  type Building,
  type Calendar,
  type Character,
  type Festival,
  type Mine,
  type Objective,
  type Prerequisite,
  type Recipe,
  type Sprite,
  type Team,
  type Tool,
} from '../schemas'

/** Données brutes (JSON non validés) telles que lues dans `data/`. */
export interface RawGameData {
  teams: unknown
  sprites: unknown
  /** Plusieurs fichiers `data/objectives/*.json`, indexés par nom de fichier. */
  objectives: Record<string, unknown>
  characters: unknown
  festivals: unknown
  calendar: unknown
  buildings: unknown
  tools: unknown
  recipes: unknown
  mines: unknown
}

/** Données du jeu validées, prêtes pour le moteur et l'interface. */
export interface GameData {
  teams: Team[]
  sprites: Sprite[]
  /** Tous les objectifs, y compris ceux générés pour chaque lutin. */
  objectives: Objective[]
  characters: Character[]
  festivals: Festival[]
  calendar: Calendar
  buildings: Building[]
  tools: Tool[]
  recipes: Recipe[]
  mines: Mine[]
}

export const SPRITE_OBJECTIVE_PREFIX = 'sprite-'
export const TOTAL_SPRITES = 101
export const GODDESS_SPRITES = 60

export function spriteObjectiveId(spriteId: string): string {
  return `${SPRITE_OBJECTIVE_PREFIX}${spriteId}`
}

export function isSpriteObjectiveId(objectiveId: string): boolean {
  return objectiveId.startsWith(SPRITE_OBJECTIVE_PREFIX)
}

export function spriteIdFromObjectiveId(objectiveId: string): string | null {
  return isSpriteObjectiveId(objectiveId) ? objectiveId.slice(SPRITE_OBJECTIVE_PREFIX.length) : null
}

/** Un lutin devient un objectif « Débloquer le lutin X » de catégorie « lutins ». */
export function spriteToObjective(sprite: Sprite): Objective {
  return {
    id: spriteObjectiveId(sprite.id),
    category: 'lutins',
    title: `Débloquer le lutin ${sprite.name}`,
    summary: sprite.unlock,
    prerequisites: sprite.prerequisites,
    methods: sprite.methods,
    ...(sprite.availableSeasons ? { availableSeasons: sprite.availableSeasons } : {}),
    ...(sprite.dates ? { dates: sprite.dates } : {}),
    difficulty: sprite.difficulty,
    estimatedDuration: sprite.estimatedDuration,
    relatedSpriteIds: [sprite.id],
    onboarding: true,
    confidence: sprite.confidence,
    sources: sprite.sources,
    ...(sprite.notes ? { notes: sprite.notes } : {}),
  }
}

/** Ramène un prérequis « lutin » à l'objectif équivalent. */
export function prerequisiteObjectiveId(prerequisite: Prerequisite): string | null {
  if (prerequisite.type === 'objective') return prerequisite.id
  if (prerequisite.type === 'sprite') return spriteObjectiveId(prerequisite.id)
  return null
}

export class GameDataError extends Error {
  constructor(readonly problems: string[]) {
    super(`Données du jeu invalides :\n- ${problems.join('\n- ')}`)
    this.name = 'GameDataError'
  }
}

function parseOrCollect<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
  problems: string[],
): T | null {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push(`${label} › ${issue.path.join('.') || '(racine)'} : ${issue.message}`)
  }
  return null
}

/** Valide chaque fichier contre son schéma, génère les objectifs « lutins », puis vérifie l'intégrité. */
export function buildGameData(raw: RawGameData): GameData {
  const problems: string[] = []
  const teams = parseOrCollect(teamListSchema, raw.teams, 'teams.json', problems)
  const sprites = parseOrCollect(spriteListSchema, raw.sprites, 'sprites.json', problems)
  const characters = parseOrCollect(characterListSchema, raw.characters, 'characters.json', problems)
  const festivals = parseOrCollect(festivalListSchema, raw.festivals, 'festivals.json', problems)
  const calendar = parseOrCollect(calendarSchema, raw.calendar, 'calendar.json', problems)
  const buildings = parseOrCollect(buildingListSchema, raw.buildings, 'buildings.json', problems)
  const tools = parseOrCollect(toolListSchema, raw.tools, 'tools.json', problems)
  const recipes = parseOrCollect(recipeListSchema, raw.recipes, 'recipes.json', problems)
  const mines = parseOrCollect(mineListSchema, raw.mines, 'mines.json', problems)
  const objectiveFiles = Object.entries(raw.objectives).map(([file, value]) =>
    parseOrCollect(objectiveListSchema, value, `objectives/${file}`, problems),
  )

  if (
    problems.length > 0 ||
    !teams ||
    !sprites ||
    !characters ||
    !festivals ||
    !calendar ||
    !buildings ||
    !tools ||
    !recipes ||
    !mines
  ) {
    throw new GameDataError(problems)
  }

  const game: GameData = {
    teams,
    sprites,
    objectives: [...sprites.map(spriteToObjective), ...objectiveFiles.flatMap((list) => list ?? [])],
    characters,
    festivals,
    calendar,
    buildings,
    tools,
    recipes,
    mines,
  }

  const integrity = checkIntegrity(game)
  if (integrity.length > 0) throw new GameDataError(integrity)
  return game
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) dup.add(id)
    seen.add(id)
  }
  return [...dup]
}

/** Intégrité référentielle : ids uniques, références existantes, pas de cycle dans les prérequis. */
export function checkIntegrity(game: GameData): string[] {
  const problems: string[] = []
  const objectiveIds = new Set(game.objectives.map((o) => o.id))
  const spriteIds = new Set(game.sprites.map((s) => s.id))
  const teamIds = new Set(game.teams.map((t) => t.id))

  const collections: [string, { id: string }[]][] = [
    ['objectifs', game.objectives],
    ['lutins', game.sprites],
    ['équipes', game.teams],
    ['personnages', game.characters],
    ['festivals', game.festivals],
    ['bâtiments', game.buildings],
    ['outils', game.tools],
    ['recettes', game.recipes],
    ['mines', game.mines],
  ]
  for (const [label, list] of collections) {
    for (const id of duplicates(list.map((item) => item.id)))
      problems.push(`${label} : id en double « ${id} »`)
  }

  for (const sprite of game.sprites) {
    if (!teamIds.has(sprite.teamId))
      problems.push(`lutin ${sprite.id} : équipe inconnue « ${sprite.teamId} »`)
  }
  for (const team of game.teams) {
    const leader = game.sprites.find((s) => s.id === team.leaderSpriteId)
    if (!leader) problems.push(`équipe ${team.id} : chef inconnu « ${team.leaderSpriteId} »`)
    else if (leader.teamId !== team.id || !leader.isLeader)
      problems.push(`équipe ${team.id} : « ${leader.id} » n'est pas marqué chef de cette équipe`)
  }

  const checkRef = (owner: string, id: string | undefined) => {
    if (id !== undefined && !objectiveIds.has(id)) problems.push(`${owner} : objectif inconnu « ${id} »`)
  }

  for (const objective of game.objectives) {
    for (const prerequisite of objective.prerequisites) {
      if (prerequisite.type === 'objective') checkRef(`objectif ${objective.id} (prérequis)`, prerequisite.id)
      if (prerequisite.type === 'sprite' && !spriteIds.has(prerequisite.id))
        problems.push(`objectif ${objective.id} : lutin inconnu « ${prerequisite.id} » en prérequis`)
      if (prerequisite.type === 'spriteCount' && prerequisite.min > game.sprites.length)
        problems.push(
          `objectif ${objective.id} : ${prerequisite.min} lutins requis, seulement ${game.sprites.length}`,
        )
      if (prerequisiteObjectiveId(prerequisite) === objective.id)
        problems.push(`objectif ${objective.id} : se requiert lui-même`)
    }
    for (const spriteId of objective.relatedSpriteIds ?? []) {
      if (!spriteIds.has(spriteId))
        problems.push(`objectif ${objective.id} : lutin lié inconnu « ${spriteId} »`)
    }
  }
  for (const festival of game.festivals) checkRef(`festival ${festival.id}`, festival.objectiveId)
  for (const building of game.buildings) checkRef(`bâtiment ${building.id}`, building.objectiveId)
  for (const tool of game.tools) {
    for (const level of tool.levels) checkRef(`outil ${tool.id} niveau ${level.level}`, level.objectiveId)
  }

  problems.push(...findCycles(game.objectives))
  return problems
}

/** Détecte les cycles dans le graphe des prérequis (parcours en profondeur, 3 couleurs). */
export function findCycles(objectives: Objective[]): string[] {
  const edges = new Map<string, string[]>()
  for (const objective of objectives) {
    edges.set(
      objective.id,
      objective.prerequisites.map(prerequisiteObjectiveId).filter((id): id is string => id !== null),
    )
  }
  const state = new Map<string, 'visiting' | 'done'>()
  const problems: string[] = []
  const stack: string[] = []

  const visit = (id: string) => {
    const current = state.get(id)
    if (current === 'done') return
    if (current === 'visiting') {
      const cycle = [...stack.slice(stack.indexOf(id)), id]
      problems.push(`cycle de prérequis : ${cycle.join(' → ')}`)
      return
    }
    state.set(id, 'visiting')
    stack.push(id)
    for (const next of edges.get(id) ?? []) visit(next)
    stack.pop()
    state.set(id, 'done')
  }

  for (const id of edges.keys()) visit(id)
  return problems
}
