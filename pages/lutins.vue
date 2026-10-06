<script setup lang="ts">
import { spriteObjectiveId } from '#shared/data/game'

useHead({ title: 'Lutins — Le Carnet de la Ferme' })

const { game } = useGame()
const { completed, setObjective } = useFarm()
const { spritesFound, evaluations } = usePlayer()
const toast = useToast()

const filter = ref<'all' | 'missing' | 'found'>('all')
const celebrating = ref<string | null>(null)
const bursts = ref<Record<string, number>>({})

const teams = computed(() =>
  (game.value?.teams ?? []).map((team) => {
    const sprites = game.value!.sprites.filter((s) => s.teamId === team.id)
    const found = sprites.filter((s) => completed.value.has(spriteObjectiveId(s.id))).length
    return {
      team,
      found,
      sprites: sprites.filter((s) => {
        const isFound = completed.value.has(spriteObjectiveId(s.id))
        return filter.value === 'all' || (filter.value === 'found' ? isFound : !isFound)
      }),
      total: sprites.length,
    }
  }),
)

async function toggle(spriteId: string, name: string) {
  const objectiveId = spriteObjectiveId(spriteId)
  const found = !completed.value.has(objectiveId)
  const ok = await setObjective(objectiveId, found)
  if (ok && found) {
    celebrating.value = spriteId
    bursts.value = { ...bursts.value, [spriteId]: (bursts.value[spriteId] ?? 0) + 1 }
    setTimeout(() => (celebrating.value = null), 900)
    const count = spritesFound.value
    toast.show(
      count === 60
        ? `${name} rejoint la troupe : 60 lutins ! La Déesse peut être restaurée !`
        : `${name} a rejoint ta troupe ! (${count}/101)`,
      'success',
    )
  }
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Lutins</h1>
        <p>Les 101 lutins de la vallée, par équipe. Touche un lutin pour le marquer comme trouvé.</p>
      </div>
    </header>

    <GameGate>
      <PaperCard>
        <ProgressTrail :value="spritesFound" />
        <div class="segmented" role="group" aria-label="Afficher">
          <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">Tous</button>
          <button type="button" :aria-pressed="filter === 'missing'" @click="filter = 'missing'">
            À trouver
          </button>
          <button type="button" :aria-pressed="filter === 'found'" @click="filter = 'found'">Trouvés</button>
        </div>
      </PaperCard>

      <section
        v-for="{ team, sprites, found, total } in teams"
        :key="team.id"
        class="team"
        :style="{ '--team': `var(--team-${team.color})` }"
        :aria-labelledby="`team-${team.id}`"
      >
        <header class="team__head">
          <h2 :id="`team-${team.id}`" class="team__title">
            <span class="team__badge" aria-hidden="true" />
            Équipe {{ team.colorLabel.toLowerCase() }}
            <span class="team__name">{{ team.name }}</span>
          </h2>
          <p class="team__count pixel">{{ found }}/{{ total }}</p>
        </header>
        <p class="team__desc">{{ team.description }}</p>
        <ul v-if="sprites.length" class="team__grid">
          <li
            v-for="sprite in sprites"
            :key="sprite.id"
            class="sprite-card"
            :class="{ 'is-found': completed.has(spriteObjectiveId(sprite.id)) }"
          >
            <button
              type="button"
              class="sprite-card__toggle"
              :aria-pressed="completed.has(spriteObjectiveId(sprite.id))"
              :aria-label="`${sprite.name} : ${completed.has(spriteObjectiveId(sprite.id)) ? 'trouvé (toucher pour annuler)' : 'pas encore trouvé (toucher pour marquer trouvé)'}`"
              @click="toggle(sprite.id, sprite.name)"
            >
              <span class="sprite-card__figure" :class="{ 'is-jumping': celebrating === sprite.id }">
                <SpriteFigure
                  :color="team.color"
                  :found="completed.has(spriteObjectiveId(sprite.id))"
                  :mood="completed.has(spriteObjectiveId(sprite.id)) ? 'breathe' : 'idle'"
                  :size="44"
                />
                <LeafBurst :trigger="bursts[sprite.id] ?? 0" />
              </span>
              <span class="sprite-card__name">
                {{ sprite.name }}
                <small v-if="sprite.isLeader">Chef</small>
              </span>
            </button>
            <p class="sprite-card__unlock">{{ sprite.unlock }}</p>
            <p class="sprite-card__meta">
              <TagChip
                v-if="evaluations.get(spriteObjectiveId(sprite.id))?.status === 'locked'"
                tone="wood"
                icon="lock"
                >Verrouillé</TagChip
              >
              <ConfidenceNote :confidence="sprite.confidence" :notes="sprite.notes" />
              <NuxtLink :to="`/objectifs/${spriteObjectiveId(sprite.id)}`" class="sprite-card__more"
                >Comment faire →</NuxtLink
              >
            </p>
          </li>
        </ul>
        <p v-else class="team__empty">
          {{
            filter === 'found' ? 'Aucun lutin trouvé dans cette équipe.' : 'Toute l’équipe est au complet !'
          }}
        </p>
      </section>
    </GameGate>
  </div>
</template>

<style scoped>
.segmented {
  display: flex;
  width: fit-content;
  margin-top: var(--space-4);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.segmented button {
  min-height: var(--tap);
  padding: 0.3rem 1rem;
  border: 0;
  border-right: 2px solid var(--wood-900);
  background: var(--paper-50);
  font-weight: 800;
  cursor: pointer;
}
.segmented button:last-child {
  border-right: 0;
}
.segmented button[aria-pressed='true'] {
  background: var(--season-accent);
  color: #fff;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
}
.team {
  padding: var(--space-4);
  border: var(--border-thick) solid var(--wood-900);
  border-radius: var(--radius-lg);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--team) 22%, var(--paper-50)) 0 4.4rem,
    var(--paper-50) 4.4rem
  );
  box-shadow: var(--shadow-card);
}
.team__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}
.team__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-xl);
}
.team__name {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--ink-soft);
}
.team__badge {
  width: 22px;
  height: 22px;
  border: 3px solid var(--wood-950);
  border-radius: 50%;
  background: var(--team);
}
.team__count {
  margin: 0;
  padding: 0.1rem 0.6rem;
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-sm);
  background: var(--paper-50);
  font-size: 1.1rem;
}
.team__desc {
  margin: var(--space-2) 0 var(--space-4);
  color: var(--ink-soft);
  font-size: var(--text-sm);
}
.team__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 215px), 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.team__empty {
  margin: 0;
  font-weight: 700;
  color: var(--ink-soft);
}
.sprite-card {
  display: grid;
  gap: var(--space-2);
  align-content: start;
  padding: var(--space-3);
  border: 3px dashed var(--paper-400);
  border-radius: var(--radius-md);
  background: var(--paper-100);
}
.sprite-card.is-found {
  border-style: solid;
  border-color: var(--wood-900);
  background: #fff;
}
.sprite-card__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 60px;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
}
.sprite-card__figure {
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--team) 25%, transparent) 0 55%,
    transparent 56%
  );
}
.sprite-card__figure.is-jumping {
  animation: jump 0.8s var(--ease-bounce);
}
@keyframes jump {
  30% {
    transform: translateY(-16px) rotate(-6deg);
  }
  60% {
    transform: translateY(0) rotate(4deg);
  }
}
.sprite-card__name {
  display: grid;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
  color: var(--wood-900);
}
.sprite-card__name small {
  width: fit-content;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--gold);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--gold-ink);
}
.sprite-card__unlock {
  margin: 0;
  font-size: var(--text-sm);
}
.sprite-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
}
.sprite-card__more {
  margin-left: auto;
  font-size: var(--text-sm);
  font-weight: 800;
}
</style>
