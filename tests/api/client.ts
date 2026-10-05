/** Petit client HTTP de test : pot à cookies, jeton CSRF et en-tête Origin automatiques. */
export class TestClient {
  cookies = new Map<string, string>()
  constructor(readonly baseUrl: string) {}

  private csrf(): string | undefined {
    for (const [name, value] of this.cookies) if (name.endsWith('carnet_csrf')) return value
    return undefined
  }

  sessionCookie(): string | undefined {
    for (const [name, value] of this.cookies) if (name.endsWith('carnet_session')) return value
    return undefined
  }

  async request(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}) {
    if (method !== 'GET' && !this.csrf()) await this.request('GET', '/api/auth/me')
    const headers: Record<string, string> = {
      cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
      origin: this.baseUrl,
      ...(this.csrf() ? { 'x-csrf-token': this.csrf()! } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...extraHeaders,
    }
    const response = await fetch(this.baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    })
    for (const raw of response.headers.getSetCookie()) {
      const [pair] = raw.split(';')
      const index = pair!.indexOf('=')
      const name = pair!.slice(0, index)
      const value = pair!.slice(index + 1)
      if (value === '' || /max-age=0/i.test(raw) || /expires=thu, 01 jan 1970/i.test(raw))
        this.cookies.delete(name)
      else this.cookies.set(name, value)
    }
    const text = await response.text()
    let json: unknown
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = text
    }
    return {
      status: response.status,
      headers: response.headers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- réponses JSON libres dans les tests
      json: json as any,
      text,
    }
  }

  get = (path: string) => this.request('GET', path)
  post = (path: string, body?: unknown) => this.request('POST', path, body ?? {})
  put = (path: string, body: unknown) => this.request('PUT', path, body)
  patch = (path: string, body: unknown) => this.request('PATCH', path, body)
  delete = (path: string, body?: unknown) => this.request('DELETE', path, body)
}

let counter = 0
export const uniqueName = (prefix = 'fermiere') => `${prefix}${Date.now().toString(36)}${counter++}`
export const PASSWORD = 'Un-Bon-Mot-De-Passe-42'

export async function registeredClient(baseUrl: string, username = uniqueName()) {
  const client = new TestClient(baseUrl)
  const response = await client.post('/api/auth/register', { username, password: PASSWORD })
  if (response.status !== 201) throw new Error(`inscription impossible : ${response.text}`)
  return { client, username }
}

export const farmInput = {
  farmerName: 'Lili',
  farmName: 'Les Tournesols',
  date: { year: 1, season: 'spring', day: 5 },
}
