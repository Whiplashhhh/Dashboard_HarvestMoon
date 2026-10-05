<script setup lang="ts">
withDefaults(defineProps<{ as?: string; nails?: boolean; tone?: 'light' | 'dark' }>(), {
  as: 'div',
  nails: true,
  tone: 'light',
})
</script>

<template>
  <component :is="as" class="wood-panel" :class="[`wood-panel--${tone}`, { 'wood-panel--nails': nails }]">
    <slot />
  </component>
</template>

<style scoped>
/* Panneau en bois cloué : planches horizontales, veinage en dégradés, clous aux coins. */
.wood-panel {
  --plank: var(--wood-400);
  --plank-dark: var(--wood-500);
  position: relative;
  padding: var(--space-4) var(--space-5);
  border: var(--border-thick) solid var(--wood-950);
  border-radius: var(--radius-md);
  color: var(--paper-50);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent 30%),
    repeating-linear-gradient(
      180deg,
      transparent 0 calc(2.6rem - 3px),
      rgb(46 27 14 / 0.55) calc(2.6rem - 3px) 2.6rem
    ),
    repeating-linear-gradient(
      97deg,
      transparent 0 18px,
      rgb(122 74 38 / 0.16) 18px 20px,
      transparent 20px 47px,
      rgb(255 255 255 / 0.07) 47px 49px
    ),
    linear-gradient(180deg, var(--plank), var(--plank-dark));
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.25),
    inset 0 -4px 0 rgb(46 27 14 / 0.35),
    0 4px 0 var(--wood-950);
}

.wood-panel--dark {
  --plank: var(--wood-600);
  --plank-dark: var(--wood-700);
}

.wood-panel--nails::before,
.wood-panel--nails::after {
  content: '';
  position: absolute;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e7e1d6 0 25%, #8b8172 50%, #4b4338 100%);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.35);
}
.wood-panel--nails::before {
  left: 8px;
}
.wood-panel--nails::after {
  right: 8px;
}
</style>
