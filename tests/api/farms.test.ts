import { beforeAll, describe, expect, inject, it } from 'vitest'
import { farmInput, PASSWORD, registeredClient, TestClient } from './client'

const base = inject('apiBaseUrl')

describe.skipIf(!base)('fermes et progression', () => {
  const url = base!
  let client: TestClient
  let farmId: string

  beforeAll(async () => {
    ;({ client } = await registeredClient(url))
    const created = await client.post('/api/farms', { ...farmInput, completed: ['sprite-neptune'] })
    expect(created.status).toBe(201)
    farmId = created.json.id
  })

  it('crée une ferme active avec les objectifs déclarés à l’onboarding', async () => {
    const farm = (await client.get(`/api/farms/${farmId}`)).json
    expect(farm).toMatchObject({ farmName: 'Les Tournesols', date: { year: 1, season: 'spring', day: 5 } })
    expect(farm.completed).toEqual(['sprite-neptune'])
    expect((await client.get('/api/auth/me')).json.activeFarmId).toBe(farmId)
  })

  it('valide les entrées (date impossible, objectif inconnu)', async () => {
    const badDate = await client.patch(`/api/farms/${farmId}`, {
      date: { year: 1, season: 'spring', day: 31 },
    })
    expect(badDate.status).toBe(400)
    const unknown = await client.put(`/api/farms/${farmId}/objectives`, { complete: ['objectif-invente'] })
    expect(unknown.status).toBe(400)
  })

  it('coche et décoche des objectifs, épingle un objectif', async () => {
    await client.put(`/api/farms/${farmId}/objectives`, { complete: ['sprite-mercury', 'sprite-venus'] })
    await client.put(`/api/farms/${farmId}/objectives`, { uncomplete: ['sprite-venus'] })
    const pinned = await client.patch(`/api/farms/${farmId}`, { pinnedObjectiveId: 'sprite-venus' })
    expect(pinned.json.completed.sort()).toEqual(['sprite-mercury', 'sprite-neptune'])
    expect(pinned.json.pinnedObjectiveId).toBe('sprite-venus')
  })

  it('coche une étape d’une méthode (et refuse une étape inexistante)', async () => {
    const ok = await client.put(`/api/farms/${farmId}/steps`, {
      objectiveId: 'sprite-venus',
      methodIndex: 0,
      stepIndex: 0,
      checked: true,
    })
    expect(ok.status).toBe(200)
    expect((await client.get(`/api/farms/${farmId}`)).json.steps).toEqual(['sprite-venus:0:0'])
    const ko = await client.put(`/api/farms/${farmId}/steps`, {
      objectiveId: 'sprite-venus',
      methodIndex: 9,
      stepIndex: 0,
      checked: true,
    })
    expect(ko.status).toBe(400)
  })

  it('« fin de session » : date, objectifs et note en une requête', async () => {
    const response = await client.post(`/api/farms/${farmId}/session`, {
      date: { year: 1, season: 'summer', day: 2 },
      complete: ['sprite-venus'],
      note: 'Penser à acheter des graines de tomate.',
    })
    expect(response.status).toBe(200)
    expect(response.json.date).toEqual({ year: 1, season: 'summer', day: 2 })
    expect(response.json.completed).toContain('sprite-venus')
    expect(response.json.lastNote).toMatchObject({ body: 'Penser à acheter des graines de tomate.' })
  })

  it('notes : création avec date du jeu, liste, suppression', async () => {
    const created = await client.post(`/api/farms/${farmId}/notes`, {
      body: 'Festival des fleurs le 18 !',
      date: { year: 1, season: 'summer', day: 4 },
    })
    expect(created.status).toBe(201)
    const list = (await client.get(`/api/farms/${farmId}/notes`)).json
    expect(list[0]).toMatchObject({ body: 'Festival des fleurs le 18 !', date: { season: 'summer', day: 4 } })
    expect((await client.delete(`/api/farms/${farmId}/notes/${created.json.id}`)).status).toBe(200)
  })

  it('exige d’être connectée', async () => {
    expect((await new TestClient(url).get(`/api/farms/${farmId}`)).status).toBe(401)
  })
})

describe.skipIf(!base)('isolation entre utilisatrices', () => {
  const url = base!
  let alice: TestClient
  let bob: TestClient
  let aliceFarm: string
  let aliceNote: string
  let bobFarm: string

  beforeAll(async () => {
    ;({ client: alice } = await registeredClient(url))
    ;({ client: bob } = await registeredClient(url))
    aliceFarm = (await alice.post('/api/farms', farmInput)).json.id
    aliceNote = (await alice.post(`/api/farms/${aliceFarm}/notes`, { body: 'secret' })).json.id
    bobFarm = (await bob.post('/api/farms', { ...farmInput, farmName: 'Chez Bob' })).json.id
  })

  it('Bob ne voit pas la ferme d’Alice (404, comme si elle n’existait pas)', async () => {
    expect((await bob.get(`/api/farms/${aliceFarm}`)).status).toBe(404)
    expect((await bob.get(`/api/farms/${aliceFarm}/notes`)).status).toBe(404)
    const list = (await bob.get('/api/farms')).json as { id: string }[]
    expect(list.map((f) => f.id)).toEqual([bobFarm])
  })

  it('Bob ne peut rien modifier chez Alice', async () => {
    const attempts = await Promise.all([
      bob.patch(`/api/farms/${aliceFarm}`, { farmName: 'Volée' }),
      bob.put(`/api/farms/${aliceFarm}/objectives`, { complete: ['sprite-jum'] }),
      bob.put(`/api/farms/${aliceFarm}/steps`, {
        objectiveId: 'sprite-jum',
        methodIndex: 0,
        stepIndex: 0,
        checked: true,
      }),
      bob.post(`/api/farms/${aliceFarm}/session`, { note: 'coucou' }),
      bob.post(`/api/farms/${aliceFarm}/notes`, { body: 'intrus' }),
      bob.post(`/api/farms/${aliceFarm}/activate`),
      bob.delete(`/api/farms/${aliceFarm}/notes/${aliceNote}`),
      bob.delete(`/api/farms/${aliceFarm}`),
    ])
    expect(attempts.map((a) => a.status)).toEqual([404, 404, 404, 404, 404, 404, 404, 404])
    const farm = (await alice.get(`/api/farms/${aliceFarm}`)).json
    expect(farm).toMatchObject({ farmName: 'Les Tournesols', completed: [] })
    expect((await alice.get(`/api/farms/${aliceFarm}/notes`)).json).toHaveLength(1)
  })

  it('Bob ne peut pas supprimer une note d’Alice en passant par sa propre ferme', async () => {
    expect((await bob.delete(`/api/farms/${bobFarm}/notes/${aliceNote}`)).status).toBe(404)
    expect((await alice.get(`/api/farms/${aliceFarm}/notes`)).json).toHaveLength(1)
  })

  it('l’export de Bob ne contient que ses données', async () => {
    const exported = (await bob.get('/api/account/export')).json
    expect(exported.farms.map((f: { farmName: string }) => f.farmName)).toEqual(['Chez Bob'])
    expect(JSON.stringify(exported)).not.toContain('secret')
  })
})

describe.skipIf(!base)('mon compte', () => {
  const url = base!

  it('export JSON sans données sensibles', async () => {
    const { client, username } = await registeredClient(url)
    await client.post('/api/farms', farmInput)
    const response = await client.get('/api/account/export')
    expect(response.headers.get('content-disposition')).toMatch(/attachment; filename="carnet-de-la-ferme-/)
    expect(response.json.account.username).toBe(username)
    expect(response.json.farms).toHaveLength(1)
    expect(response.text).not.toMatch(/password|argon2/i)
  })

  it('changer de mot de passe déconnecte les autres appareils', async () => {
    const { client, username } = await registeredClient(url)
    const other = new TestClient(url)
    await other.post('/api/auth/login', { username, password: PASSWORD })
    const wrong = await client.put('/api/account/password', {
      currentPassword: 'faux-mot-de-passe',
      newPassword: 'x',
    })
    expect(wrong.status).toBe(400)
    const changed = await client.put('/api/account/password', {
      currentPassword: PASSWORD,
      newPassword: 'Nouveau-Mot-De-Passe-77',
    })
    expect(changed.status).toBe(200)
    expect((await client.get('/api/auth/me')).json).not.toBeNull()
    expect((await other.get('/api/auth/me')).json).toBeNull()
  })

  it('supprimer son compte exige le mot de passe et efface tout', async () => {
    const { client, username } = await registeredClient(url)
    await client.post('/api/farms', farmInput)
    expect((await client.delete('/api/account', { password: 'mauvais' })).status).toBe(400)
    expect((await client.delete('/api/account', { password: PASSWORD })).status).toBe(200)
    expect((await client.get('/api/auth/me')).json).toBeNull()
    const login = await new TestClient(url).post('/api/auth/login', { username, password: PASSWORD })
    expect(login.status).toBe(401)
  })

  it('enregistre les réglages', async () => {
    const { client } = await registeredClient(url)
    const settings = { sounds: true, reducedMotion: true, forcedSeason: 'winter' }
    expect((await client.put('/api/account/settings', settings)).json).toEqual(settings)
    expect((await client.get('/api/auth/me')).json.settings).toEqual(settings)
  })
})

describe.skipIf(!base)('données du jeu', () => {
  it('sont servies avec un ETag (304 si inchangées)', async () => {
    const client = new TestClient(base!)
    const first = await client.get('/api/game.json')
    expect(first.json.sprites).toHaveLength(101)
    const etag = first.headers.get('etag')!
    const second = await client.request('GET', '/api/game.json', undefined, { 'if-none-match': etag })
    expect(second.status).toBe(304)
  })
})
