<script setup lang="ts">
import { frenchSpacing } from '~/utils/text'
/**
 * Boîte de dialogue façon jeu : le texte s'écrit lettre par lettre (un clic ou Entrée le termine),
 * puis un petit triangle clignote. Les lecteurs d'écran reçoivent le texte complet immédiatement.
 */
const props = withDefaults(
  defineProps<{
    /** Une ou plusieurs « pages » de dialogue. */
    pages: string[]
    speaker?: string
    /** Lettres par seconde. */
    speed?: number
  }>(),
  { speaker: undefined, speed: 45 },
)
const emit = defineEmits<{ done: [] }>()

const reduced = useReducedMotion()
const { play } = useSound()
const root = ref<HTMLElement | null>(null)
const pageIndex = ref(0)
const shown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const current = computed(() => frenchSpacing(props.pages[pageIndex.value] ?? ''))
const typing = computed(() => shown.value < current.value.length)
const hasNext = computed(() => pageIndex.value < props.pages.length - 1)
const visibleText = computed(() => current.value.slice(0, shown.value))

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function start() {
  stop()
  if (reduced.value || !import.meta.client) {
    shown.value = current.value.length
    return
  }
  shown.value = 0
  timer = setInterval(() => {
    shown.value++
    if (shown.value % 3 === 0) play('tick')
    if (shown.value >= current.value.length) stop()
  }, 1000 / props.speed)
}

function advance() {
  const hadFocus = root.value?.contains(document.activeElement) ?? false
  if (hadFocus)
    nextTick(() => {
      if (!root.value?.contains(document.activeElement)) root.value?.focus()
    })
  if (typing.value) {
    stop()
    shown.value = current.value.length
  } else if (hasNext.value) {
    pageIndex.value++
    start()
  } else {
    emit('done')
  }
}

watch(
  () => props.pages,
  () => {
    pageIndex.value = 0
    start()
  },
)
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div ref="root" class="dialog-box" tabindex="-1" @click="advance">
    <p v-if="speaker" class="dialog-box__speaker">{{ speaker }}</p>
    <!-- Texte complet pour les technologies d'assistance -->
    <p class="visually-hidden" aria-live="polite">{{ pages.join(' ') }}</p>
    <p class="dialog-box__text" aria-hidden="true">
      <span>{{ visibleText }}</span
      ><span class="dialog-box__ghost">{{ current.slice(visibleText.length) }}</span>
    </p>
    <div class="dialog-box__footer">
      <slot />
      <button
        v-if="typing || hasNext"
        type="button"
        class="dialog-box__next"
        :aria-label="typing ? 'Afficher tout le texte' : 'Suite du dialogue'"
        @click.stop="advance"
      >
        <span
          class="dialog-box__triangle"
          :class="{ 'dialog-box__triangle--wait': typing }"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.dialog-box {
  position: relative;
  padding: var(--space-5) var(--space-5) var(--space-4);
  border: var(--border-chunky) solid var(--wood-900);
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, var(--paper-50), var(--paper-100));
  box-shadow:
    inset 0 0 0 3px #fff,
    inset 0 0 0 6px var(--season-accent-soft),
    var(--shadow-card);
  cursor: default;
}

.dialog-box:focus-visible {
  outline: 3px solid var(--wood-900);
  outline-offset: 3px;
}
.dialog-box__speaker {
  position: absolute;
  top: -1.05rem;
  left: var(--space-5);
  margin: 0;
  padding: 0.1rem 0.9rem;
  border: 3px solid var(--wood-900);
  border-radius: 999px;
  background: var(--season-accent-strong);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-sm);
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
}

.dialog-box__text {
  margin: 0;
  font-size: var(--text-lg);
  line-height: 1.6;
  min-height: 3.2em;
  color: var(--ink);
}

/* Le texte non encore écrit occupe déjà sa place : pas de saut de mise en page. */
.dialog-box__ghost {
  visibility: hidden;
}

.dialog-box__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.dialog-box__next {
  display: grid;
  place-items: center;
  width: var(--tap);
  height: var(--tap);
  margin: -8px -8px -8px 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.dialog-box__triangle {
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 12px solid var(--season-accent-strong);
  animation: bob 0.8s steps(2) infinite;
}
.dialog-box__triangle--wait {
  opacity: 0.35;
  animation: none;
}

@keyframes bob {
  50% {
    transform: translateY(4px);
  }
}
</style>
