# Décisions prises en autonomie

Format : **décision** — pourquoi.

## Outillage

- **Nuxt 3.21 (et non Nuxt 4, pourtant « latest » sur npm)** — le cahier des charges impose Nuxt 3 ; la branche 3.x
  est toujours maintenue.
- **Node 22 LTS dans Docker et la CI** — version LTS stable ; le poste de dev tourne en Node 26, compatible.
- **`@node-rs/argon2`** plutôt que `argon2` — binaires précompilés (pas de toolchain C dans l'image Docker,
  compatible Alpine/musl), API argon2id complète.
- **`postgres` (postgres.js) comme pilote** — léger, très bien supporté par Drizzle.
- **Workflow git par pull requests** même en solo — demandé par le propriétaire du dépôt ; chaque PR est fusionnée
  (squash) uniquement si la CI est verte.
