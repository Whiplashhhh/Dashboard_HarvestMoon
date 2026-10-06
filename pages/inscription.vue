<script setup lang="ts">
import { registerSchema } from '#shared/schemas'

definePageMeta({ layout: 'portal' })
useHead({ title: 'Inscription — Le Carnet de la Ferme' })

const { register } = useAuth()
const form = reactive({ username: '', password: '', confirm: '', email: '' })
const error = ref<string | null>(null)
const loading = ref(false)

const passwordHint = computed(() => {
  if (!form.password)
    return 'Au moins 10 caractères. Une petite phrase est idéale : « mes-vaches-adorent-le-foin ».'
  if (form.password.length < 10) return `Encore ${10 - form.password.length} caractère(s).`
  return 'Parfait.'
})

async function submit() {
  error.value = null
  const parsed = registerSchema.safeParse(form)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Vérifie le formulaire.'
    return
  }
  if (form.password !== form.confirm) {
    error.value = 'Les deux mots de passe ne sont pas identiques.'
    return
  }
  loading.value = true
  try {
    await register({ username: form.username, password: form.password, email: form.email || undefined })
    await navigateTo('/bienvenue')
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <DialogBox
      speaker="Le facteur"
      :pages="[
        'Tiens, une nouvelle tête dans la vallée ! Remplis cette lettre pour ouvrir ton carnet de ferme.',
      ]"
    />
    <LetterCard stamp="BIENVENUE">
      <form class="auth__form" method="post" novalidate @submit.prevent="submit">
        <h1 class="auth__title">Créer mon carnet</h1>
        <p v-if="error" class="form-error" role="alert"><PixelIcon name="close" :size="20" />{{ error }}</p>
        <div class="field">
          <label for="reg-username">Nom d'utilisateur</label>
          <input
            id="reg-username"
            v-model="form.username"
            class="input"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            minlength="3"
            maxlength="32"
            aria-describedby="reg-username-hint"
            required
          />
          <span id="reg-username-hint" class="field__hint">3 à 32 caractères : lettres, chiffres, . - _</span>
        </div>
        <div class="field">
          <label for="reg-password">Mot de passe</label>
          <input
            id="reg-password"
            v-model="form.password"
            class="input"
            type="password"
            autocomplete="new-password"
            minlength="10"
            aria-describedby="reg-password-hint"
            required
          />
          <span id="reg-password-hint" class="field__hint" aria-live="polite">{{ passwordHint }}</span>
        </div>
        <div class="field">
          <label for="reg-confirm">Confirme le mot de passe</label>
          <input
            id="reg-confirm"
            v-model="form.confirm"
            class="input"
            type="password"
            autocomplete="new-password"
            required
          />
        </div>
        <div class="field">
          <label for="reg-email"
            >E-mail <span class="field__hint">(facultatif, aucun envoi pour l'instant)</span></label
          >
          <input id="reg-email" v-model="form.email" class="input" type="email" autocomplete="email" />
        </div>
        <GameButton type="submit" size="lg" block icon="sparkle" :loading="loading"
          >Créer mon carnet</GameButton
        >
        <p class="auth__alt">Déjà un carnet ? <NuxtLink to="/connexion">Connecte-toi</NuxtLink></p>
      </form>
    </LetterCard>
  </div>
</template>
