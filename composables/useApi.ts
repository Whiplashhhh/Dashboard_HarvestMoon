import type { FetchError } from 'ofetch'

/** Lit le jeton CSRF (cookie double-submit) : nom préfixé __Host- en production. */
function csrfToken(): string | undefined {
  if (!import.meta.client) return undefined
  const match = document.cookie.match(/(?:^|;\s*)(?:__Host-)?carnet_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]!) : undefined
}

/** Message d'erreur affichable (français) à partir d'une erreur d'API. */
export function apiErrorMessage(error: unknown): string {
  const fetchError = error as FetchError<{ data?: { message?: string }; statusMessage?: string }>
  const status = fetchError?.statusCode ?? fetchError?.response?.status
  const message = fetchError?.data?.data?.message
  if (message) return message
  if (status === 401) return 'Ta session a expiré : reconnecte-toi.'
  if (status === 403) return 'Action refusée par sécurité. Recharge la page puis réessaie.'
  if (status === 404) return 'Introuvable.'
  if (status === 429) return 'Trop de tentatives, patiente un peu.'
  if (!status) return 'Impossible de joindre le serveur. Vérifie ta connexion.'
  return 'Un souci est survenu. Réessaie dans un instant.'
}

/** $fetch avec jeton CSRF pour toutes les requêtes qui modifient des données. */
export function useApi() {
  return <T>(
    url: string,
    options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {},
  ) =>
    $fetch<T>(url, {
      method: options.method ?? 'GET',
      body: options.body as Record<string, unknown> | undefined,
      headers: options.method && options.method !== 'GET' ? { 'x-csrf-token': csrfToken() ?? '' } : undefined,
      credentials: 'same-origin',
    })
}
