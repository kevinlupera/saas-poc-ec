// Test-only server for the generated site. No auth endpoints or production mocks.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../.output/public', import.meta.url))
const types = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png', '.woff2': 'font/woff2' }
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
    let path = resolve(root, `.${pathname}`)
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(await readFile(path))
  } catch {
    res.writeHead(404).end('Not found')
  }
}).listen(4173, '127.0.0.1', () => console.log('Generated site ready on port 4173'))
