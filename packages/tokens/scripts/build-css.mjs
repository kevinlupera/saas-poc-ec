import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { baseRadius, darkTokens, lightTokens, typography } from '../src/index.ts'

function themeDeclarations(tokens) {
  return Object.entries(tokens).flatMap(([name, token]) => {
    const property = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    return [
      `  --${property}: ${token.hsl};`,
      `  --${property}-hsl: var(--${property});`,
    ]
  }).join('\n')
}

export function renderTokensCss() {
  return `/* Generated from @saas/tokens/src/index.ts. Run pnpm --filter @saas/tokens build. */
/* Plain CSS: no framework, Tailwind directives, or global element styles. */
:root {
${themeDeclarations(lightTokens)}
  --radius: ${baseRadius};
  --font-sans: ${typography.fontSans};
  --font-mono: ${typography.fontMono};
}

.dark {
${themeDeclarations(darkTokens)}
}
`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(new URL('../css/tokens.css', import.meta.url), renderTokensCss())
}
