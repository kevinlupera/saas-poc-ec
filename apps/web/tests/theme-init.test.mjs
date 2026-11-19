import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { themeInitScript as script } from '../scripts/theme-init.ts'

for (const { name, saved, systemDark, blocked, expected } of [
  { name: 'saved dark overrides light system', saved: 'dark', systemDark: false, expected: 'dark' },
  { name: 'saved light overrides dark system', saved: 'light', systemDark: true, expected: 'light' },
  { name: 'no saved theme uses dark system', saved: null, systemDark: true, expected: 'dark' },
  { name: 'no saved theme uses light system', saved: null, systemDark: false, expected: 'light' },
  { name: 'invalid saved theme uses system', saved: 'invalid', systemDark: true, expected: 'dark' },
  { name: 'blocked storage uses dark system', blocked: true, systemDark: true, expected: 'dark' },
  { name: 'blocked storage uses light system', blocked: true, systemDark: false, expected: 'light' },
]) {
  test(name, () => {
    const classes = new Set(['existing-class', 'dark'])
    const root = {
      classList: {
        toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name) },
      },
      style: {},
    }
    runInNewContext(script, {
      document: { documentElement: root },
      localStorage: {
        getItem(key) {
          assert.equal(key, 'theme')
          if (blocked) throw new Error('Storage blocked')
          return saved
        },
      },
      window: {
        matchMedia(query) {
          assert.equal(query, '(prefers-color-scheme: dark)')
          return { matches: systemDark }
        },
      },
    })
    assert.equal(classes.has('dark'), expected === 'dark')
    assert.ok(classes.has('existing-class'))
    assert.equal(root.style.colorScheme, expected)
  })
}
