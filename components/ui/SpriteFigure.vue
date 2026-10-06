<script setup lang="ts">
/**
 * Lutin générique et original : petit corps rond crème, grands yeux, chapeau pointu recourbé
 * dans la couleur de son équipe. Aucune reprise du design officiel.
 */
const props = withDefaults(
  defineProps<{
    color?: string
    size?: number
    found?: boolean
    /** Animation : immobile, respiration, sieste. */
    mood?: 'idle' | 'breathe' | 'sleep'
    label?: string
  }>(),
  { color: 'brown', size: 48, found: true, mood: 'idle', label: undefined },
)

const hat = computed(() => (props.found ? `var(--team-${props.color})` : 'var(--wood-700)'))
</script>

<template>
  <svg
    class="sprite"
    :class="[`sprite--${mood}`, { 'sprite--unknown': !found }]"
    :width="size"
    :height="size * 1.2"
    viewBox="0 0 40 48"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    :style="{ '--hat': hat }"
  >
    <g class="sprite__body">
      <!-- pieds -->
      <ellipse cx="13.5" cy="44.5" rx="4.5" ry="2.6" class="sprite__feet" />
      <ellipse cx="26.5" cy="44.5" rx="4.5" ry="2.6" class="sprite__feet" />
      <!-- corps -->
      <ellipse cx="20" cy="31" rx="14" ry="13" class="sprite__skin" />
      <!-- chapeau pointu recourbé -->
      <path
        class="sprite__hat"
        d="M5.5 24.5C8 15 14 7 30 2.5c-3.6 4.4-3.4 11 4.6 21.5-9.5 3.4-19.6 3.6-29.1.5Z"
      />
      <path class="sprite__band" d="M6 23.2c9.3 3 18.8 2.8 28-.4l.9 2.2c-9.8 3.4-19.9 3.6-29.8.4Z" />
      <circle cx="30" cy="2.8" r="2.4" class="sprite__pompom" />
      <template v-if="found">
        <!-- yeux -->
        <g class="sprite__eyes">
          <ellipse cx="14.6" cy="32" rx="2.1" ry="2.8" />
          <ellipse cx="25.4" cy="32" rx="2.1" ry="2.8" />
          <circle cx="15.3" cy="31" r="0.8" fill="#fff" />
          <circle cx="26.1" cy="31" r="0.8" fill="#fff" />
        </g>
        <path class="sprite__closed" d="M12.4 32.4q2.2 1.8 4.4 0M23.2 32.4q2.2 1.8 4.4 0" />
        <ellipse cx="10.8" cy="36.4" rx="2.3" ry="1.3" fill="#f7a9b9" opacity="0.8" />
        <ellipse cx="29.2" cy="36.4" rx="2.3" ry="1.3" fill="#f7a9b9" opacity="0.8" />
        <path d="M18 37.4q2 1.6 4 0" class="sprite__mouth" />
      </template>
      <text v-else x="20" y="38.5" text-anchor="middle" class="sprite__question">?</text>
    </g>
  </svg>
</template>

<style scoped>
.sprite {
  overflow: visible;
  flex: none;
}
.sprite__skin {
  fill: #fff7e8;
  stroke: var(--wood-950);
  stroke-width: 2;
}
.sprite__feet {
  fill: var(--hat);
  stroke: var(--wood-950);
  stroke-width: 2;
}
.sprite__hat {
  fill: var(--hat);
  stroke: var(--wood-950);
  stroke-width: 2;
  stroke-linejoin: round;
}
.sprite__band {
  fill: rgb(0 0 0 / 0.22);
}
.sprite__pompom {
  fill: #fff7e8;
  stroke: var(--wood-950);
  stroke-width: 1.6;
}
.sprite__eyes {
  fill: var(--wood-950);
}
.sprite__closed {
  display: none;
  fill: none;
  stroke: var(--wood-950);
  stroke-width: 1.6;
  stroke-linecap: round;
}
.sprite__mouth {
  fill: none;
  stroke: var(--wood-950);
  stroke-width: 1.4;
  stroke-linecap: round;
}

.sprite--unknown .sprite__skin,
.sprite--unknown .sprite__feet,
.sprite--unknown .sprite__pompom {
  fill: rgb(74 46 26 / 0.18);
  stroke: rgb(74 46 26 / 0.55);
  stroke-dasharray: 3 2.5;
}
.sprite--unknown .sprite__hat {
  fill: rgb(74 46 26 / 0.28);
  stroke: rgb(74 46 26 / 0.55);
  stroke-dasharray: 3 2.5;
}
.sprite__question {
  font-family: var(--font-pixel);
  font-size: 15px;
  font-weight: 700;
  fill: var(--wood-800);
}

/* L'animation porte sur l'élément <svg> lui-même (transform composité par le GPU), pas sur un groupe interne. */
.sprite--breathe,
.sprite--sleep {
  transform-origin: 50% 96%;
  animation: breathe 2.6s ease-in-out infinite;
}
.sprite--sleep {
  animation-duration: 3.6s;
}
.sprite--sleep .sprite__eyes {
  display: none;
}
.sprite--sleep .sprite__closed {
  display: inline;
}

@keyframes breathe {
  50% {
    transform: scale(1.04, 0.96);
  }
}
</style>
