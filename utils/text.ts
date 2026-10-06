/** Normalise un texte pour la recherche : minuscules, sans accents. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** « il y a 12 jours », « aujourd'hui », « hier », « il y a 3 mois ». */
export function elapsedSince(iso: string, now = new Date()): { days: number; label: string } {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000))
  let label: string
  if (days === 0) label = "aujourd'hui"
  else if (days === 1) label = 'hier'
  else if (days < 60) label = `il y a ${days} jours`
  else if (days < 365) label = `il y a ${Math.round(days / 30)} mois`
  else label = `il y a plus d'un an`
  return { days, label }
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}
