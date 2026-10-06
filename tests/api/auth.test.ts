import { describe, expect, inject, it } from 'vitest'
import { PASSWORD, registeredClient, TestClient, uniqueName } from './client'

const base = inject('apiBaseUrl')

describe.skipIf(!base)('authentification', () => {
  const url = base!

  it('inscription → session ouverte, cookie HttpOnly / Secure / SameSite=Lax', async () => {
    const client = new TestClient(url)
    const username = uniqueName('Lili')
    const response = await client.post('/api/auth/register', { username, password: PASSWORD })
    expect(response.status).toBe(201)
    const cookie = response.headers.getSetCookie().find((c) => c.startsWith('__Host-carnet_session='))!
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Secure/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(cookie).toMatch(/Path=\//i)
    const me = await client.get('/api/auth/me')
    expect(me.json).toMatchObject({ username, email: null })
    expect(me.json).not.toHaveProperty('passwordHash')
  })

  it('refuse un mot de passe trop court, courant, ou contenant le nom d’utilisateur', async () => {
    const client = new TestClient(url)
    const username = uniqueName()
    const short = await client.post('/api/auth/register', { username, password: 'court' })
    expect(short.status).toBe(400)
    expect(short.json.data.message).toMatch(/au moins 10 caractères/)
    const common = await client.post('/api/auth/register', { username, password: 'motdepasse123' })
    expect(common.json.data.message).toMatch(/trop courant/)
    const named = await client.post('/api/auth/register', { username, password: `${username}-2024!` })
    expect(named.json.data.message).toMatch(/nom d'utilisateur/)
  })

  it('refuse un nom déjà pris, sans tenir compte de la casse', async () => {
    const { username } = await registeredClient(url)
    const again = await new TestClient(url).post('/api/auth/register', {
      username: username.toUpperCase(),
      password: PASSWORD,
    })
    expect(again.status).toBe(409)
  })

  it('connexion : même message générique pour un utilisateur inconnu ou un mauvais mot de passe', async () => {
    const { username } = await registeredClient(url)
    const client = new TestClient(url)
    const wrong = await client.post('/api/auth/login', { username, password: 'pas-le-bon-mot-de-passe' })
    const unknown = await client.post('/api/auth/login', {
      username: uniqueName('fantome'),
      password: PASSWORD,
    })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.json.data.message).toBe(unknown.json.data.message)
  })

  it('la connexion crée un nouvel identifiant de session (rotation) et invalide l’ancien', async () => {
    const { client, username } = await registeredClient(url)
    const before = client.sessionCookie()!
    const login = await client.post('/api/auth/login', { username, password: PASSWORD })
    expect(login.status).toBe(200)
    const after = client.sessionCookie()!
    expect(after).not.toBe(before)

    const stale = new TestClient(url)
    stale.cookies.set('__Host-carnet_session', before)
    expect((await stale.get('/api/auth/me')).json).toBeNull()
  })

  it('la déconnexion invalide la session en base (le jeton volé ne sert plus à rien)', async () => {
    const { client } = await registeredClient(url)
    const token = client.sessionCookie()!
    expect((await client.post('/api/auth/logout')).status).toBe(200)
    const thief = new TestClient(url)
    thief.cookies.set('__Host-carnet_session', token)
    expect((await thief.get('/api/auth/me')).json).toBeNull()
    expect((await thief.get('/api/farms')).status).toBe(401)
  })

  it('limite les tentatives de connexion par nom d’utilisateur, avec délai progressif', async () => {
    const { username } = await registeredClient(url)
    const client = new TestClient(url)
    const statuses: number[] = []
    for (let i = 0; i < 7; i++) {
      statuses.push(
        (await client.post('/api/auth/login', { username, password: 'mauvais-mot-de-passe' })).status,
      )
    }
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401])
    expect(statuses.slice(5)).toContain(429)
    // Même avec le bon mot de passe, il faut attendre.
    const blocked = await client.post('/api/auth/login', { username, password: PASSWORD })
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(blocked.json.data.message).toMatch(/Trop de tentatives/)
  })
})

describe.skipIf(!base)('protection CSRF', () => {
  const url = base!

  it('refuse une requête qui modifie des données sans jeton', async () => {
    const { client } = await registeredClient(url)
    const response = await client.request('POST', '/api/farms', {}, { 'x-csrf-token': '' })
    expect(response.status).toBe(403)
  })

  it('refuse un jeton forgé (signature invalide)', async () => {
    const { client } = await registeredClient(url)
    const forged = 'abc.def'
    client.cookies.set('__Host-carnet_csrf', forged)
    const response = await client.request('POST', '/api/farms', {}, { 'x-csrf-token': forged })
    expect(response.status).toBe(403)
  })

  it('refuse une origine tierce même avec un jeton valide', async () => {
    const { client } = await registeredClient(url)
    const response = await client.request('POST', '/api/auth/logout', {}, { origin: 'https://evil.example' })
    expect(response.status).toBe(403)
    expect((await client.get('/api/auth/me')).json).not.toBeNull()
  })
})

describe.skipIf(!base)('en-têtes de sécurité', () => {
  const url = base!

  it('la page HTML a une CSP stricte avec nonce et les en-têtes attendus', async () => {
    const response = await new TestClient(url).get('/styleguide')
    const csp = response.headers.get('content-security-policy')!
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'))!
    expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/)
    expect(scriptSrc).not.toMatch(/unsafe-inline|unsafe-eval/)
    expect(csp).toMatch(/frame-ancestors 'none'/)
    expect(response.headers.get('strict-transport-security')).toMatch(/max-age=\d+/)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('permissions-policy')).toMatch(/camera=\(\)/)
    // Chaque <script> de la page porte le nonce.
    const nonce = /'nonce-([^']+)'/.exec(scriptSrc)![1]
    const scripts = response.text.match(/<script\b[^>]*>/g) ?? []
    expect(scripts.length).toBeGreaterThan(0)
    for (const tag of scripts) expect(tag).toContain(`nonce="${nonce}"`)
  })
})

describe.skipIf(!base)('robustesse', () => {
  it('refuse un corps de requête trop volumineux (413)', async () => {
    const response = await new TestClient(base!).post('/api/auth/login', {
      username: 'x',
      password: 'y'.repeat(70 * 1024),
    })
    expect(response.status).toBe(413)
  })

  it('les pages ne sont jamais mises en cache partagé', async () => {
    const response = await new TestClient(base!).get('/connexion')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
