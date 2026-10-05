/**
 * Tests d'API : démarre le serveur construit (`.output/`) sur une base PostgreSQL de test remise à zéro.
 * Prérequis : `npm run build` et une base accessible (TEST_DATABASE_URL, par défaut la base de dev Docker).
 * Sans build, les tests d'API sont ignorés (avec un avertissement) ; la CI construit toujours avant de tester.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import postgres from 'postgres'
import type { TestProject } from 'vitest/node'

const SERVER = '.output/server/index.mjs'

declare module 'vitest' {
  export interface ProvidedContext {
    apiBaseUrl: string | null
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() =>
        typeof address === 'object' && address ? resolve(address.port) : reject(new Error('port')),
      )
    })
  })
}

let child: ChildProcess | null = null

export default async function setup(project: TestProject) {
  if (!existsSync(SERVER)) {
    console.warn('⚠ Tests d’API ignorés : lance `npm run build` d’abord.')
    project.provide('apiBaseUrl', null)
    return
  }
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    process.env.NUXT_DATABASE_URL?.replace(/\/[^/]+$/, '/carnet_test') ??
    'postgres://carnet:carnet@localhost:5433/carnet_test'

  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} })
  await sql.unsafe(
    'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;',
  )
  await sql.end()

  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOST: '127.0.0.1',
      NUXT_DATABASE_URL: databaseUrl,
      NUXT_SESSION_SECRET: 'secret-de-test-uniquement-0123456789-abcdefghij',
      NUXT_PUBLIC_SITE_URL: baseUrl,
      NUXT_AUTH_IP_FREE_ATTEMPTS: '1000',
      NUXT_AUTH_REGISTRATIONS_PER_HOUR: '1000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  child.stdout?.on('data', (d) => (logs += d))
  child.stderr?.on('data', (d) => (logs += d))

  const deadline = Date.now() + 60_000
  for (;;) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/me`)
      if (response.ok) break
      if (response.status === 404) {
        child.kill('SIGTERM')
        throw new Error('Build obsolète (route /api/auth/me absente) : relance `npm run build`.')
      }
    } catch (error) {
      if ((error as Error).message.startsWith('Build obsolète')) throw error
      // le serveur démarre encore
    }
    if (Date.now() > deadline || child.exitCode !== null) {
      child.kill('SIGTERM')
      throw new Error(`Le serveur n'a pas démarré :\n${logs}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  project.provide('apiBaseUrl', baseUrl)

  return () => {
    child?.kill('SIGTERM')
  }
}
