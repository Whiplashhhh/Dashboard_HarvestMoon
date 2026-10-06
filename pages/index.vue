<script setup lang="ts">
import { formatGameDate, formatIn, formatSeasonDay } from '#shared/engine'
import { elapsedSince } from '~/utils/text'

useHead({ title: 'Ma ferme — Le Carnet de la Ferme' })

const { farm } = useFarm()
const { suggestions, spritesFound, upcoming, pinned, evaluations, completedObjectivesCount } = usePlayer()
const { show } = useSessionDialog()

const elapsed = computed(() => (farm.value ? elapsedSince(farm.value.lastPlayedAt) : null))

function shorten(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Accueil dialogué : temps écoulé, date du jeu, objectif en cours ou dernière note. */
const greeting = computed(() => {
  if (!farm.value || !elapsed.value) return []
  const pages: string[] = []
  const name = farm.value.farmerName
  if (elapsed.value.days === 0) pages.push(`Re-bonjour, ${name} ! On reprend là où tu en étais.`)
  else if (elapsed.value.days === 1)
    pages.push(`Bon retour à la ferme, ${name} ! Ta dernière visite date d'hier.`)
  else pages.push(`Bon retour à la ferme, ${name} ! Ça fait ${elapsed.value.label.replace('il y a ', '')}…`)
  pages.push(`Dans ton jeu, on est le ${formatGameDate(farm.value.date)}.`)
  if (pinned.value) pages.push(`La dernière fois, tu voulais : « ${pinned.value.title} ».`)
  if (farm.value.lastNote)
    pages.push(`Ta dernière note disait : « ${shorten(farm.value.lastNote.body, 140)} »`)
  if (!pinned.value)
    pages.push('Choisis un objectif ci-dessous et épingle-le pour t’en souvenir la prochaine fois.')
  return pages
})

const top = computed(() => suggestions.value.filter((s) => s.objective.id !== pinned.value?.id).slice(0, 4))
const tilts = [-1.2, 0.8, -0.5, 1.1, -0.9]
</script>

<template>
  <div v-if="farm" class="page home">
    <h1 class="visually-hidden">Ma ferme</h1>

    <DialogBox :speaker="farm.farmName" :pages="greeting">
      <GameButton variant="paper" size="sm" icon="pencil" @click="show">J'ai joué : mettre à jour</GameButton>
    </DialogBox>

    <GameGate>
      <div class="home__grid">
        <section class="home__main" aria-labelledby="todo-title">
          <PaperCard v-if="pinned" as="section" aria-labelledby="pinned-title">
            <h2 id="pinned-title" class="section-title">
              <PixelIcon name="pin" :size="28" /> Mon objectif en cours
            </h2>
            <ObjectiveCard
              :objective="pinned"
              :evaluation="evaluations.get(pinned.id)"
              variant="sign"
              heading-level="h3"
            />
          </PaperCard>

          <div>
            <h2 id="todo-title" class="section-title">
              <PixelIcon name="objectives" :size="28" /> Que faire maintenant ?
            </h2>
            <CorkBoard v-if="top.length">
              <ObjectiveCard
                v-for="(suggestion, i) in top"
                :key="suggestion.objective.id"
                :objective="suggestion.objective"
                :reasons="suggestion.reasons"
                :tilt="tilts[i]"
              />
            </CorkBoard>
            <PaperCard v-else tone="white">
              <EmptyState title="Rien de disponible pour l’instant">
                Avance un peu dans le jeu, puis mets à jour ta date : de nouveaux objectifs vont pousser.
              </EmptyState>
            </PaperCard>
            <p class="home__more">
              <NuxtLink to="/objectifs?statut=available">Voir tous les objectifs disponibles →</NuxtLink>
            </p>
          </div>
        </section>

        <aside class="home__side" aria-label="Résumé de ma partie">
          <PaperCard as="section" aria-labelledby="progress-title">
            <h2 id="progress-title" class="section-title">
              <PixelIcon name="sprite" :size="28" /> Ma progression
            </h2>
            <ProgressTrail :value="spritesFound" />
            <dl class="home__stats">
              <div>
                <dt>Objectifs accomplis</dt>
                <dd class="pixel">{{ completedObjectivesCount }}</dd>
              </div>
              <div>
                <dt>Date du jeu</dt>
                <dd class="pixel">{{ formatGameDate(farm.date) }}</dd>
              </div>
            </dl>
          </PaperCard>

          <PaperCard as="section" aria-labelledby="soon-title">
            <h2 id="soon-title" class="section-title">
              <PixelIcon name="calendar" :size="28" /> Bientôt dans la vallée
            </h2>
            <ul v-if="upcoming.length" class="events">
              <li v-for="event in upcoming" :key="event.kind + event.id" class="event">
                <PixelIcon :name="event.kind === 'festival' ? 'flag' : 'cake'" :size="28" />
                <div>
                  <p class="event__name">
                    <NuxtLink
                      v-if="event.kind === 'festival' && event.objectiveId"
                      :to="`/objectifs/${event.objectiveId}`"
                      >{{ event.name }}</NuxtLink
                    >
                    <template v-else-if="event.kind === 'birthday'"
                      >Anniversaire de {{ event.name }}</template
                    >
                    <template v-else>{{ event.name }}</template>
                  </p>
                  <p class="event__when">
                    {{ formatSeasonDay(event) }} · <strong>{{ formatIn(event.inDays) }}</strong>
                  </p>
                </div>
              </li>
            </ul>
            <p v-else class="muted">Aucun festival ni anniversaire dans les 7 prochains jours.</p>
            <p class="home__more"><NuxtLink to="/calendrier">Ouvrir le calendrier →</NuxtLink></p>
          </PaperCard>

          <PaperCard as="section" aria-labelledby="note-title">
            <h2 id="note-title" class="section-title">
              <PixelIcon name="notebook" :size="28" /> Dernière note
            </h2>
            <blockquote v-if="farm.lastNote" class="note">
              <p>{{ farm.lastNote.body }}</p>
              <footer class="pixel">{{ formatGameDate(farm.lastNote.date) }}</footer>
            </blockquote>
            <p v-else class="muted">Pas encore de note. Écris-en une à la fin de ta prochaine session !</p>
            <p class="home__more"><NuxtLink to="/carnet">Ouvrir mon carnet →</NuxtLink></p>
          </PaperCard>
        </aside>
      </div>
    </GameGate>
  </div>
</template>

<style scoped>
.home__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}
@media (min-width: 1100px) {
  .home__grid {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
.home__main,
.home__side {
  display: grid;
  gap: var(--space-5);
  align-content: start;
}
.home__more {
  margin: var(--space-3) 0 0;
  text-align: right;
  font-weight: 800;
}
.home__stats {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
}
.home__stats div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 2px dashed var(--paper-400);
  border-radius: var(--radius-sm);
}
.home__stats dt {
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--ink-soft);
}
.home__stats dd {
  margin: 0;
  font-size: 1.15rem;
  color: var(--wood-900);
}
.events {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.event {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.event p {
  margin: 0;
}
.event__name {
  font-weight: 800;
}
.event__when {
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
.note {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-left: 5px solid var(--season-accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: #fff;
  font-style: italic;
}
.note p {
  margin: 0 0 var(--space-2);
  white-space: pre-line;
}
.note footer {
  font-style: normal;
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
.muted {
  color: var(--ink-soft);
  margin: 0;
}
</style>
