<script setup lang="ts">
import type { Confidence } from '#shared/schemas'

defineProps<{ confidence: Confidence; notes?: string }>()
</script>

<template>
  <span
    v-if="confidence === 'low'"
    class="confidence"
    :title="notes ?? 'Information peu sûre : à vérifier en jeu.'"
  >
    <span aria-hidden="true">?</span> info à vérifier
  </span>
</template>

<style scoped>
.confidence {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--text-xs);
  font-style: italic;
  color: var(--ink-soft);
}
.confidence span {
  display: inline-grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  border: 2px dashed var(--ink-faint);
  border-radius: 50%;
  font-style: normal;
  font-weight: 800;
  font-size: 0.7rem;
}
</style>
