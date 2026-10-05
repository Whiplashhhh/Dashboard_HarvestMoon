<script setup lang="ts">
import { gridToLayers, PIXEL_ICONS, type PixelIconName } from '~/utils/pixel-icons'

const props = withDefaults(
  defineProps<{
    name: PixelIconName
    /** Taille en pixels CSS (multiple de 12 conseillé pour un rendu net). */
    size?: number
    /** Texte alternatif ; sans label, l'icône est décorative. */
    label?: string
  }>(),
  { size: 24, label: undefined },
)

const layers = computed(() => gridToLayers(PIXEL_ICONS[props.name]))
</script>

<template>
  <svg
    class="pixel-icon"
    :width="size"
    :height="size"
    viewBox="0 0 12 12"
    shape-rendering="crispEdges"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path v-for="layer in layers" :key="layer.color" :d="layer.d" :fill="layer.color" />
  </svg>
</template>

<style scoped>
.pixel-icon {
  flex: none;
  image-rendering: pixelated;
}
</style>
