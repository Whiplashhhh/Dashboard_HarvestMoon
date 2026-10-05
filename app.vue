<script setup lang="ts">
const season = useThemeSeason()
const daytime = useDaytime()
const reduced = useSettings()

useHead({
  htmlAttrs: {
    'data-season': season,
    'data-daytime': daytime,
    'data-motion': computed(() => (reduced.value.reducedMotion ? 'reduced' : undefined)),
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
