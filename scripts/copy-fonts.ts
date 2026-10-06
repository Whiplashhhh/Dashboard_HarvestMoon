/**
 * Copie les polices variables (sous-ensemble latin) depuis les paquets @fontsource vers public/fonts/,
 * avec des noms stables pour pouvoir les précharger (<link rel="preload">). Licence SIL OFL 1.1 jointe.
 */
import { copyFile } from 'node:fs/promises'

const FONTS = { fredoka: 'fredoka', nunito: 'nunito', 'pixelify-sans': 'pixelify-sans' }
for (const [pkg, name] of Object.entries(FONTS)) {
  await copyFile(
    `node_modules/@fontsource-variable/${pkg}/files/${pkg}-latin-wght-normal.woff2`,
    `public/fonts/${name}.woff2`,
  )
  await copyFile(`node_modules/@fontsource-variable/${pkg}/LICENSE`, `public/fonts/LICENSE-${name}.txt`)
  console.log(`✓ ${name}`)
}
