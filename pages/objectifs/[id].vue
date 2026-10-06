<script setup lang="ts">
import { CATEGORY_LABELS, SEASON_LABELS } from '#shared/schemas'
import { formatSeasonDay, formatIn } from '#shared/engine'
import { spriteObjectiveId } from '#shared/data/game'
import { stepKey } from '#shared/types/api'
import { CATEGORY_ICONS, STATUS_LABELS } from '~/utils/categories'
import { sourceLabel } from '~/utils/text'

const route = useRoute()
const { game, lookups } = useGame()
const { evaluations, suggestions } = usePlayer()
const { farm, steps, completed, setObjective, setStep, pin } = useFarm()
const toast = useToast()

const id = computed(() => String(route.params.id))
const objective = computed(() => lookups.value?.objectives.get(id.value) ?? null)
const evaluation = computed(() => evaluations.value.get(id.value))
const reasons = computed(() => suggestions.value.find((s) => s.objective.id === id.value)?.reasons ?? [])
const isDone = computed(() => completed.value.has(id.value))
const isPinned = computed(() => farm.value?.pinnedObjectiveId === id.value)
const unlocks = computed(() => lookups.value?.index.unlocks(id.value) ?? [])
const relatedSprites = computed(() =>
  (objective.value?.relatedSpriteIds ?? [])
    .map((spriteId) => lookups.value?.sprites.get(spriteId))
    .filter((s) => s !== undefined),
)
const seasonsLabel = computed(() =>
  (objective.value?.availableSeasons ?? []).map((season) => SEASON_LABELS[season]).join(', '),
)
const festival = computed(() => lookups.value?.festivalByObjective.get(id.value) ?? null)

const tab = ref('0')
watch(id, () => (tab.value = '0'))
const methodTabs = computed(() =>
  (objective.value?.methods ?? []).map((m, i) => ({ id: String(i), label: m.title })),
)

const burst = ref(0)
async function toggleDone() {
  const done = !isDone.value
  const ok = await setObjective(id.value, done)
  if (ok && done) {
    burst.value++
    toast.show('Bravo ! Objectif accompli.', 'success')
    if (isPinned.value) await pin(null)
  }
}

function stepChecked(methodIndex: number, stepIndex: number) {
  return steps.value.has(stepKey(id.value, methodIndex, stepIndex))
}

useHead({ title: () => `${objective.value?.title ?? 'Objectif'} — Le Carnet de la Ferme` })
</script>

<template>
  <div class="page">
    <NuxtLink to="/objectifs" class="back"><PixelIcon name="back" :size="20" /> Tous les objectifs</NuxtLink>
    <GameGate>
      <PaperCard v-if="!objective" tone="white">
        <EmptyState title="Cet objectif n'existe pas (ou plus)">
          <NuxtLink to="/objectifs">Retour aux objectifs</NuxtLink>
        </EmptyState>
      </PaperCard>

      <article v-else class="detail">
        <WoodPanel as="header" tone="dark" class="detail__head">
          <div class="detail__headline">
            <span class="detail__icon"
              ><PixelIcon :name="CATEGORY_ICONS[objective.category]" :size="36"
            /></span>
            <div>
              <p class="detail__category">{{ CATEGORY_LABELS[objective.category] }}</p>
              <h1 class="detail__title sign-title">{{ objective.title }}</h1>
            </div>
          </div>
          <p class="detail__summary">{{ objective.summary }}</p>
          <div class="detail__tags">
            <DifficultyStars :value="objective.difficulty" />
            <TagChip
              v-if="evaluation"
              :tone="
                evaluation.status === 'completed'
                  ? 'meadow'
                  : evaluation.status === 'available'
                    ? 'gold'
                    : 'wood'
              "
            >
              {{ STATUS_LABELS[evaluation.status] }}
            </TagChip>
            <TagChip tone="plain">{{ objective.estimatedDuration }}</TagChip>
            <TagChip v-if="objective.availableSeasons" tone="season" icon="calendar">
              {{ seasonsLabel }}
            </TagChip>
            <TagChip v-for="d in objective.dates ?? []" :key="d.season + d.day" tone="season" icon="calendar">
              {{ formatSeasonDay(d) }}
            </TagChip>
            <TagChip v-if="evaluation?.nextDateInDays !== undefined && !isDone" tone="sky">
              {{ formatIn(evaluation.nextDateInDays) }}
            </TagChip>
          </div>
          <div class="detail__actions">
            <span class="detail__burst">
              <GameButton :variant="isDone ? 'paper' : 'primary'" icon="check" @click="toggleDone">
                {{ isDone ? 'Accompli ✓ (annuler)' : "C'est fait !" }}
              </GameButton>
              <LeafBurst :trigger="burst" />
            </span>
            <GameButton
              v-if="!isDone"
              variant="paper"
              icon="pin"
              :aria-pressed="isPinned"
              @click="pin(isPinned ? null : objective.id)"
            >
              {{ isPinned ? 'Épinglé (retirer)' : 'Épingler' }}
            </GameButton>
          </div>
        </WoodPanel>

        <div class="detail__grid">
          <div class="detail__main">
            <PaperCard v-if="reasons.length && evaluation?.status === 'available'" tone="white" class="why">
              <h2 class="section-title"><PixelIcon name="sparkle" :size="24" /> Pourquoi maintenant ?</h2>
              <ul>
                <li v-for="reason in reasons" :key="reason.code + reason.text">{{ reason.text }}</li>
              </ul>
            </PaperCard>

            <PaperCard
              v-if="evaluation && evaluation.missing.length"
              as="section"
              class="missing"
              aria-labelledby="missing-title"
            >
              <h2 id="missing-title" class="section-title">
                <PixelIcon name="lock" :size="24" /> Ce qu'il te manque
              </h2>
              <ul class="link-list">
                <li v-for="item in evaluation.missing" :key="item.label">
                  <NuxtLink v-if="item.objectiveId" :to="`/objectifs/${item.objectiveId}`">{{
                    item.label
                  }}</NuxtLink>
                  <span v-else>{{ item.label }}</span>
                </li>
              </ul>
            </PaperCard>

            <section class="methods" aria-labelledby="methods-title">
              <h2 id="methods-title" class="section-title">
                <PixelIcon name="book" :size="28" />
                {{
                  objective.methods.length > 1
                    ? `${objective.methods.length} façons d'y arriver`
                    : 'Comment faire'
                }}
              </h2>
              <BookmarkTabs
                v-if="objective.methods.length > 1"
                v-model="tab"
                :tabs="methodTabs"
                id-prefix="method"
                label="Méthodes"
              />
              <template v-for="(method, mi) in objective.methods" :key="mi">
                <PaperCard
                  v-show="tab === String(mi)"
                  :id="`method-panel-${mi}`"
                  tone="white"
                  class="method"
                  :role="objective.methods.length > 1 ? 'tabpanel' : undefined"
                  :aria-labelledby="objective.methods.length > 1 ? `method-tab-${mi}` : undefined"
                >
                  <h3 v-if="objective.methods.length === 1" class="method__title">{{ method.title }}</h3>
                  <div v-if="method.constraints?.length || method.cost" class="method__tags">
                    <TagChip v-for="c in method.constraints ?? []" :key="c" tone="sky" icon="calendar">{{
                      c
                    }}</TagChip>
                    <TagChip v-if="method.cost" tone="gold" icon="coin">{{ method.cost }}</TagChip>
                  </div>
                  <ol class="steps">
                    <li v-for="(step, si) in method.steps" :key="si">
                      <label class="check-row check-row--strike">
                        <input
                          type="checkbox"
                          :checked="stepChecked(mi, si)"
                          @change="setStep(objective.id, mi, si, ($event.target as HTMLInputElement).checked)"
                        />
                        <span class="check-row__box" aria-hidden="true"
                          ><PixelIcon name="check" :size="18"
                        /></span>
                        <span>{{ step }}</span>
                      </label>
                    </li>
                  </ol>
                  <div v-if="method.tips?.length" class="tips">
                    <p class="tips__title"><PixelIcon name="sparkle" :size="20" /> Astuces</p>
                    <ul>
                      <li v-for="tip in method.tips" :key="tip">{{ tip }}</li>
                    </ul>
                  </div>
                </PaperCard>
              </template>
            </section>
          </div>

          <aside class="detail__side">
            <PaperCard v-if="evaluation?.manual.length" as="section" aria-labelledby="manual-title">
              <h2 id="manual-title" class="section-title">
                <PixelIcon name="search" :size="24" /> À vérifier toi-même
              </h2>
              <ul class="plain-list">
                <li v-for="label in evaluation.manual" :key="label">{{ label }}</li>
              </ul>
            </PaperCard>

            <PaperCard v-if="festival" as="section" aria-labelledby="festival-title">
              <h2 id="festival-title" class="section-title">
                <PixelIcon name="flag" :size="24" /> {{ festival.name }}
              </h2>
              <p>{{ festival.description }}</p>
              <p v-if="festival.location || festival.time" class="muted">
                {{ [festival.location, festival.time].filter(Boolean).join(' · ') }}
              </p>
            </PaperCard>

            <PaperCard v-if="objective.rewards?.length" as="section" aria-labelledby="rewards-title">
              <h2 id="rewards-title" class="section-title">
                <PixelIcon name="star" :size="24" /> Récompenses
              </h2>
              <ul class="plain-list">
                <li v-for="reward in objective.rewards" :key="reward">{{ reward }}</li>
              </ul>
            </PaperCard>

            <PaperCard v-if="unlocks.length" as="section" aria-labelledby="unlocks-title">
              <h2 id="unlocks-title" class="section-title">
                <PixelIcon name="sparkle" :size="24" /> Ça débloque ensuite
              </h2>
              <ul class="link-list">
                <li v-for="next in unlocks" :key="next.id">
                  <NuxtLink :to="`/objectifs/${next.id}`">{{ next.title }}</NuxtLink>
                </li>
              </ul>
            </PaperCard>

            <PaperCard v-if="relatedSprites.length" as="section" aria-labelledby="sprites-title">
              <h2 id="sprites-title" class="section-title">
                <PixelIcon name="sprite" :size="24" /> Lutins liés
              </h2>
              <ul class="sprites">
                <li v-for="sprite in relatedSprites" :key="sprite.id">
                  <SpriteFigure
                    :color="lookups?.teams.get(sprite.teamId)?.color"
                    :found="completed.has(spriteObjectiveId(sprite.id))"
                    :size="32"
                  />
                  <NuxtLink :to="`/objectifs/${spriteObjectiveId(sprite.id)}`">{{ sprite.name }}</NuxtLink>
                </li>
              </ul>
            </PaperCard>

            <PaperCard as="section" aria-labelledby="sources-title" class="sources">
              <h2 id="sources-title" class="section-title"><PixelIcon name="book" :size="24" /> Sources</h2>
              <p v-if="objective.confidence === 'low'" class="low">
                <ConfidenceNote confidence="low" /> Cette information est incertaine : vérifie-la en jeu.
              </p>
              <p v-if="objective.notes" class="notes">{{ objective.notes }}</p>
              <ul class="plain-list">
                <li v-for="source in objective.sources" :key="source">
                  <a :href="source" rel="noopener noreferrer external" target="_blank">{{
                    sourceLabel(source)
                  }}</a>
                </li>
              </ul>
            </PaperCard>
          </aside>
        </div>
      </article>
    </GameGate>
    <p v-if="!game" class="visually-hidden">Chargement</p>
  </div>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap);
  font-weight: 800;
  width: fit-content;
}
.detail {
  display: grid;
  gap: var(--space-5);
}
.detail__head {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
}
.detail__headline {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}
.detail__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 3px solid var(--wood-950);
  border-radius: 16px;
  background: var(--paper-50);
}
.detail__category {
  margin: 0;
  font-weight: 800;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--paper-100);
  text-shadow: 0 1px 0 var(--wood-950);
}
.detail__title {
  margin: 0;
  font-size: var(--text-3xl);
}
.detail__summary {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-sm);
  background: var(--paper-50);
  color: var(--ink);
  font-size: var(--text-lg);
}
.detail__tags,
.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
.detail__actions {
  gap: var(--space-3);
}
.detail__burst {
  position: relative;
  display: inline-flex;
}
.detail__grid {
  display: grid;
  gap: var(--space-5);
}
@media (min-width: 1000px) {
  .detail__grid {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
.detail__main,
.detail__side {
  display: grid;
  gap: var(--space-5);
  align-content: start;
}
.why ul {
  margin: 0;
  font-weight: 700;
  color: var(--season-accent-strong);
}
.methods {
  display: grid;
}
.method {
  display: grid;
  gap: var(--space-3);
  border-top-left-radius: 8px;
}
.method__title {
  margin: 0;
}
.method__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.steps {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}
.tips {
  padding: var(--space-3) var(--space-4);
  border: 2px dashed var(--gold);
  border-radius: var(--radius-sm);
  background: #fff8df;
}
.tips__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-2);
  font-weight: 800;
}
.tips ul {
  margin: 0;
}
.link-list,
.plain-list {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: var(--space-2);
}
.link-list a {
  font-weight: 700;
}
.sprites {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.sprites li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 700;
}
.sources {
  font-size: var(--text-sm);
}
.sources a {
  overflow-wrap: anywhere;
}
.notes {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--paper-200);
}
.low {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
.muted {
  color: var(--ink-soft);
}
</style>
