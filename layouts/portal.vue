<script setup lang="ts">
/** Mise en page d'accueil (connexion, inscription, onboarding) : la vallée en grand, une lettre posée devant. */
const season = useThemeSeason()
</script>

<template>
  <div class="portal">
    <a class="skip-link" href="#contenu">Aller au contenu</a>
    <FarmScene class="portal__scene" :season="season" :walkers="['red', 'blue', 'yellow']" />
    <div class="portal__brand">
      <p class="portal__title sign-title">Le Carnet de la Ferme</p>
      <p class="portal__subtitle">Ton compagnon de partie pour Harvest Moon DS</p>
    </div>
    <main id="contenu" class="portal__content" tabindex="-1">
      <slot />
    </main>
    <footer class="portal__footer">
      Site de fan non officiel, non affilié à Natsume, Marvelous ou Rising Star Games ·
      <NuxtLink to="/credits">Crédits &amp; sources</NuxtLink>
    </footer>
    <ToastStack />
  </div>
</template>

<style scoped>
.portal {
  position: relative;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
}
.portal__scene {
  position: absolute;
  inset: 0 0 auto;
  height: min(58vh, 520px);
  border-bottom: var(--border-chunky) solid var(--wood-950);
}
.portal__brand {
  position: relative;
  z-index: 1;
  padding: clamp(var(--space-5), 6vh, var(--space-8)) var(--space-4) var(--space-4);
  text-align: center;
}
.portal__title {
  margin: 0;
  font-size: clamp(2.2rem, 1.4rem + 4vw, 4rem);
  line-height: 1.05;
}
.portal__subtitle {
  display: inline-block;
  margin: var(--space-3) 0 0;
  padding: 0.2rem 0.9rem;
  border: 3px solid var(--wood-950);
  border-radius: 999px;
  background: var(--paper-50);
  font-weight: 800;
  color: var(--wood-900);
}
.portal__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 34rem;
  padding: var(--space-4) var(--space-4) var(--space-6);
  outline: none;
}
.portal__content:has(.onboarding) {
  max-width: 52rem;
}
.portal__footer {
  padding: var(--space-4);
  color: var(--ink-soft);
  font-size: var(--text-xs);
  text-align: center;
}
</style>
