<script setup lang="ts">
withDefaults(defineProps<{ as?: string; padded?: boolean; tone?: 'paper' | 'white' }>(), {
  as: 'section',
  padded: true,
  tone: 'paper',
})
</script>

<template>
  <component :is="as" class="paper-card" :class="[`paper-card--${tone}`, { 'paper-card--padded': padded }]">
    <slot />
  </component>
</template>

<style scoped>
/* Fenêtre de dialogue façon jeu DS : bordure épaisse arrondie, liseré intérieur clair. */
.paper-card {
  position: relative;
  border: var(--border-thick) solid var(--wood-900);
  border-radius: var(--radius-lg);
  background: var(--paper-100);
  box-shadow:
    inset 0 0 0 3px var(--paper-50),
    inset 0 0 0 5px rgb(217 184 128 / 0.6),
    var(--shadow-card);
  color: var(--ink);
}
.paper-card--white {
  background: var(--paper-50);
}
.paper-card--padded {
  padding: clamp(var(--space-4), 3vw, var(--space-6));
}
</style>
