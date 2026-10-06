<script setup lang="ts">
definePageMeta({ layout: 'portal' })
useHead({ title: 'Connexion — Le Carnet de la Ferme' })

const { login } = useAuth()
const route = useRoute()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await login(username.value, password.value)
    const next =
      typeof route.query.suite === 'string' && route.query.suite.startsWith('/') ? route.query.suite : '/'
    await navigateTo(next.startsWith('//') ? '/' : next)
  } catch (e) {
    error.value = apiErrorMessage(e)
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <DialogBox
      speaker="Le facteur"
      :pages="['Bonjour ! Une lettre t’attend dans la boîte aux lettres de ta ferme.']"
    />
    <LetterCard stamp="FERME">
      <form class="auth__form" method="post" novalidate @submit.prevent="submit">
        <h1 class="auth__title">Ouvrir mon carnet</h1>
        <p v-if="error" class="form-error" role="alert"><PixelIcon name="close" :size="20" />{{ error }}</p>
        <div class="field">
          <label for="login-username">Nom d'utilisateur</label>
          <input
            id="login-username"
            v-model="username"
            class="input"
            name="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
          />
        </div>
        <div class="field">
          <label for="login-password">Mot de passe</label>
          <input
            id="login-password"
            v-model="password"
            class="input"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
        </div>
        <GameButton type="submit" size="lg" block icon="door" :loading="loading"
          >Entrer à la ferme</GameButton
        >
        <p class="auth__alt">Pas encore de carnet ? <NuxtLink to="/inscription">Crée ta ferme</NuxtLink></p>
      </form>
    </LetterCard>
  </div>
</template>
