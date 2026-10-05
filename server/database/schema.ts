import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const seasonEnum = pgEnum('season', ['spring', 'summer', 'autumn', 'winter'])

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export interface StoredSettings {
  sounds: boolean
  reducedMotion: boolean
  forcedSeason: 'spring' | 'summer' | 'autumn' | 'winter' | null
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Tel que saisi (affichage). */
    username: varchar('username', { length: 32 }).notNull(),
    /** En minuscules : unicité insensible à la casse. */
    usernameKey: varchar('username_key', { length: 32 }).notNull(),
    email: varchar('email', { length: 254 }),
    passwordHash: text('password_hash').notNull(),
    settings: jsonb('settings')
      .$type<StoredSettings>()
      .notNull()
      .default({ sounds: false, reducedMotion: false, forcedSeason: null }),
    activeFarmId: uuid('active_farm_id').references((): AnyPgColumn => farms.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_username_key_idx').on(t.usernameKey)],
)

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 (hex) du jeton de session : le jeton brut n'est jamais stocké. */
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: varchar('user_agent', { length: 255 }),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
)

export const farms = pgTable(
  'farms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    farmerName: varchar('farmer_name', { length: 40 }).notNull(),
    farmName: varchar('farm_name', { length: 40 }).notNull(),
    gameYear: smallint('game_year').notNull().default(1),
    gameSeason: seasonEnum('game_season').notNull().default('spring'),
    gameDay: smallint('game_day').notNull().default(1),
    pinnedObjectiveId: varchar('pinned_objective_id', { length: 80 }),
    createdAt: createdAt(),
    /** Dernière mise à jour de la partie par la joueuse (« depuis combien de temps »). */
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('farms_user_idx').on(t.userId),
    check('farms_game_day_check', sql`${t.gameDay} between 1 and 30`),
    check('farms_game_year_check', sql`${t.gameYear} between 1 and 999`),
  ],
)

export const farmObjectives = pgTable(
  'farm_objectives',
  {
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id, { onDelete: 'cascade' }),
    objectiveId: varchar('objective_id', { length: 80 }).notNull(),
    completedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.farmId, t.objectiveId] })],
)

export const farmSteps = pgTable(
  'farm_steps',
  {
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id, { onDelete: 'cascade' }),
    objectiveId: varchar('objective_id', { length: 80 }).notNull(),
    methodIndex: smallint('method_index').notNull(),
    stepIndex: smallint('step_index').notNull(),
    checkedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.farmId, t.objectiveId, t.methodIndex, t.stepIndex] })],
)

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    gameYear: smallint('game_year').notNull(),
    gameSeason: seasonEnum('game_season').notNull(),
    gameDay: smallint('game_day').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('notes_farm_idx').on(t.farmId, t.createdAt)],
)

/** Limitation de débit des tentatives d'authentification (clé = « login-ip:… », « login-user:… », « register-ip:… »). */
export const authThrottle = pgTable('auth_throttle', {
  key: varchar('key', { length: 120 }).primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
})
