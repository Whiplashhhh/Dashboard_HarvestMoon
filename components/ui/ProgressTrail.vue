<script setup lang="ts">
/**
 * Jauge en bois vers 60 puis 101 lutins : une planche qui se remplit de « prairie »,
 * avec des bornes à 60 (Déesse) et 101 (collection complète).
 */
const props = withDefaults(
  defineProps<{ value: number; max?: number; milestone?: number; label?: string }>(),
  {
    max: 101,
    milestone: 60,
    label: 'Lutins trouvés',
  },
)
const percent = computed(() => Math.min(100, (props.value / props.max) * 100))
const milestonePercent = computed(() => (props.milestone / props.max) * 100)
const reached = computed(() => props.value >= props.milestone)
</script>

<template>
  <div class="trail">
    <div class="trail__head">
      <span class="trail__label">{{ label }}</span>
      <span class="trail__count pixel"
        >{{ value }}<small>/{{ max }}</small></span
      >
    </div>
    <div
      class="trail__track"
      role="progressbar"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-label="`${label} : ${value} sur ${max}`"
    >
      <div class="trail__fill" :style="{ width: `${percent}%` }" />
      <div
        class="trail__post"
        :class="{ 'trail__post--reached': reached }"
        :style="{ left: `${milestonePercent}%` }"
      >
        <span class="trail__flag pixel">{{ milestone }}</span>
      </div>
    </div>
    <p class="trail__hint">
      <template v-if="!reached"
        >Encore {{ milestone - value }} lutin{{ milestone - value > 1 ? 's' : '' }} pour restaurer la
        Déesse.</template
      >
      <template v-else-if="value < max"
        >Déesse restaurable ! Encore {{ max - value }} pour la collection complète.</template
      >
      <template v-else>Collection complète, bravo !</template>
    </p>
  </div>
</template>

<style scoped>
.trail__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-2);
}
.trail__label {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--wood-900);
}
.trail__count {
  font-size: var(--text-xl);
  color: var(--wood-900);
}
.trail__count small {
  font-size: 0.7em;
  color: var(--ink-soft);
}
.trail__track {
  position: relative;
  height: 22px;
  border: 3px solid var(--wood-950);
  border-radius: 999px;
  background: repeating-linear-gradient(90deg, var(--wood-300) 0 14px, var(--wood-200) 14px 16px);
  box-shadow: inset 0 3px 0 rgb(46 27 14 / 0.2);
}
.trail__fill {
  height: 100%;
  border-radius: 999px;
  background:
    repeating-linear-gradient(115deg, transparent 0 6px, rgb(255 255 255 / 0.18) 6px 9px),
    linear-gradient(180deg, var(--meadow-300), var(--meadow-500));
  box-shadow: inset 0 -3px 0 var(--meadow-700);
  transition: width 900ms var(--ease-soft);
}
.trail__post {
  position: absolute;
  top: -12px;
  bottom: -6px;
  width: 4px;
  margin-left: -2px;
  background: var(--wood-950);
}
.trail__flag {
  position: absolute;
  bottom: 100%;
  left: 2px;
  padding: 0 4px;
  border: 2px solid var(--wood-950);
  border-radius: 3px;
  background: var(--paper-50);
  font-size: 0.75rem;
  line-height: 1.2;
  color: var(--wood-900);
}
.trail__post--reached .trail__flag {
  background: var(--sun);
}
.trail__hint {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
</style>
