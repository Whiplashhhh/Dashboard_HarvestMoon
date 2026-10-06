/** Au rendu serveur, l'utilisatrice est lue directement dans le contexte de la requête (aucun aller-retour HTTP). */
export default defineNuxtPlugin(() => {
  const user = useCurrentUser()
  const settings = useSettings()
  if (import.meta.server) {
    const auth = useRequestEvent()?.context.auth
    if (auth) {
      user.value = { ...auth.user, createdAt: auth.user.createdAt.toISOString() }
      settings.value = { ...auth.user.settings }
    }
  }
})
