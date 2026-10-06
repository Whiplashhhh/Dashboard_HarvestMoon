<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        class="toast"
        :class="`toast--${toast.tone}`"
        @click="dismiss(toast.id)"
      >
        <PixelIcon
          :name="toast.tone === 'error' ? 'close' : toast.tone === 'success' ? 'check' : 'sparkle'"
          :size="20"
        />
        {{ toast.text }}
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 200;
  left: 50%;
  top: var(--space-4);
  display: grid;
  gap: var(--space-2);
  width: min(92vw, 28rem);
  transform: translateX(-50%);
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: var(--border-thick) solid var(--wood-900);
  border-radius: var(--radius-lg);
  background: var(--paper-50);
  color: var(--ink);
  font-weight: 700;
  text-align: left;
  box-shadow: var(--shadow-lift);
  pointer-events: auto;
  cursor: pointer;
}
.toast--success {
  background: #e4f6da;
}
.toast--error {
  background: #fde3e0;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 260ms var(--ease-bounce),
    opacity 200ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.95);
}
</style>
