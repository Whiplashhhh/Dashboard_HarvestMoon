/**
 * Met à jour le moment de la journée (aube, jour, crépuscule, nuit) d'après l'heure de l'appareil.
 * Appliqué une fois l'hydratation terminée (onNuxtReady) : le rendu serveur reste « jour », puis la scène
 * glisse doucement vers l'heure réelle, sans écart d'hydratation.
 */
export default defineNuxtPlugin(() => {
  const daytime = useDaytime()
  const update = () => (daytime.value = daytimeFromHour(new Date().getHours()))
  onNuxtReady(() => {
    update()
    setInterval(update, 60_000)
  })
})
