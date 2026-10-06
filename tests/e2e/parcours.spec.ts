import { expect, test, type Page } from '@playwright/test'

const password = 'Les-Vaches-Adorent-Le-Foin-7'
const unique = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

async function register(page: Page, username: string) {
  await page.goto('/inscription')
  await page.getByLabel("Nom d'utilisateur").fill(username)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByLabel('Confirme le mot de passe').fill(password)
  await page.getByRole('button', { name: 'Créer mon carnet' }).click()
  await expect(page).toHaveURL(/\/bienvenue$/)
}

async function onboard(page: Page) {
  await page.getByLabel('Nom du fermier').fill('Lili')
  await page.getByLabel('Nom de la ferme').fill('Les Tournesols')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('heading', { name: "Qu'as-tu déjà fait ?" })).toBeVisible()
  await page.getByRole('button', { name: 'Mercury', exact: true }).click()
  await page.getByRole('button', { name: /C'est parti/ }).click()
  await expect(page).toHaveURL(/\/$/)
}

test('inscription, onboarding et accueil avec suggestions', async ({ page }) => {
  await register(page, unique('lili'))
  await onboard(page)
  await expect(page.locator('.dialog-box__text')).toContainText(
    /Bon retour à la ferme, Lili|Re-bonjour, Lili/,
  )
  await expect(page.getByRole('heading', { name: 'Que faire maintenant ?' })).toBeVisible()
  // Au moins une suggestion avec sa raison lisible
  await expect(page.locator('.cork article').first()).toBeVisible()
  await expect(page.getByText(/sur 101|\/101/).first()).toBeVisible()
})

test('objectif : méthode, étape cochée, épingle, accompli', async ({ page }) => {
  await register(page, unique('maya'))
  await onboard(page)
  await page.goto('/objectifs/sprite-venus')
  await expect(page.getByRole('heading', { level: 1, name: 'Débloquer le lutin Venus' })).toBeVisible()

  const firstStep = page.getByRole('checkbox').first()
  await firstStep.check({ force: true })
  await page.getByRole('button', { name: 'Épingler' }).click()
  await page.reload()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await expect(page.getByRole('button', { name: 'Épinglé' })).toBeVisible()

  await page.getByRole('button', { name: "C'est fait !" }).click()
  await expect(page.getByText('Bravo ! Objectif accompli.')).toBeVisible()
})

test('fin de session en moins de 30 secondes : date, lutin, note', async ({ page }) => {
  await register(page, unique('zoe'))
  await onboard(page)
  const open = page.getByRole('button', { name: /Fin de session/ }).first()
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Fin de session' })
  await dialog.getByRole('button', { name: '+1 semaine' }).click()
  await dialog.getByRole('checkbox').first().check({ force: true })
  await dialog.getByLabel(/moi du futur/).fill('Acheter des graines de navet demain.')
  await dialog.getByRole('button', { name: 'Enregistrer ma partie' }).click()
  await expect(page.getByText('Partie enregistrée. À la prochaine !')).toBeVisible()
  await expect(page.locator('blockquote')).toContainText('Acheter des graines de navet demain.')
})

test('les pages protégées renvoient vers la connexion, la déconnexion fonctionne', async ({ page }) => {
  await page.goto('/objectifs')
  await expect(page).toHaveURL(/\/connexion\?suite=/)

  const username = unique('noa')
  await register(page, username)
  await onboard(page)
  await page.getByText('Plus', { exact: true }).locator('visible=true').first().click()
  await page.getByRole('button', { name: 'Se déconnecter' }).locator('visible=true').click()
  await expect(page).toHaveURL(/\/connexion$/)

  await page.getByLabel("Nom d'utilisateur").fill(username)
  await page.getByLabel('Mot de passe').fill('pas-le-bon-mot-de-passe')
  await page.getByRole('button', { name: 'Entrer à la ferme' }).click()
  await expect(page.locator('#login-error')).toContainText("Nom d'utilisateur ou mot de passe incorrect.")
  await expect(page.getByLabel('Mot de passe')).toHaveAttribute('aria-invalid', 'true')
})

test('carnet, calendrier, recettes, compte : les pages secondaires répondent', async ({ page }) => {
  await register(page, unique('ines'))
  await onboard(page)

  await page.goto('/carnet')
  await page.getByLabel('Ta note').fill('Penser au poulailler.')
  await page.getByRole('button', { name: 'Ranger dans le carnet' }).click()
  await expect(page.locator('.note__body')).toHaveText('Penser au poulailler.')

  await page.goto('/calendrier')
  await expect(page.getByRole('tab', { name: 'Hiver' })).toBeVisible()
  await page.getByRole('tab', { name: 'Hiver' }).click()
  await expect(page.locator('.calendar__title')).toHaveText('Hiver')

  await page.goto('/recettes')
  await page.getByLabel('Rechercher une recette ou un ingrédient').fill('egg')
  await expect(page.locator('table tbody tr').first()).toBeVisible()

  await page.goto('/compte')
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: /Exporter mes données/ }).click()
  expect((await download).suggestedFilename()).toMatch(/^carnet-de-la-ferme-.*\.json$/)
})
