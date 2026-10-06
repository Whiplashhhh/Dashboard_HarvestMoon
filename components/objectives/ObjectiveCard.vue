<script setup lang="ts">
import { CATEGORY_LABELS, SEASON_LABELS, type Objective } from '#shared/schemas'
import { formatSeasonDay, type Evaluation, type Reason } from '#shared/engine'
import { CATEGORY_ICONS, STATUS_LABELS } from '~/utils/categories'

/** Fiche d'objectif épinglée sur le tableau de liège (ou panneau en bois pour l'objectif épinglé). */
const props = withDefaults(
  defineProps<{
    objective: Objective
    evaluation?: Evaluation
    reasons?: Reason[]
    variant?: 'note' | 'sign'
    headingLevel?: 'h2' | 'h3'
    tilt?: number
  }>(),
  { evaluation: undefined, reasons: () => [], variant: 'note', headingLevel: 'h3', tilt: 0 },
)

const status = computed(() => props.evaluation?.status)
const visibleReasons = computed(() => props.reasons.filter((r) => r.code !== 'pinned').slice(0, 2))
const seasons = computed(() =>
  props.objective.availableSeasons && props.objective.availableSeasons.length < 4
    ? props.objective.availableSeasons.map((s) => SEASON_LABELS[s]).join(', ')
    : null,
)
</script>

<template>
  <article
    class="card"
    :class="[`card--${variant}`, status ? `card--${status}` : null]"
    :style="{ '--tilt': `${tilt}deg` }"
  >
    <span v-if="variant === 'note'" class="card__pin" aria-hidden="true" />
    <header class="card__head">
      <span class="card__icon" :title="CATEGORY_LABELS[objective.category]">
        <PixelIcon :name="CATEGORY_ICONS[objective.category]" :size="28" />
      </span>
      <div class="card__titles">
        <p class="card__category">{{ CATEGORY_LABELS[objective.category] }}</p>
        <component :is="headingLevel" class="card__title">
          <NuxtLink :to="`/objectifs/${objective.id}`" class="card__link">{{ objective.title }}</NuxtLink>
        </component>
      </div>
    </header>

    <ul v-if="visibleReasons.length" class="card__reasons">
      <li v-for="reason in visibleReasons" :key="reason.code + reason.text">
        <PixelIcon name="sparkle" :size="16" /> {{ reason.text }}
      </li>
    </ul>
    <p v-else class="card__summary">{{ objective.summary }}</p>

    <footer class="card__foot">
      <DifficultyStars :value="objective.difficulty" />
      <TagChip
        v-if="status && status !== 'available'"
        :tone="status === 'completed' ? 'meadow' : status === 'locked' ? 'wood' : 'sky'"
        :icon="status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'calendar'"
      >
        {{ STATUS_LABELS[status] }}
      </TagChip>
      <TagChip v-if="objective.dates" tone="season" icon="calendar">
        {{ objective.dates.map(formatSeasonDay).join(', ') }}
      </TagChip>
      <TagChip v-else-if="seasons" tone="season" icon="calendar">{{ seasons }}</TagChip>
      <TagChip tone="plain">{{ objective.estimatedDuration }}</TagChip>
      <ConfidenceNote :confidence="objective.confidence" :notes="objective.notes" />
    </footer>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: 6px 6px 14px 6px;
  background: var(--paper-50);
  box-shadow: var(--shadow-card);
  transform: rotate(var(--tilt));
  transition:
    transform 220ms var(--ease-bounce),
    box-shadow 220ms ease;
}
.card:has(.card__link:hover),
.card:focus-within {
  transform: rotate(0) translateY(-3px);
  box-shadow: var(--shadow-lift);
}
/* Coin corné */
.card--note::after {
  content: '';
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 22px;
  height: 22px;
  border-top: 3px solid var(--wood-900);
  border-left: 3px solid var(--wood-900);
  border-radius: 6px 0 12px 0;
  background: linear-gradient(135deg, var(--paper-300) 50%, transparent 50%);
}
.card__pin {
  position: absolute;
  top: -11px;
  left: 50%;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  border: 3px solid var(--wood-950);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff8c86 0 25%, var(--berry) 30%);
  box-shadow: 0 3px 0 rgb(46 27 14 / 0.35);
}
.card--sign {
  border-width: var(--border-thick);
  border-radius: var(--radius-md);
  background:
    repeating-linear-gradient(97deg, transparent 0 22px, rgb(122 74 38 / 0.1) 22px 24px),
    linear-gradient(180deg, var(--wood-100), var(--wood-200));
}
.card--completed {
  background: #f1f8ea;
}
.card--locked,
.card--out-of-season {
  background: var(--paper-100);
}
.card--locked .card__icon {
  filter: grayscale(0.8);
}

.card__head {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}
.card__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 3px solid var(--wood-900);
  border-radius: 12px;
  background: var(--season-accent-soft);
}
.card__titles {
  min-width: 0;
}
.card__category {
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.card__title {
  margin: 0;
  font-size: var(--text-lg);
  line-height: 1.25;
}
.card__link {
  color: var(--wood-900);
  text-decoration: none;
}
/* Toute la fiche est cliquable, le lien reste l'unique cible accessible */
.card__link::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}
.card__link:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}
.card__link:focus-visible {
  outline: none;
  box-shadow: none;
}
.card:has(.card__link:focus-visible) {
  outline: 3px solid var(--wood-900);
  outline-offset: 3px;
  box-shadow: 0 0 0 7px var(--sun);
}
.card__summary {
  margin: 0;
  color: var(--ink-soft);
  font-size: var(--text-sm);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card__reasons {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--season-accent-strong);
}
.card__reasons li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.card__reasons svg {
  margin-top: 3px;
}
.card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
</style>
