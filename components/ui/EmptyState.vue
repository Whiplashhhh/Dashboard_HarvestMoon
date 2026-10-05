<script setup lang="ts">
/** État vide thématique : un lutin qui fait la sieste, ou une graine qui pousse (chargement). */
withDefaults(defineProps<{ kind?: 'nap' | 'seed'; title: string }>(), { kind: 'nap' })
</script>

<template>
  <div class="empty" :role="kind === 'seed' ? 'status' : undefined">
    <div v-if="kind === 'nap'" class="empty__nap" aria-hidden="true">
      <SpriteFigure color="green" mood="sleep" :size="64" />
      <span class="empty__z pixel">z</span><span class="empty__z empty__z--2 pixel">z</span>
    </div>
    <div v-else class="empty__seed" aria-hidden="true">
      <span class="empty__soil" />
      <span class="empty__stem" />
      <span class="empty__leaf empty__leaf--l" />
      <span class="empty__leaf empty__leaf--r" />
    </div>
    <p class="empty__title">{{ title }}</p>
    <div class="empty__extra"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  text-align: center;
}
.empty__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--wood-900);
}
.empty__extra {
  color: var(--ink-soft);
}
.empty__nap {
  position: relative;
}
.empty__z {
  position: absolute;
  top: 0;
  right: -14px;
  font-size: 1.2rem;
  color: var(--wood-700);
  animation: float 2.4s ease-in-out infinite;
}
.empty__z--2 {
  right: -26px;
  top: -14px;
  font-size: 0.9rem;
  animation-delay: 1.2s;
}
@keyframes float {
  0% {
    opacity: 0;
    transform: translate(0, 6px);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(8px, -14px);
  }
}

.empty__seed {
  position: relative;
  width: 72px;
  height: 64px;
}
.empty__soil {
  position: absolute;
  bottom: 0;
  left: 6px;
  right: 6px;
  height: 16px;
  border: 3px solid var(--wood-950);
  border-radius: 50% 50% 8px 8px;
  background: var(--wood-700);
}
.empty__stem {
  position: absolute;
  bottom: 13px;
  left: 34px;
  width: 5px;
  height: 30px;
  border-radius: 3px;
  background: var(--meadow-600);
  transform-origin: bottom;
  animation: grow 1.8s var(--ease-soft) infinite alternate;
}
.empty__leaf {
  position: absolute;
  bottom: 34px;
  width: 18px;
  height: 11px;
  border: 2px solid var(--meadow-700);
  background: var(--meadow-500);
  border-radius: 0 100% 0 100%;
  transform-origin: bottom center;
  animation: unfold 1.8s var(--ease-soft) infinite alternate;
}
.empty__leaf--l {
  left: 18px;
  transform: scaleX(-1);
}
.empty__leaf--r {
  left: 37px;
}
@keyframes grow {
  from {
    transform: scaleY(0.3);
  }
}
@keyframes unfold {
  from {
    opacity: 0;
    scale: 0.3;
  }
}
</style>
