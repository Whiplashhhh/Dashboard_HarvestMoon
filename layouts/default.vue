<script setup lang="ts">
/**
 * Mise en page « DS ouverte » : écran du haut = la vallée vivante ; charnière = navigation ;
 * écran du bas = le contenu interactif. Sur mobile : bandeau compact + barre de navigation au pouce.
 */
const season = useThemeSeason()
const { foundTeamColors } = usePlayer()
const { show } = useSessionDialog()
const { farm, load } = useFarm()

await load()
</script>

<template>
  <div class="ds">
    <a class="skip-link" href="#contenu">Aller au contenu</a>

    <header class="ds__top">
      <FarmScene class="ds__scene" :season="season" :walkers="foundTeamColors">
        <SceneHud />
      </FarmScene>
    </header>

    <div class="ds__hinge">
      <AppNav variant="hinge" />
      <GameButton v-if="farm" class="ds__session" variant="wood" icon="pencil" @click="show"
        >Fin de session</GameButton
      >
    </div>

    <main id="contenu" class="ds__bottom" tabindex="-1">
      <slot />
    </main>

    <footer class="ds__footer">
      <p>
        <strong>Le Carnet de la Ferme</strong> — site de fan non officiel, non affilié à Natsume, Marvelous ou
        Rising Star Games. Données du jeu : <NuxtLink to="/credits">Crédits &amp; sources</NuxtLink> (CC
        BY-SA).
      </p>
    </footer>

    <AppNav class="ds__bar" variant="bar" />
    <button v-if="farm" type="button" class="ds__fab" @click="show">
      <PixelIcon name="pencil" :size="28" />
      <span class="visually-hidden">Fin de session : mettre à jour ma partie</span>
    </button>

    <SessionDialog />
    <ToastStack />
  </div>
</template>

<style scoped>
.ds {
  --screen-max: 1180px;
  --screen-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: var(--space-4) var(--space-4) 0;
}

.ds__top,
.ds__bottom,
.ds__hinge,
.ds__footer {
  width: 100%;
  max-width: var(--screen-max);
}

/* Écran du haut */
.ds__top {
  position: relative;
  border: var(--border-chunky) solid var(--wood-950);
  border-radius: var(--screen-radius);
  overflow: hidden;
  box-shadow:
    inset 0 0 0 3px rgb(255 255 255 / 0.35),
    var(--shadow-lift);
}
.ds__scene {
  height: clamp(210px, 32vh, 320px);
}

/* Charnière : planche en bois qui relie les deux écrans */
.ds__hinge {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: calc(100% - 48px);
  max-width: calc(var(--screen-max) - 48px);
  margin: -6px 0;
  padding: var(--space-2) var(--space-4);
  border: var(--border-thick) solid var(--wood-950);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background:
    repeating-linear-gradient(97deg, transparent 0 22px, rgb(46 27 14 / 0.12) 22px 24px),
    linear-gradient(180deg, var(--wood-500), var(--wood-600));
  box-shadow:
    inset 0 3px 0 rgb(255 255 255 / 0.2),
    0 5px 0 var(--wood-950);
}

/* Écran du bas : le carnet */
.ds__bottom {
  flex: 1;
  margin-top: var(--space-5);
  padding: clamp(var(--space-4), 3vw, var(--space-6));
  border: var(--border-chunky) solid var(--wood-950);
  border-radius: var(--screen-radius);
  background:
    linear-gradient(90deg, rgb(122 74 38 / 0.06) 0 2px, transparent 2px) 0 0 / 100% 100%,
    var(--paper-100);
  box-shadow:
    inset 0 0 0 4px var(--paper-50),
    inset 0 0 0 7px rgb(217 184 128 / 0.5),
    var(--shadow-lift);
  outline: none;
}

.ds__footer {
  padding: var(--space-5) var(--space-2) var(--space-6);
  color: var(--ink-soft);
  font-size: var(--text-xs);
  text-align: center;
}
.ds__footer p {
  margin: 0;
}

.ds__bar,
.ds__fab {
  display: none;
}

/* — Mobile et tablette en portrait — */
@media (max-width: 899px) {
  .ds {
    padding: 0;
  }
  .ds__top {
    position: sticky;
    top: 0;
    z-index: 30;
    border-width: 0 0 var(--border-thick);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
  .ds__scene {
    height: clamp(128px, 22vh, 220px);
  }
  .ds__hinge {
    display: none;
  }
  .ds__bottom {
    width: auto;
    align-self: stretch;
    margin: var(--space-4) var(--space-3) 0;
    padding: var(--space-4);
    border-width: var(--border-thick);
    border-radius: var(--radius-lg);
  }
  .ds__footer {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }
  .ds__bar {
    display: block;
  }
  .ds__fab {
    position: fixed;
    right: var(--space-4);
    bottom: calc(80px + env(safe-area-inset-bottom));
    z-index: 55;
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border: var(--border-thick) solid var(--wood-950);
    border-radius: 50%;
    background: var(--season-accent);
    box-shadow:
      inset 0 3px 0 rgb(255 255 255 / 0.35),
      0 5px 0 var(--wood-950);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  .ds__fab:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0 var(--wood-950);
  }
}

@media (max-width: 899px) and (min-height: 900px) {
  .ds__scene {
    height: 220px;
  }
}
</style>
