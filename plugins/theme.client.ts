/**
 * Met à jour le moment de la journée (aube, jour, crépuscule, nuit) d'après l'heure de l'appareil.
 * Appliqué après l'hydratation : le rendu serveur reste « jour », puis la scène glisse doucement vers l'heure réelle.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const daytime = useDaytime()
  const update = () => (daytime.value = daytimeFromHour(new Date().getHours()))
  nuxtApp.hook('app:mounted', () => {
    update()
    setInterval(update, 60_000)
  })
})
