<script setup lang="ts">
import type { PixelIconName } from '~/utils/pixel-icons'

withDefaults(
  defineProps<{
    tone?: 'season' | 'wood' | 'sky' | 'meadow' | 'gold' | 'berry' | 'plain'
    icon?: PixelIconName
  }>(),
  { tone: 'plain', icon: undefined },
)
</script>

<template>
  <span class="chip" :class="`chip--${tone}`">
    <PixelIcon v-if="icon" :name="icon" :size="14" />
    <slot />
  </span>
</template>

<style scoped>
/* Petite étiquette cartonnée */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.12rem 0.55rem;
  border: 2px solid var(--wood-900);
  border-radius: 7px;
  background: var(--paper-50);
  color: var(--wood-900);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: 0 2px 0 rgb(74 46 26 / 0.25);
}
.chip--season {
  background: var(--season-accent-soft);
}
.chip--wood {
  background: var(--wood-200);
}
.chip--sky {
  background: var(--sky-200);
}
.chip--meadow {
  background: #dcf2cf;
}
.chip--gold {
  background: #fff0c2;
}
.chip--berry {
  background: #fbd9d6;
  color: var(--berry-ink);
}
</style>
