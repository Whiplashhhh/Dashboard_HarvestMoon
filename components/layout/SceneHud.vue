<script setup lang="ts">
import { SEASON_LABELS, WEEKDAY_LABELS } from '#shared/schemas'
import { weekdayOf } from '#shared/engine'
import { WEATHER_LABELS, weatherFor } from '~/utils/weather'

/** Informations « écran du haut » : ferme, date du jeu, compteur de lutins. */
const { farm } = useFarm()
const { game } = useGame()
const { spritesFound } = usePlayer()
const weather = computed(() => (farm.value ? WEATHER_LABELS[weatherFor(farm.value.date)] : ''))

const weekday = computed(() =>
  farm.value && game.value
    ? WEEKDAY_LABELS[weekdayOf(farm.value.date, game.value.calendar.firstWeekday)]
    : null,
)
</script>

<template>
  <div v-if="farm" class="hud">
    <NuxtLink to="/" class="hud__sign" :aria-label="`Ma ferme : ${farm.farmName}`">
      <span class="hud__farm sign-title">{{ farm.farmName }}</span>
      <span class="hud__farmer">{{ farm.farmerName }}</span>
    </NuxtLink>
    <div class="hud__right">
      <p
        class="hud__date pixel"
        :aria-label="`Date dans le jeu : ${weekday ?? ''} ${farm.date.day} ${SEASON_LABELS[farm.date.season]}, an ${farm.date.year}`"
      >
        <span v-if="weekday" class="hud__weekday">{{ weekday.slice(0, 3) }}.</span>
        <strong>{{ farm.date.day }}</strong> {{ SEASON_LABELS[farm.date.season] }}
        <span class="hud__year">An {{ farm.date.year }}</span>
        <span class="hud__weather" :title="`Météo décorative : ${weather}`">· {{ weather }}</span>
      </p>
      <NuxtLink
        to="/lutins"
        class="hud__sprites pixel"
        :aria-label="`${spritesFound} lutins trouvés sur 101`"
      >
        <PixelIcon name="sprite" :size="20" />{{ game ? spritesFound : '…' }}<small>/101</small>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}
.hud__sign {
  display: grid;
  max-width: 55%;
  padding: 0.35rem 0.9rem 0.45rem;
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-sm);
  background:
    repeating-linear-gradient(97deg, transparent 0 18px, rgb(122 74 38 / 0.18) 18px 20px),
    linear-gradient(180deg, var(--wood-600), var(--wood-700));
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.25),
    0 4px 0 var(--wood-950);
  text-decoration: none;
  transform: rotate(-1.5deg);
  transition: transform 200ms var(--ease-bounce);
}
.hud__sign:hover {
  transform: rotate(0) translateY(-2px);
}
.hud__farm {
  font-size: clamp(1.05rem, 0.8rem + 1.2vw, 1.6rem);
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hud__farmer {
  color: var(--paper-100);
  font-size: var(--text-xs);
  font-weight: 800;
  text-shadow: 0 1px 0 var(--wood-950);
}
.hud__right {
  display: grid;
  justify-items: end;
  gap: var(--space-2);
}
.hud__date,
.hud__sprites {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0;
  padding: 0.25rem 0.7rem;
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-sm);
  background: var(--paper-50);
  color: var(--wood-900);
  font-size: 1.05rem;
  box-shadow: 0 3px 0 var(--wood-950);
  white-space: nowrap;
}
.hud__date strong {
  font-size: 1.35rem;
  color: var(--season-accent-strong);
}
.hud__weekday,
.hud__year,
.hud__weather {
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.hud__sprites {
  align-items: center;
  text-decoration: none;
}
.hud__sprites small {
  color: var(--ink-soft);
}
@media (max-width: 520px) {
  .hud {
    padding: var(--space-2) var(--space-3);
  }
  .hud__date {
    font-size: 0.9rem;
  }
  .hud__date strong {
    font-size: 1.1rem;
  }
  .hud__year,
  .hud__weather,
  .hud__weekday {
    display: none;
  }
  .hud__sprites {
    font-size: 0.9rem;
  }
}
</style>
