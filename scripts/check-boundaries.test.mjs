import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-boundaries.mjs')

function run(coreSource) {
  const root = mkdtempSync(join(tmpdir(), 'boundaries-'))
  try {
    for (const dir of ['apps/web', 'packages/shared', 'packages/core', 'packages/ui']) {
      mkdirSync(join(root, dir, 'src'), { recursive: true })
      writeFileSync(join(root, dir, 'package.json'), '{}')
    }
    writeFileSync(join(root, 'packages/core/src/a.ts'), coreSource)
    const r = spawnSync(process.execPath, [script], { env: { ...process.env, BOUNDARIES_ROOT: root + '/' }, encoding: 'utf8' })
    return { code: r.status, out: r.stdout + r.stderr }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// test('core may import its own relative files', () => assert.equal(run("import './b.ts'").code, 0))
// for (const src of ["import 'better-auth'", "import { x } from 'better-auth/plugins'", "export * from 'drizzle-orm'", "await import('h3')"]) {
//   test(`core cannot import a forbidden package: ${src}`, () => {
//     const r = run(src)
//     assert.equal(r.code, 1, r.out)
//     assert.match(r.out, /must not use/)
//   })
// }
// test('a similarly named package is not a false positive', () => assert.equal(run("import 'better-authx'").code, 0))
