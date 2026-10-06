export interface Toast {
  id: number
  text: string
  tone: 'info' | 'success' | 'error'
}

let nextId = 1

/** Petites notifications façon « bulle » de jeu (annoncées aux lecteurs d'écran). */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])
  function show(text: string, tone: Toast['tone'] = 'info') {
    const id = nextId++
    toasts.value = [...toasts.value.slice(-2), { id, text, tone }]
    // Les erreurs restent affichées jusqu'à ce qu'on les ferme (pas de limite de temps).
    if (tone !== 'error') setTimeout(() => dismiss(id), 4500)
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  return { toasts, show, dismiss }
}
