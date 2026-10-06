<template>
  <div class="cork"><slot /></div>
</template>

<style scoped>
/* Tableau de liège : grain en dégradés radiaux, cadre en bois */
.cork {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: var(--space-6) var(--space-4);
  padding: var(--space-6) var(--space-4) var(--space-5);
  border: var(--border-chunky) solid var(--wood-700);
  border-radius: var(--radius-md);
  background-color: #c99a5e;
  background-image:
    radial-gradient(rgb(110 64 24 / 0.35) 1.2px, transparent 1.6px),
    radial-gradient(rgb(255 236 200 / 0.3) 1px, transparent 1.4px);
  background-size:
    9px 9px,
    13px 13px;
  background-position:
    0 0,
    4px 6px;
  box-shadow:
    inset 0 0 0 3px var(--wood-950),
    inset 0 4px 12px rgb(46 27 14 / 0.4),
    0 0 0 3px var(--wood-950);
}
</style>
