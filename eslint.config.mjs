// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    // La mise en forme (dont <input />) est l'affaire de Prettier.
    'vue/html-self-closing': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
}).append({
  ignores: ['data/raw/**', 'server/database/migrations/**', 'docs/**'],
})
