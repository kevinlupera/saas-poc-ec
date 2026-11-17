// Backend rule: every API endpoint in apps/api/server/api has
//   1. OpenAPI metadata (`defineRouteMeta`), and
//   2. an MCP tool in apps/mcp/server/tools that declares `export const route = 'METHOD /path'`,
//      or an explicit, reasoned entry in scripts/api-contract.exemptions.json.
// Run with `pnpm check:api` (part of `pnpm check`). Static: it reads the source files.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// API_CONTRACT_ROOT lets the test suite point the checker at fixture trees.
const root = process.env.API_CONTRACT_ROOT ?? fileURLToPath(new URL('..', import.meta.url))
const API_DIR = join(root, 'apps/api/server/api')
const TOOLS_DIR = join(root, 'apps/mcp/server/tools')
const EXEMPTIONS = join(root, 'scripts/api-contract.exemptions.json')
const ROUTE_FILE = /^(.*)\.(get|post|put|patch|delete)\.ts$/
const REQUIRED_META = ['operationId:', 'tags:', 'description:', 'responses:']

const errors = []

function* files(dir) {
  if (!existsSync(dir)) return
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) yield* files(join(dir, e.name))
    else yield join(dir, e.name)
  }
}

/** apps/api/server/api/tenants/[tenantId]/me.get.ts -> "GET /api/tenants/{tenantId}/me" */
function routeOf(file) {
  const rel = relative(API_DIR, file).split(sep).join('/')
  const m = ROUTE_FILE.exec(rel)
  // A file the checker cannot map to a route must not be skipped silently: it would escape the rule.
  if (!m) {
    errors.push(`${rel}: name it <name>.<get|post|put|patch|delete>.ts (one handler per method) so its OpenAPI doc and MCP tool can be checked`)
    return null
  }
  const path = m[1].replace(/\/?index$/, '').replace(/\[\.\.\.(\w+)\]/g, '{$1}').replace(/\[(\w+)\]/g, '{$1}')
  return { route: `${m[2].toUpperCase()} /api${path ? '/' + path : ''}`, rel }
}

const routes = new Map()
const operationIds = new Map()

for (const file of files(API_DIR)) {
  const r = routeOf(file)
  if (!r) continue
  routes.set(r.route, r.rel)
  const src = readFileSync(file, 'utf8')
  if (!src.includes('defineRouteMeta(')) {
    errors.push(`${r.route} (${r.rel}): missing defineRouteMeta({ openAPI: ... })`)
    continue
  }
  for (const key of REQUIRED_META) if (!src.includes(key)) errors.push(`${r.route}: OpenAPI metadata is missing \`${key}\``)
  const id = /operationId:\s*(['"`])([^'"`]+)\1/.exec(src)?.[2]
  if (id) {
    if (operationIds.has(id)) errors.push(`${r.route}: operationId '${id}' already used by ${operationIds.get(id)}`)
    operationIds.set(id, r.route)
  }
}

const tools = new Map()
for (const file of files(TOOLS_DIR)) {
  if (!file.endsWith('.ts')) continue
  const m = /export const route\s*=\s*'([A-Z]+ \/[^']*)'/.exec(readFileSync(file, 'utf8'))
  if (m) tools.set(m[1], relative(root, file))
}

const exemptions = existsSync(EXEMPTIONS) ? JSON.parse(readFileSync(EXEMPTIONS, 'utf8')) : []
const exempt = new Map()
for (const e of exemptions) {
  if (typeof e.reason !== 'string' || e.reason.trim().length < 15) errors.push(`exemption '${e.route}' needs a real reason (15+ chars)`)
  if (!routes.has(e.route)) errors.push(`exemption '${e.route}' matches no route (stale? remove it)`)
  if (tools.has(e.route)) errors.push(`exemption '${e.route}' is stale: it has a tool now (${tools.get(e.route)}); remove it`)
  exempt.set(e.route, e)
}

for (const route of routes.keys()) {
  if (!tools.has(route) && !exempt.has(route)) {
    errors.push(`${route}: no MCP tool. Add apps/mcp/server/tools/<name>.ts exporting \`route = '${route}'\`, or an exemption with a reason`)
  }
}
for (const [route, file] of tools) if (!routes.has(route)) errors.push(`${file}: declares route '${route}' which does not exist`)

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error(`\n${errors.length} API contract violation(s). See "API contract" in AGENTS.md.`)
  process.exit(1)
}
console.log(`✓ API contract OK (${routes.size} routes, ${tools.size} with a tool, ${exempt.size} exempt)`)
