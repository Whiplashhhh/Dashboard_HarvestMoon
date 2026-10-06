<script setup lang="ts">
/** Petits confettis de feuilles lors d'une célébration (désactivés si animations réduites). */
const props = defineProps<{ trigger: number }>()
const reduced = useReducedMotion()
const bursts = ref<number[]>([])

watch(
  () => props.trigger,
  (value) => {
    if (reduced.value || !value) return
    bursts.value = [...bursts.value, value]
    setTimeout(() => (bursts.value = bursts.value.filter((b) => b !== value)), 1100)
  },
)
const leaves = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360 + (i % 3) * 9,
  distance: 38 + (i % 4) * 12,
  hue: ['var(--meadow-500)', 'var(--season-accent)', 'var(--gold)', 'var(--meadow-300)'][i % 4],
}))
</script>

<template>
  <span class="burst-host" aria-hidden="true">
    <span v-for="b in bursts" :key="b" class="burst">
      <i
        v-for="(leaf, i) in leaves"
        :key="i"
        :style="{ '--angle': `${leaf.angle}deg`, '--distance': `${leaf.distance}px`, background: leaf.hue }"
      />
    </span>
  </span>
</template>

<style scoped>
.burst-host {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;
}
.burst {
  position: absolute;
}
.burst i {
  position: absolute;
  width: 10px;
  height: 7px;
  margin: -3px 0 0 -5px;
  border: 1.5px solid rgb(46 27 14 / 0.6);
  border-radius: 0 70% 0 70%;
  animation: fly 1s var(--ease-soft) forwards;
}
@keyframes fly {
  from {
    transform: rotate(var(--angle)) translateX(0) rotate(0);
    opacity: 1;
  }
  to {
    transform: rotate(var(--angle)) translateX(var(--distance)) rotate(260deg) translateY(14px);
    opacity: 0;
  }
}
</style>
