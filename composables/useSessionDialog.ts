/** Ouverture du panneau « Fin de session », accessible depuis toutes les pages. */
export function useSessionDialog() {
  const open = useState('session-dialog-open', () => false)
  return { open, show: () => (open.value = true), hide: () => (open.value = false) }
}
