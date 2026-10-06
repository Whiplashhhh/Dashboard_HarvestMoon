<script setup lang="ts">
import { sourceLabel } from '~/utils/text'

/** Crédits & sources : attribution CC BY-SA du wiki Fandom, autres sources, polices, mentions. */
definePageMeta({ layout: false })
useHead({ title: 'Crédits & sources — Le Carnet de la Ferme' })

const user = useCurrentUser()
const { game } = useGame()

const sources = computed(() => {
  const data = game.value
  if (!data) return { wiki: [] as string[], other: [] as string[] }
  const all = new Set<string>()
  for (const list of [
    data.objectives,
    data.sprites,
    data.teams,
    data.characters,
    data.festivals,
    data.buildings,
    data.tools,
    data.recipes,
    data.mines,
  ])
    for (const entry of list) for (const url of entry.sources) all.add(url)
  for (const url of data.calendar.sources) all.add(url)
  const sorted = [...all].sort()
  return {
    wiki: sorted.filter((url) => url.includes('harvestmoon.fandom.com')),
    other: sorted.filter((url) => !url.includes('harvestmoon.fandom.com')),
  }
})

const pageTitle = (url: string) => sourceLabel(url).replace(/^Wiki — /, '')
</script>

<template>
  <NuxtLayout :name="user ? 'default' : 'portal'">
    <div class="page credits">
      <header class="page-head">
        <div>
          <h1>Crédits &amp; sources</h1>
          <p>Merci aux communautés de fans qui documentent Harvest Moon DS depuis 2005.</p>
        </div>
      </header>

      <PaperCard as="section" aria-labelledby="fan-title">
        <h2 id="fan-title" class="section-title">
          <PixelIcon name="heart" :size="24" /> Site de fan non officiel
        </h2>
        <p>
          <strong>Le Carnet de la Ferme</strong> est un projet de fan, gratuit et sans publicité. Il n'est ni
          affilié, ni approuvé, ni sponsorisé par Natsume, Marvelous (anciennement Marvelous Interactive) ou
          Rising Star Games. « Harvest Moon » est une marque de ses propriétaires respectifs.
        </p>
        <p>
          Aucun élément graphique, sonore ou textuel du jeu n'est utilisé : les illustrations, les icônes
          pixel-art, les lutins et les sons du site sont des créations originales.
        </p>
      </PaperCard>

      <PaperCard as="section" aria-labelledby="wiki-title">
        <h2 id="wiki-title" class="section-title">
          <PixelIcon name="book" :size="24" /> Wiki Harvest Moon (Fandom)
        </h2>
        <p>
          Une grande partie des informations sur le jeu provient du
          <a href="https://harvestmoon.fandom.com/" rel="noopener noreferrer external" target="_blank"
            >wiki Harvest Moon sur Fandom</a
          >, dont le contenu est publié sous licence
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            rel="noopener noreferrer external license"
            target="_blank"
            >Creative Commons Attribution-Partage dans les mêmes conditions (CC BY-SA 3.0)</a
          >. Les textes ont été <strong>résumés, traduits en français et réorganisés</strong> ; ces
          adaptations sont partagées sous la même licence. Merci à toutes les personnes qui contribuent au
          wiki.
        </p>
        <GameGate>
          <details class="list">
            <summary>Pages du wiki utilisées ({{ sources.wiki.length }})</summary>
            <ul>
              <li v-for="url in sources.wiki" :key="url">
                <a :href="url" rel="noopener noreferrer external" target="_blank">{{ pageTitle(url) }}</a>
              </li>
            </ul>
          </details>
        </GameGate>
      </PaperCard>

      <PaperCard as="section" aria-labelledby="other-title">
        <h2 id="other-title" class="section-title">
          <PixelIcon name="search" :size="24" /> Autres sources consultées
        </h2>
        <p>
          Les informations ont été recoupées avec les guides de
          <a href="https://fogu.com/hm6/" rel="noopener noreferrer external" target="_blank">Fogu.com</a>
          (Harvest Moon DS) et d'autres guides publics. Quand les sources se contredisent, le site le signale
          (« info à vérifier »).
        </p>
        <GameGate>
          <details class="list">
            <summary>Liste des pages ({{ sources.other.length }})</summary>
            <ul>
              <li v-for="url in sources.other" :key="url">
                <a :href="url" rel="noopener noreferrer external" target="_blank">{{ sourceLabel(url) }}</a>
              </li>
            </ul>
          </details>
        </GameGate>
      </PaperCard>

      <PaperCard as="section" aria-labelledby="fonts-title">
        <h2 id="fonts-title" class="section-title"><PixelIcon name="pencil" :size="24" /> Polices</h2>
        <ul>
          <li><strong>Fredoka</strong> (Milena Brandão, Hafontia) — SIL Open Font License 1.1</li>
          <li>
            <strong>Nunito</strong> (Vernon Adams, Cyreal, Jacques Le Bailly) — SIL Open Font License 1.1
          </li>
          <li><strong>Pixelify Sans</strong> (Stefie Justprince) — SIL Open Font License 1.1</li>
        </ul>
        <p class="muted">Auto-hébergées via Fontsource : aucune requête vers un service tiers.</p>
      </PaperCard>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.credits a {
  overflow-wrap: anywhere;
}
.list summary {
  min-height: var(--tap);
  display: flex;
  align-items: center;
  font-weight: 800;
  cursor: pointer;
}
.list ul {
  columns: 2 16rem;
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
}
.muted {
  color: var(--ink-soft);
}
</style>
