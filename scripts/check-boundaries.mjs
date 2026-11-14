// Checks that each monorepo package only depends on what it is allowed to.
// Run with `pnpm check:boundaries` (also part of `pnpm check`).
// Two checks per package:
//   1. Declared dependencies (package.json) against the forbidden list.
//      pnpm doesn't hoist to the root, so an undeclared package can't be imported anyway.
//   2. Relative imports (`../..`) must stay inside the package folder.
//      Parsed with TypeScript's own scanner (`ts.preProcessFile`), so comments and strings
//      are skipped correctly. Covers `import`, `export … from`, `import()` and `require()`;
//      for .vue files only the `<script>` blocks are scanned. Not covered yet (add when
//      they show up): `<style src="../..">` / `@import '../..'` in .vue/.css and tsconfig `paths`.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))

/** folder → forbidden dependencies (and why) */
const rules = {
  // The browser never touches the database or server-side logic.
  'apps/web': ['@saas/core', '@saas/db', 'drizzle-orm'],
  // Shared contract: plain TypeScript, no frameworks, no higher layers.
  'packages/shared': ['@saas/core', '@saas/db', '@saas/ui', 'vue', 'nuxt', 'nitropack', 'drizzle-orm'],
  // UI only knows the shared contract, never the database or use cases.
  'packages/ui': ['@saas/core', '@saas/db', 'drizzle-orm'],
}

const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.nitro', '.output', '.wrangler', 'dist'])
const SOURCE_EXT = /\.(?:[cm]?[jt]s|vue)$/
const VUE_SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/g

/** Module specifiers imported by a source file (comments and strings ignored). */
function importsOf(path) {
  let code = readFileSync(path, 'utf8')
  if (path.endsWith('.vue')) code = [...code.matchAll(VUE_SCRIPT)].map((m) => m[1]).join('\n')
  return ts.preProcessFile(code, true, true).importedFiles.map((f) => f.fileName)
}

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* sourceFiles(join(dir, entry.name))
    } else if (SOURCE_EXT.test(entry.name)) {
      yield join(dir, entry.name)
    }
  }
}

const errors = []
for (const [dir, forbidden] of Object.entries(rules)) {
  const pkgDir = join(root, dir)
  const file = join(pkgDir, 'package.json')
  if (!existsSync(file)) {
    errors.push(`rule for ${dir}: package.json not found (folder moved? update the rules)`)
    continue
  }

  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies }
  for (const name of forbidden) {
    if (name in deps) errors.push(`${dir} must not depend on ${name}`)
  }

  for (const src of sourceFiles(pkgDir)) {
    for (const spec of importsOf(src)) {
      if (!spec.startsWith('.')) continue
      const target = resolve(dirname(src), spec)
      if (target !== pkgDir && !target.startsWith(pkgDir + sep)) {
        errors.push(`${relative(root, src)} imports '${spec}', outside ${dir}`)
      }
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error(`\n${errors.length} boundary violation(s). See "Rules" in README.md.`)
  process.exit(1)
}
console.log('✓ Package boundaries OK')
