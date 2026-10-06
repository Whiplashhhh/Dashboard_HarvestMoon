<script setup lang="ts">
import { formatGameDate } from '#shared/engine'
import type { FarmSummaryDTO } from '#shared/types/api'
import { elapsedSince } from '~/utils/text'

useHead({ title: 'Mon compte — Le Carnet de la Ferme' })

const { user, refresh } = useAuth()
const { load } = useFarm()
const api = useApi()
const toast = useToast()

const { data: farms, refresh: refreshFarms } = await useAsyncData(
  'farms',
  () => api<FarmSummaryDTO[]>('/api/farms'),
  {
    server: false,
    default: () => [] as FarmSummaryDTO[],
  },
)

async function activate(id: string) {
  try {
    await api(`/api/farms/${id}/activate`, { method: 'POST' })
    await refresh()
    await load(true)
    toast.show('Ferme active changée.', 'success')
    await navigateTo('/')
  } catch (e) {
    toast.show(apiErrorMessage(e), 'error')
  }
}

async function removeFarm(farm: FarmSummaryDTO) {
  if (!window.confirm(`Supprimer définitivement la ferme « ${farm.farmName} » et toute sa progression ?`))
    return
  try {
    await api(`/api/farms/${farm.id}`, { method: 'DELETE' })
    await refresh()
    await refreshFarms()
    if (!user.value?.activeFarmId && farms.value[0]) await activate(farms.value[0].id)
    toast.show('Ferme supprimée.', 'info')
  } catch (e) {
    toast.show(apiErrorMessage(e), 'error')
  }
}

const passwords = reactive({ current: '', next: '', confirm: '' })
const passwordError = ref<string | null>(null)
const passwordSaving = ref(false)
async function changePassword() {
  passwordError.value = null
  if (passwords.next !== passwords.confirm) {
    passwordError.value = 'Les deux nouveaux mots de passe ne sont pas identiques.'
    return
  }
  passwordSaving.value = true
  try {
    await api('/api/account/password', {
      method: 'PUT',
      body: { currentPassword: passwords.current, newPassword: passwords.next },
    })
    Object.assign(passwords, { current: '', next: '', confirm: '' })
    toast.show('Mot de passe changé. Tes autres appareils ont été déconnectés.', 'success')
  } catch (e) {
    passwordError.value = apiErrorMessage(e)
  } finally {
    passwordSaving.value = false
  }
}

const deletion = reactive({ password: '', understood: false })
const deletionError = ref<string | null>(null)
const deleting = ref(false)
async function deleteAccount() {
  deletionError.value = null
  if (!deletion.understood) {
    deletionError.value = 'Coche la case pour confirmer que tu as bien compris.'
    return
  }
  deleting.value = true
  try {
    await api('/api/account', { method: 'DELETE', body: { password: deletion.password } })
    user.value = null
    clearNuxtState(['active-farm'])
    await navigateTo('/connexion')
  } catch (e) {
    deletionError.value = apiErrorMessage(e)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Mon compte</h1>
        <p v-if="user">
          Connectée en tant que <strong>{{ user.username }}</strong
          >.
        </p>
      </div>
    </header>

    <PaperCard as="section" aria-labelledby="farms-title">
      <h2 id="farms-title" class="section-title"><PixelIcon name="farm" :size="28" /> Mes fermes</h2>
      <ul class="farms">
        <li
          v-for="farm in farms"
          :key="farm.id"
          class="farm"
          :class="{ 'farm--active': farm.id === user?.activeFarmId }"
        >
          <div>
            <p class="farm__name">
              {{ farm.farmName }} <small>({{ farm.farmerName }})</small>
            </p>
            <p class="farm__meta">
              <span class="pixel">{{ formatGameDate(farm.date) }}</span> ·
              {{ farm.completedCount }} objectifs/lutins · dernière partie
              {{ elapsedSince(farm.lastPlayedAt).label }}
            </p>
          </div>
          <div class="farm__actions">
            <TagChip v-if="farm.id === user?.activeFarmId" tone="meadow" icon="check">Ferme active</TagChip>
            <GameButton
              v-else
              size="sm"
              variant="wood"
              :aria-label="`Ouvrir la ferme ${farm.farmName}`"
              @click="activate(farm.id)"
            >
              Ouvrir
            </GameButton>
            <GameButton
              size="sm"
              variant="ghost"
              :aria-label="`Supprimer la ferme ${farm.farmName}`"
              @click="removeFarm(farm)"
            >
              Supprimer
            </GameButton>
          </div>
        </li>
      </ul>
      <GameButton variant="paper" icon="sparkle" to="/bienvenue"
        >Nouvelle ferme (autre sauvegarde)</GameButton
      >
    </PaperCard>

    <div class="two">
      <PaperCard as="section" aria-labelledby="password-title">
        <h2 id="password-title" class="section-title">
          <PixelIcon name="lock" :size="28" /> Changer de mot de passe
        </h2>
        <form class="form" @submit.prevent="changePassword">
          <p v-if="passwordError" class="form-error" role="alert">{{ passwordError }}</p>
          <div class="field">
            <label for="pw-current">Mot de passe actuel</label>
            <input
              id="pw-current"
              v-model="passwords.current"
              class="input"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <div class="field">
            <label for="pw-next">Nouveau mot de passe</label>
            <input
              id="pw-next"
              v-model="passwords.next"
              class="input"
              type="password"
              autocomplete="new-password"
              minlength="10"
              required
            />
            <span class="field__hint">Au moins 10 caractères.</span>
          </div>
          <div class="field">
            <label for="pw-confirm">Confirme le nouveau mot de passe</label>
            <input
              id="pw-confirm"
              v-model="passwords.confirm"
              class="input"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>
          <div><GameButton type="submit" :loading="passwordSaving">Changer</GameButton></div>
        </form>
      </PaperCard>

      <PaperCard as="section" aria-labelledby="export-title">
        <h2 id="export-title" class="section-title"><PixelIcon name="book" :size="28" /> Mes données</h2>
        <p>
          Télécharge toutes tes données (fermes, progression, notes, réglages) dans un fichier JSON lisible.
        </p>
        <a class="download" href="/api/account/export" download>
          <PixelIcon name="notebook" :size="24" /> Exporter mes données (JSON)
        </a>
        <p class="muted small">
          Aucun traqueur, aucune publicité, aucune donnée partagée avec qui que ce soit.
        </p>
      </PaperCard>
    </div>

    <PaperCard as="section" aria-labelledby="delete-title" class="danger">
      <h2 id="delete-title" class="section-title">
        <PixelIcon name="close" :size="28" /> Supprimer mon compte
      </h2>
      <p>
        Toutes tes fermes, ta progression et tes notes seront <strong>définitivement effacées</strong>. Pense
        à exporter tes données avant.
      </p>
      <form class="form" @submit.prevent="deleteAccount">
        <p v-if="deletionError" class="form-error" role="alert">{{ deletionError }}</p>
        <div class="field">
          <label for="delete-password">Ton mot de passe, pour confirmer</label>
          <input
            id="delete-password"
            v-model="deletion.password"
            class="input"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <label class="check-row">
          <input v-model="deletion.understood" type="checkbox" />
          <span class="check-row__box" aria-hidden="true"><PixelIcon name="check" :size="18" /></span>
          <span>J'ai compris que la suppression est définitive.</span>
        </label>
        <div>
          <GameButton type="submit" variant="danger" :loading="deleting">Supprimer définitivement</GameButton>
        </div>
      </form>
    </PaperCard>
  </div>
</template>

<style scoped>
.farms {
  display: grid;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
  padding: 0;
  list-style: none;
}
.farm {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 3px dashed var(--paper-400);
  border-radius: var(--radius-md);
  background: #fff;
}
.farm--active {
  border-style: solid;
  border-color: var(--meadow-600);
}
.farm p {
  margin: 0;
}
.farm__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
}
.farm__name small {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
.farm__meta {
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
.farm__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.two {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: var(--space-5);
}
.form {
  display: grid;
  gap: var(--space-3);
}
.download {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap);
  padding: var(--space-2) var(--space-4);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-md);
  background: var(--paper-50);
  box-shadow: 0 4px 0 var(--wood-900);
  font-weight: 800;
  text-decoration: none;
  color: var(--wood-900);
}
.download:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--wood-900);
}
.danger {
  border-color: var(--berry-ink);
  background: #fff4f2;
}
.muted {
  color: var(--ink-soft);
}
.small {
  font-size: var(--text-sm);
}
</style>
