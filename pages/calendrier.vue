<script setup lang="ts">
import { SEASON_LABELS, SEASONS, WEEKDAY_LABELS, WEEKDAYS, type Season, type Weekday } from '#shared/schemas'
import { weekdayOf } from '#shared/engine'

useHead({ title: 'Calendrier — Le Carnet de la Ferme' })

const { game } = useGame()
const { farm } = useFarm()
const { evaluations } = usePlayer()

const season = ref<Season>(farm.value?.date.season ?? 'spring')
const tabs = SEASONS.map((s) => ({ id: s, label: SEASON_LABELS[s] }))
const year = computed(() => farm.value?.date.year ?? 1)
const selectedDay = ref<number | null>(
  farm.value?.date.season === season.value ? (farm.value?.date.day ?? null) : null,
)
watch(season, (s) => (selectedDay.value = farm.value?.date.season === s ? farm.value.date.day : null))

interface DayEvent {
  kind: 'festival' | 'birthday' | 'objective'
  id: string
  label: string
  link?: string
  muted?: boolean
}

const days = computed(() => {
  const data = game.value
  if (!data) return []
  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1
    const events: DayEvent[] = []
    for (const f of data.festivals)
      if (f.season === season.value && f.day === day)
        events.push({
          kind: 'festival',
          id: f.id,
          label: f.nameFr ?? f.name,
          link: f.objectiveId ? `/objectifs/${f.objectiveId}` : undefined,
          muted: f.euUnavailable,
        })
    for (const c of data.characters)
      if (c.birthday?.season === season.value && c.birthday.day === day && !c.euUnavailable)
        events.push({ kind: 'birthday', id: c.id, label: c.nameFr ?? c.name })
    for (const o of data.objectives)
      if (o.category !== 'festivals' && o.dates?.some((d) => d.season === season.value && d.day === day))
        events.push({
          kind: 'objective',
          id: o.id,
          label: o.title,
          link: `/objectifs/${o.id}`,
          muted: evaluations.value.get(o.id)?.status === 'completed',
        })
    return {
      day,
      weekday: weekdayOf({ year: year.value, season: season.value, day }, data.calendar.firstWeekday),
      events,
      isToday: farm.value?.date.season === season.value && farm.value.date.day === day,
    }
  })
})

/** Les cases vides avant le 1er jour, pour aligner le calendrier sur lundi. */
const offset = computed(() => (days.value[0] ? WEEKDAYS.indexOf(days.value[0].weekday) : 0))
const selected = computed(() => days.value.find((d) => d.day === selectedDay.value) ?? null)

const seasonal = computed(() =>
  (game.value?.objectives ?? []).filter(
    (o) =>
      o.availableSeasons?.length === 1 &&
      o.availableSeasons[0] === season.value &&
      evaluations.value.get(o.id)?.status !== 'completed',
  ),
)

const closedDays = (days: Weekday[]) => days.map((w) => WEEKDAY_LABELS[w].toLowerCase()).join(' et le ')

const closures = computed(() => (game.value?.calendar.schedules ?? []).filter((s) => s.closedOn?.length))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Calendrier</h1>
        <p>Festivals, anniversaires et rendez-vous de la vallée. An {{ year }}.</p>
      </div>
    </header>

    <GameGate>
      <div class="wall">
        <span class="wall__nail" aria-hidden="true" />
        <BookmarkTabs v-model="season" :tabs="tabs" id-prefix="cal" label="Saisons" />
        <div
          :id="`cal-panel-${season}`"
          class="calendar"
          :class="`calendar--${season}`"
          role="tabpanel"
          :aria-labelledby="`cal-tab-${season}`"
        >
          <h2 class="calendar__title sign-title">{{ SEASON_LABELS[season] }}</h2>
          <div class="calendar__grid">
            <div class="calendar__week calendar__head" aria-hidden="true">
              <span v-for="w in WEEKDAYS" :key="w">
                {{ WEEKDAY_LABELS[w].slice(0, 3) }}
              </span>
            </div>
            <div
              class="calendar__days"
              role="group"
              :aria-label="`Jours de ${SEASON_LABELS[season].toLowerCase()}, an ${year}`"
            >
              <span v-for="n in offset" :key="`pad-${n}`" class="calendar__pad" aria-hidden="true" />
              <button
                v-for="d in days"
                :key="d.day"
                type="button"
                class="day"
                :class="{
                  'day--today': d.isToday,
                  'day--selected': selectedDay === d.day,
                  'day--event': d.events.length,
                }"
                :aria-pressed="selectedDay === d.day"
                :aria-label="`${WEEKDAY_LABELS[d.weekday]} ${d.day}${d.isToday ? ', aujourd’hui dans ton jeu' : ''}${d.events.length ? ` : ${d.events.map((e) => e.label).join(', ')}` : ''}`"
                @click="selectedDay = d.day"
              >
                <span class="day__num pixel">{{ d.day }}</span>
                <span class="day__icons" aria-hidden="true">
                  <PixelIcon
                    v-for="e in d.events.slice(0, 3)"
                    :key="e.kind + e.id"
                    :name="e.kind === 'festival' ? 'flag' : e.kind === 'birthday' ? 'cake' : 'star'"
                    :size="18"
                  />
                </span>
                <span class="day__label">{{ d.events[0]?.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="below">
        <PaperCard as="section" aria-live="polite" aria-labelledby="day-title">
          <h2 id="day-title" class="section-title">
            <PixelIcon name="calendar" :size="24" />
            {{
              selected
                ? `${WEEKDAY_LABELS[selected.weekday]} ${selected.day} ${SEASON_LABELS[season].toLowerCase()}`
                : 'Choisis un jour'
            }}
          </h2>
          <ul v-if="selected?.events.length" class="events">
            <li v-for="e in selected.events" :key="e.kind + e.id" :class="{ muted: e.muted }">
              <PixelIcon
                :name="e.kind === 'festival' ? 'flag' : e.kind === 'birthday' ? 'cake' : 'star'"
                :size="24"
              />
              <span>
                <template v-if="e.kind === 'birthday'">Anniversaire de </template>
                <NuxtLink v-if="e.link" :to="e.link">{{ e.label }}</NuxtLink>
                <template v-else>{{ e.label }}</template>
              </span>
            </li>
          </ul>
          <p v-else-if="selected" class="muted">Une journée tranquille à la ferme.</p>
          <p v-else class="muted">Touche un jour du calendrier pour voir ce qui s’y passe.</p>
        </PaperCard>

        <PaperCard as="section" aria-labelledby="seasonal-title">
          <h2 id="seasonal-title" class="section-title">
            <PixelIcon name="leaf" :size="24" /> Seulement en {{ SEASON_LABELS[season].toLowerCase() }}
          </h2>
          <ul v-if="seasonal.length" class="links">
            <li v-for="o in seasonal" :key="o.id">
              <NuxtLink :to="`/objectifs/${o.id}`">{{ o.title }}</NuxtLink>
            </li>
          </ul>
          <p v-else class="muted">Aucun objectif propre à cette saison.</p>
        </PaperCard>

        <PaperCard as="section" aria-labelledby="closures-title">
          <h2 id="closures-title" class="section-title">
            <PixelIcon name="lock" :size="24" /> Jours de fermeture
          </h2>
          <ul class="closures">
            <li v-for="s in closures" :key="s.id">
              <strong>{{ s.place }}</strong> — fermé le {{ closedDays(s.closedOn ?? []) }}
              <span class="muted">({{ s.hours }})</span>
              <ConfidenceNote :confidence="s.confidence" :notes="s.notes" />
            </li>
          </ul>
          <p class="muted small">
            Le jour de la semaine du 1er printemps est une déduction
            <ConfidenceNote :confidence="game!.calendar.confidence" :notes="game!.calendar.notes" />
          </p>
        </PaperCard>
      </div>
    </GameGate>
  </div>
</template>

<style scoped>
.wall {
  position: relative;
  padding-top: var(--space-4);
}
.wall__nail {
  position: absolute;
  top: -4px;
  left: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e7e1d6 0 25%, #8b8172 50%, #4b4338 100%);
  z-index: 2;
}
.calendar {
  min-width: 0;
  padding: var(--space-4);
  border: var(--border-chunky) solid var(--wood-900);
  border-radius: var(--radius-md);
  background: var(--paper-50);
  box-shadow: var(--shadow-lift);
}
.calendar__title {
  margin: 0 0 var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-sm);
  background: var(--season-accent);
  text-align: center;
  font-size: var(--text-2xl);
}
.calendar__week,
.calendar__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}
.calendar__head span {
  padding: 4px 0;
  font-weight: 800;
  font-size: var(--text-xs);
  text-align: center;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.day {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  align-content: start;
  gap: 2px;
  min-height: clamp(48px, 9vw, 92px);
  padding: 4px;
  border: 2px solid var(--paper-400);
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}
.day:hover {
  border-color: var(--wood-700);
}
.day--event {
  background: var(--season-accent-soft);
}
.day--selected {
  border-color: var(--wood-900);
  box-shadow: 0 0 0 2px var(--wood-900);
}
/* Le jour actuel du jeu, entouré comme au feutre */
.day--today {
  border-color: var(--berry);
}
.day--today .day__num {
  position: relative;
  justify-self: start;
  padding: 0 4px;
}
.day--today .day__num::after {
  content: '';
  position: absolute;
  inset: -5px -6px;
  border: 3px solid var(--berry);
  border-radius: 50% 45% 55% 40%;
  transform: rotate(-6deg);
  pointer-events: none;
}
.day__num {
  font-size: 1rem;
  color: var(--wood-900);
}
.day__icons {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  overflow: hidden;
}
.day__label {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--ink-soft);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
@media (max-width: 640px) {
  .day__label {
    display: none;
  }
  .calendar {
    padding: var(--space-2);
  }
}
.below {
  display: grid;
  align-items: start;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}
.events,
.closures,
.links {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.events li {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-weight: 700;
}
.links {
  padding-left: 1.2rem;
  list-style: disc;
}
.muted {
  color: var(--ink-soft);
}
.small {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
}
</style>
