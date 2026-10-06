<script setup lang="ts">
/** Affiche le contenu une fois les données du jeu chargées (graine qui pousse en attendant). */
const { game, error, load } = useGame()
</script>

<template>
  <slot v-if="game" />
  <PaperCard v-else-if="error" tone="white">
    <EmptyState title="Le facteur s'est perdu en chemin…">
      <p>{{ error }}</p>
      <GameButton variant="wood" @click="load">Réessayer</GameButton>
    </EmptyState>
  </PaperCard>
  <EmptyState v-else kind="seed" title="Le carnet s'ouvre…" />
</template>
