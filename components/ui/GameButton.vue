<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { PixelIconName } from '~/utils/pixel-icons'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'wood' | 'paper' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    to?: RouteLocationRaw
    type?: 'button' | 'submit' | 'reset'
    icon?: PixelIconName
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    to: undefined,
    type: 'button',
    icon: undefined,
    disabled: false,
    loading: false,
    block: false,
  },
)

const { play } = useSound()
const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-disabled="disabled || loading ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    class="game-button"
    :class="[`game-button--${variant}`, `game-button--${size}`, { 'game-button--block': block }]"
    @click="play('pop')"
  >
    <span class="game-button__face">
      <PixelIcon v-if="icon" :name="icon" :size="size === 'sm' ? 18 : 24" />
      <span class="game-button__label"><slot /></span>
      <span v-if="loading" class="game-button__dots" aria-hidden="true"><i /><i /><i /></span>
    </span>
  </component>
</template>

<style scoped>
.game-button {
  --btn-bg: var(--meadow-500);
  --btn-bg-hover: var(--meadow-600);
  --btn-edge: var(--meadow-700);
  --btn-ink: #fff;
  --btn-depth: 5px;

  position: relative;
  display: inline-flex;
  min-height: var(--tap);
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--wood-950);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  padding-bottom: var(--btn-depth);
}

.game-button__face {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0.55rem 1.15rem;
  border: 3px solid var(--wood-950);
  border-radius: var(--radius-md);
  background: var(--btn-bg);
  color: var(--btn-ink);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  line-height: 1.2;
  box-shadow:
    inset 0 3px 0 rgb(255 255 255 / 0.28),
    inset 0 -4px 0 var(--btn-edge);
  transform: translateY(0);
  transition:
    transform 90ms ease,
    background-color 160ms ease,
    box-shadow 90ms ease;
}

.game-button:hover .game-button__face {
  background: var(--btn-bg-hover);
}

.game-button:active:not([aria-disabled='true']) .game-button__face {
  transform: translateY(calc(var(--btn-depth) - 1px));
  box-shadow:
    inset 0 2px 0 rgb(0 0 0 / 0.12),
    inset 0 -1px 0 var(--btn-edge);
}

.game-button:focus-visible {
  outline: 3px solid var(--wood-900);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px var(--sun);
}

.game-button[aria-disabled='true'] {
  cursor: not-allowed;
  filter: grayscale(0.6);
  opacity: 0.7;
}

.game-button--wood {
  --btn-bg: var(--wood-500);
  --btn-bg-hover: var(--wood-600);
  --btn-edge: var(--wood-800);
  --btn-ink: var(--paper-50);
}
.game-button--paper {
  --btn-bg: var(--paper-100);
  --btn-bg-hover: var(--paper-200);
  --btn-edge: var(--paper-400);
  --btn-ink: var(--wood-900);
}
.game-button--danger {
  --btn-bg: var(--berry);
  --btn-bg-hover: #b23840;
  --btn-edge: var(--berry-ink);
  --btn-ink: #fff;
}
.game-button--ghost {
  background: transparent;
  padding-bottom: 0;
}
.game-button--ghost .game-button__face {
  border-color: transparent;
  background: transparent;
  color: var(--wood-900);
  box-shadow: none;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
.game-button--ghost:hover .game-button__face {
  background: rgb(122 74 38 / 0.08);
}
.game-button--ghost:active .game-button__face {
  transform: none;
}

.game-button--sm .game-button__face {
  padding: 0.35rem 0.8rem;
  font-size: 0.95rem;
}
.game-button--lg .game-button__face {
  padding: 0.75rem 1.6rem;
  font-size: 1.25rem;
}
.game-button--block {
  display: flex;
  width: 100%;
}

.game-button__dots {
  display: inline-flex;
  gap: 3px;
}
.game-button__dots i {
  width: 6px;
  height: 6px;
  background: currentColor;
  animation: dot 0.9s infinite steps(2);
}
.game-button__dots i:nth-child(2) {
  animation-delay: 0.15s;
}
.game-button__dots i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes dot {
  50% {
    transform: translateY(-4px);
  }
}
</style>
