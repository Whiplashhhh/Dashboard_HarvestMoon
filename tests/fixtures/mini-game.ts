import type { RawGameData } from '../../shared/data/game'

const SOURCE = ['https://harvestmoon.fandom.com/wiki/Harvest_Sprites_(DS)']
const COLORS = [
  'brown',
  'black',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'indigo',
  'white',
] as const

const method = (title = 'Méthode principale') => ({ title, steps: ['Fais ceci, puis cela.'] })

/** Petit jeu de données valide : 10 équipes de 1 lutin chacune + quelques objectifs. */
export function miniGame(): RawGameData & { objectives: Record<string, unknown[]> } {
  const teams = COLORS.map((color, index) => ({
    id: `team-${index}`,
    name: `Team ${index}`,
    nameFr: null,
    color,
    colorLabel: color,
    leaderSpriteId: `leader-${index}`,
    description: 'Une équipe de test.',
    confidence: 'high',
    sources: SOURCE,
  }))
  const sprites: Record<string, unknown>[] = COLORS.map((_, index) => ({
    id: `leader-${index}`,
    name: `Leader ${index}`,
    nameFr: null,
    teamId: `team-${index}`,
    isLeader: true,
    fromStart: index === 0,
    unlock: 'Une condition de test.',
    methods: [method()],
    prerequisites: index === 0 ? [] : [{ type: 'sprite', id: 'leader-0' }],
    difficulty: 1,
    estimatedDuration: 'une session',
    confidence: 'high',
    sources: SOURCE,
  }))
  sprites[5] = { ...sprites[5], availableSeasons: ['summer'] }
  sprites[6] = { ...sprites[6], dates: [{ season: 'spring', day: 8 }] }

  const objectives = {
    'deesse.json': [
      {
        id: 'deesse-restore',
        category: 'deesse',
        title: 'Restaurer la Déesse',
        summary: 'Réunir assez de lutins pour restaurer la Déesse.',
        prerequisites: [{ type: 'spriteCount', min: 5 }],
        methods: [method()],
        difficulty: 3,
        estimatedDuration: 'long terme',
        milestone: true,
        confidence: 'high',
        sources: SOURCE,
      },
      {
        id: 'deesse-after',
        category: 'deesse',
        title: 'Après la Déesse',
        summary: 'Un objectif débloqué par la restauration.',
        prerequisites: [{ type: 'objective', id: 'deesse-restore' }],
        methods: [method(), method('Autre méthode')],
        difficulty: 2,
        estimatedDuration: 'quelques jours de jeu',
        confidence: 'low',
        sources: SOURCE,
      },
    ],
    'ferme.json': [
      {
        id: 'batiments-coop',
        category: 'batiments',
        title: 'Construire le poulailler',
        summary: 'Un bâtiment de test.',
        prerequisites: [
          { type: 'year', min: 2 },
          { type: 'manual', label: 'Avoir 5000 G' },
        ],
        methods: [method()],
        difficulty: 2,
        estimatedDuration: 'quelques jours de jeu',
        confidence: 'medium',
        sources: SOURCE,
      },
    ],
  }

  return {
    teams,
    sprites,
    objectives,
    characters: [
      {
        id: 'celia',
        name: 'Celia',
        nameFr: null,
        role: 'Prétendante',
        birthday: { season: 'spring', day: 3 },
        bachelorette: true,
        confidence: 'high',
        sources: SOURCE,
      },
    ],
    festivals: [
      {
        id: 'flower-festival',
        name: 'Flower Festival',
        nameFr: null,
        season: 'spring',
        day: 18,
        description: 'Un festival de test.',
        confidence: 'high',
        sources: SOURCE,
      },
    ],
    calendar: {
      daysPerSeason: 30,
      firstWeekday: 'monday',
      schedules: [],
      confidence: 'medium',
      sources: SOURCE,
    },
    buildings: [],
    tools: [],
    recipes: [],
    mines: [],
  }
}
