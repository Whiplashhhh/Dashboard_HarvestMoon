import type { MeDTO } from '#shared/types/api'

/** Utilisatrice connectée (hydratée au rendu serveur par plugins/auth.ts). */
export function useCurrentUser() {
  return useState<MeDTO | null>('current-user', () => null)
}

export function useAuth() {
  const user = useCurrentUser()
  const api = useApi()
  const settings = useSettings()

  async function refresh() {
    user.value = await api<MeDTO | null>('/api/auth/me')
    if (user.value) settings.value = { ...user.value.settings }
  }

  async function login(username: string, password: string) {
    await api('/api/auth/login', { method: 'POST', body: { username, password } })
    await refresh()
  }

  async function register(input: { username: string; password: string; email?: string }) {
    await api('/api/auth/register', { method: 'POST', body: input })
    await refresh()
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    user.value = null
    clearNuxtState(['active-farm'])
    await navigateTo('/connexion')
  }

  return { user, refresh, login, register, logout }
}
