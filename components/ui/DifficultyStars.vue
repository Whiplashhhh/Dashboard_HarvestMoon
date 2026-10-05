<script setup lang="ts">
const props = defineProps<{ value: 1 | 2 | 3 }>()
const labels = { 1: 'facile', 2: 'moyen', 3: 'difficile' } as const
const label = computed(() => `Difficulté : ${labels[props.value]} (${props.value} sur 3)`)
</script>

<template>
  <span class="stars" role="img" :aria-label="label" :title="label">
    <PixelIcon v-for="n in 3" :key="n" name="star" :size="16" :class="{ stars__off: n > value }" />
  </span>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: 2px;
}
.stars__off {
  filter: grayscale(1) opacity(0.35);
}
</style>
