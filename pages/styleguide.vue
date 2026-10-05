<script setup lang="ts">
import { SEASON_LABELS, SEASONS, type Season } from '#shared/schemas'
import { PIXEL_ICONS, type PixelIconName } from '~/utils/pixel-icons'

definePageMeta({ layout: false })
useHead({ title: 'Nuancier — Le Carnet de la Ferme', meta: [{ name: 'robots', content: 'noindex' }] })

const settings = useSettings()
const season = computed<Season>({
  get: () => settings.value.forcedSeason ?? 'spring',
  set: (value) => (settings.value.forcedSeason = value),
})
const tab = ref('a')
const icons = Object.keys(PIXEL_ICONS) as PixelIconName[]
const teams = ['brown', 'black', 'blue', 'red', 'yellow', 'green', 'indigo', 'orange', 'purple', 'white']
</script>

<template>
  <div class="guide">
    <FarmScene class="guide__scene" :season="season" :walkers="['red', 'blue', 'yellow', 'green']" />
    <div class="guide__body">
      <WoodPanel as="header"><h1 class="sign-title">Le Carnet de la Ferme</h1></WoodPanel>
      <PaperCard>
        <h2>Saisons</h2>
        <div class="row">
          <GameButton
            v-for="s in SEASONS"
            :key="s"
            :variant="s === season ? 'primary' : 'paper'"
            @click="season = s"
          >
            {{ SEASON_LABELS[s] }}
          </GameButton>
        </div>
      </PaperCard>
      <DialogBox
        speaker="Lutin"
        :pages="[
          'Bon retour à la ferme ! Ça fait 12 jours…',
          'La dernière fois, tu voulais débloquer le lutin Venus.',
        ]"
      />
      <PaperCard>
        <h2>Boutons</h2>
        <div class="row">
          <GameButton icon="check">Valider</GameButton>
          <GameButton variant="wood" icon="pencil">Fin de session</GameButton>
          <GameButton variant="paper">Annuler</GameButton>
          <GameButton variant="danger" size="sm">Supprimer</GameButton>
          <GameButton variant="ghost">Lien discret</GameButton>
          <GameButton loading>Chargement</GameButton>
        </div>
        <h2>Étiquettes</h2>
        <div class="row">
          <TagChip tone="season" icon="calendar">Seulement en été</TagChip>
          <TagChip tone="gold" icon="coin">5 000 G</TagChip>
          <TagChip tone="sky">10 h – 13 h</TagChip>
          <TagChip tone="berry">Fermé le mercredi</TagChip>
          <DifficultyStars :value="2" />
          <ConfidenceNote confidence="low" />
        </div>
      </PaperCard>
      <PaperCard>
        <h2>Icônes</h2>
        <div class="row">
          <span v-for="icon in icons" :key="icon" class="icon-cell" :title="icon"
            ><PixelIcon :name="icon" :size="36"
          /></span>
        </div>
        <h2>Lutins</h2>
        <div class="row">
          <SpriteFigure v-for="t in teams" :key="t" :color="t" mood="breathe" />
          <SpriteFigure :found="false" />
        </div>
        <ProgressTrail :value="42" />
      </PaperCard>
      <div>
        <BookmarkTabs
          v-model="tab"
          id-prefix="demo"
          label="Méthodes"
          :tabs="[
            { id: 'a', label: 'Par les cadeaux' },
            { id: 'b', label: 'Par les festivals' },
            { id: 'c', label: 'Astuce' },
          ]"
        />
        <PaperCard>Contenu de l’onglet {{ tab }}</PaperCard>
      </div>
      <PaperCard><EmptyState title="Rien ici pour l’instant">Le lutin fait la sieste.</EmptyState></PaperCard>
      <PaperCard><EmptyState kind="seed" title="Ça pousse…" /></PaperCard>
    </div>
  </div>
</template>

<style scoped>
.guide__scene {
  height: 300px;
}
.guide__body {
  display: grid;
  gap: var(--space-5);
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-4);
}
.icon-cell {
  padding: 6px;
  border-radius: 8px;
  background: var(--paper-50);
}
</style>
