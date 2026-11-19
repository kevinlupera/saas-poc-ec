import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import designTokens, { darkTokens, emailTokens, lightTokens, pdfTokens } from '@saas/tokens'
import { renderTokensCss } from '../scripts/build-css.mjs'

test('published CSS stays in sync with the TypeScript source', () => {
  const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8')
  assert.equal(css, renderTokensCss(), 'Run pnpm --filter @saas/tokens build after changing tokens')
  assert.doesNotMatch(css, /@(?:tailwind|apply|layer)\b/)
  assert.doesNotMatch(css, /(?:^|\n)(?:body|\*)\s*\{/)
  for (const entry of ['@saas/tokens/css', '@saas/tokens/css/tokens.css']) {
    assert.equal(import.meta.resolve(entry), new URL('../css/tokens.css', import.meta.url).href)
  }
})

test('both themes expose the same semantic colors in static HSL and HEX', () => {
  assert.deepEqual(Object.keys(lightTokens), Object.keys(darkTokens))
  assert.equal(designTokens.light, lightTokens)
  assert.equal(designTokens.dark, darkTokens)
  for (const theme of [lightTokens, darkTokens]) {
    for (const color of Object.values(theme)) {
      assert.match(color.hex, /^#[\da-f]{6}$/i)
      assert.match(color.hsl, /^[\d.]+ [\d.]+% [\d.]+%$/)
    }
  }
})

test('email and PDF exports are usable without a browser or CSS variables', () => {
  for (const tokens of [emailTokens, pdfTokens]) {
    for (const color of Object.values(tokens.colors)) assert.match(color, /^#[\da-f]{6}$/i)
    for (const radius of Object.values(tokens.radii)) assert.match(radius, /^\d+px$/)
    assert.ok(tokens.fonts.body)
    assert.doesNotMatch(JSON.stringify(tokens), /var\(--/)
  }
})
