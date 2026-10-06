/** Pages publiques ; toutes les autres exigent d'être connectée et d'avoir créé une ferme. */
const PUBLIC = new Set(['/connexion', '/inscription', '/credits', '/styleguide'])

export default defineNuxtRouteMiddleware((to) => {
  const user = useCurrentUser()
  if (PUBLIC.has(to.path)) {
    if (user.value && (to.path === '/connexion' || to.path === '/inscription')) return navigateTo('/')
    return
  }
  if (!user.value)
    return navigateTo({ path: '/connexion', query: to.path !== '/' ? { suite: to.fullPath } : {} })
  if (!user.value.activeFarmId && to.path !== '/bienvenue' && to.path !== '/compte')
    return navigateTo('/bienvenue')
})
