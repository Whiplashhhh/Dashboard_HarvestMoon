<script setup lang="ts">
/** Formulaire présenté comme une lettre : papier ligné, timbre, cachet. */
defineProps<{ stamp?: string }>()
</script>

<template>
  <div class="letter">
    <span class="letter__stamp" aria-hidden="true">
      <SpriteFigure color="red" :size="30" />
      <span class="pixel">{{ stamp ?? 'POSTE' }}</span>
    </span>
    <slot />
  </div>
</template>

<style scoped>
.letter {
  position: relative;
  padding: var(--space-6) clamp(var(--space-4), 5vw, var(--space-6)) var(--space-5);
  border: var(--border-thick) solid var(--wood-900);
  border-radius: 10px;
  background:
    linear-gradient(
      90deg,
      transparent 2.6rem,
      rgb(216 67 59 / 0.25) 2.6rem,
      rgb(216 67 59 / 0.25) calc(2.6rem + 2px),
      transparent calc(2.6rem + 2px)
    ),
    repeating-linear-gradient(180deg, transparent 0 1.9rem, rgb(47 120 184 / 0.13) 1.9rem calc(1.9rem + 1px)),
    var(--paper-50);
  box-shadow:
    0 2px 0 var(--paper-300),
    0 5px 0 var(--wood-900),
    0 22px 40px -18px rgb(46 27 14 / 0.6);
  animation: slide-in 500ms var(--ease-bounce);
}
.letter__stamp {
  position: absolute;
  top: -18px;
  right: 18px;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 6px 8px 4px;
  border: 3px dashed var(--berry);
  outline: 3px solid var(--paper-50);
  background: #fff4e8;
  transform: rotate(6deg);
  font-size: 0.65rem;
  color: var(--berry-ink);
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(40px) rotate(-2deg);
  }
}
</style>
