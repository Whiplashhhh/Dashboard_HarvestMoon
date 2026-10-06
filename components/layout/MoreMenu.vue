<script setup lang="ts">
import { MORE_NAV } from '~/utils/navigation'

defineProps<{ placement?: 'up' | 'down' }>()
const { logout } = useAuth()
const route = useRoute()
const details = ref<HTMLDetailsElement | null>(null)

watch(
  () => route.fullPath,
  () => details.value?.removeAttribute('open'),
)

function onFocusOut(event: FocusEvent) {
  if (!details.value?.contains(event.relatedTarget as Node | null)) details.value?.removeAttribute('open')
}
function onOutside(event: MouseEvent) {
  if (details.value?.open && !details.value.contains(event.target as Node))
    details.value.removeAttribute('open')
}
onMounted(() => document.addEventListener('click', onOutside))
onBeforeUnmount(() => document.removeEventListener('click', onOutside))

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && details.value?.open) {
    details.value.removeAttribute('open')
    details.value.querySelector('summary')?.focus()
  }
}
</script>

<template>
  <details
    ref="details"
    class="more"
    :class="`more--${placement ?? 'down'}`"
    @keydown="onKey"
    @focusout="onFocusOut"
  >
    <summary class="more__trigger">
      <span class="more__dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="more__label">Plus</span>
    </summary>
    <ul class="more__panel">
      <li v-for="item in MORE_NAV" :key="item.to">
        <NuxtLink :to="item.to" class="more__item">
          <PixelIcon :name="item.icon" :size="24" />
          {{ item.label }}
        </NuxtLink>
      </li>
      <li>
        <button type="button" class="more__item" @click="logout">
          <PixelIcon name="door" :size="24" />
          Se déconnecter
        </button>
      </li>
    </ul>
  </details>
</template>

<style scoped>
.more {
  position: relative;
}
.more__trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: var(--tap);
  min-height: var(--tap);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  list-style: none;
  color: inherit;
  font-weight: 700;
  font-size: var(--text-xs);
}
.more__trigger::-webkit-details-marker {
  display: none;
}
.more__dots {
  display: flex;
  gap: 3px;
  height: 24px;
  align-items: center;
}
.more__dots i {
  width: 6px;
  height: 6px;
  background: currentColor;
}
.more__panel {
  position: absolute;
  right: 0;
  z-index: 60;
  min-width: 15rem;
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  border: var(--border-thick) solid var(--wood-900);
  border-radius: var(--radius-md);
  background: var(--paper-50);
  box-shadow: var(--shadow-lift);
  animation: pop-in 180ms var(--ease-bounce);
}
.more--down .more__panel {
  top: calc(100% + 8px);
}
.more--up .more__panel {
  bottom: calc(100% + 12px);
}
.more__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--tap);
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--wood-900);
  font-weight: 700;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.more__item:hover,
.more__item.router-link-active {
  background: var(--season-accent-soft);
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
  }
}
</style>
