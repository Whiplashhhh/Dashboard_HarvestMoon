<script setup lang="ts">
/** Onglets en marque-page de carnet (motif ARIA « tabs », navigation aux flèches). */
const props = defineProps<{ tabs: { id: string; label: string }[]; label: string; idPrefix: string }>()
const model = defineModel<string>({ required: true })
const buttons = ref<HTMLButtonElement[]>([])
const { play } = useSound()

function select(id: string, focus = false) {
  model.value = id
  play('pop')
  if (focus) {
    const index = props.tabs.findIndex((t) => t.id === id)
    nextTick(() => buttons.value[index]?.focus())
  }
}

function onKey(event: KeyboardEvent, index: number) {
  const last = props.tabs.length - 1
  const target =
    event.key === 'ArrowRight'
      ? index === last
        ? 0
        : index + 1
      : event.key === 'ArrowLeft'
        ? index === 0
          ? last
          : index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : null
  if (target === null) return
  event.preventDefault()
  select(props.tabs[target]!.id, true)
}
</script>

<template>
  <div class="bookmarks" role="tablist" :aria-label="label">
    <button
      v-for="(tab, index) in tabs"
      :id="`${idPrefix}-tab-${tab.id}`"
      ref="buttons"
      :key="tab.id"
      type="button"
      role="tab"
      class="bookmark"
      :class="`bookmark--${index % 4}`"
      :aria-selected="model === tab.id"
      :aria-controls="`${idPrefix}-panel-${tab.id}`"
      :tabindex="model === tab.id ? 0 : -1"
      @click="select(tab.id)"
      @keydown="onKey($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.bookmarks {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
  position: relative;
  z-index: 1;
}

/* Marque-page : ruban en tissu dont le bas est taillé en V */
.bookmark {
  --ribbon: var(--season-accent);
  flex: none;
  min-height: var(--tap);
  max-width: 15rem;
  padding: 0.55rem 1rem 1.1rem;
  border: 3px solid var(--wood-900);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  background: var(--ribbon);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-sm);
  line-height: 1.2;
  text-align: left;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 9px), 0 100%);
  cursor: pointer;
  transform: translateY(10px);
  transition: transform 180ms var(--ease-bounce);
  filter: saturate(0.75) brightness(0.95);
}
.bookmark--1 {
  --ribbon: var(--sky-600);
}
.bookmark--2 {
  --ribbon: var(--meadow-600);
}
.bookmark--3 {
  --ribbon: var(--wood-600);
}
.bookmark:hover {
  transform: translateY(4px);
}
.bookmark[aria-selected='true'] {
  transform: translateY(0);
  filter: none;
}
.bookmark:focus-visible {
  outline-offset: -6px;
  box-shadow: none;
  outline-color: #fff;
}
</style>
