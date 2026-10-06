/** Chemin de retour après connexion : uniquement un chemin interne (« /… »), sinon l'accueil. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  // Refuse « // », « /\ », espaces, antislashs et caractères de contrôle (redirections ouvertes).
  const hasControl = [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  return !hasControl && /^\/(?![/\\])[^\s\\]*$/.test(value) ? value : '/'
}
