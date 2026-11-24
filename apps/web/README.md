# Frontend web

Nuxt 4 con generación estática, componentes `@saas/ui` y cliente Vue oficial de Better Auth **1.7.26**. Este paquete implementa la interfaz y el contrato cliente; la autenticación la sirve `apps/api` (ver *Backend integration*).

## Desarrollo y configuración

Desde la raíz del monorepo:

```bash
pnpm install
NUXT_PUBLIC_API_BASE=http://localhost:3001 pnpm dev:web
```

La web se sirve en `http://localhost:3000`. `NUXT_PUBLIC_API_BASE` es la base pública de la API (por defecto `http://localhost:3001`), no un secreto ni una ruta de login. Better Auth usa el prefijo `/api/auth`; no lo añadas otra vez al configurar la API. El cliente incluye cookies (`credentials: include`) y no utiliza `$api` como sustituto del protocolo de identidad.

Para cambiar de ambiente en este sitio **estático**, configurar la variable durante el build y regenerar/republicar los archivos. Cambiar una variable solo en el hosting después del build no reescribe los valores públicos ya generados.

## Pantallas

| Ruta | Comportamiento |
| --- | --- |
| `/login` | Email/contraseña o Google; errores recuperables y acceso a recuperación |
| `/registro` | Nombre/email/contraseña/confirmación o Google; no crea negocio ni tenant |
| `/recuperar-contrasena` | Solicita instrucciones por email; mensaje genérico tras aceptación |
| `/restablecer-contrasena` | Consume el token del enlace y establece la nueva contraseña |
| `/verificar-email` | Instrucciones y reenvío; consulta la sesión para confirmar verificación si existe |
| `/auth/complete` | Resuelve sesión y permite cerrarla; no es un dashboard |
| `/terms`, `/privacy` | Borradores explícitos, pendientes de contenido y revisión legal antes del lanzamiento |
| `/support` | Ayuda básica con enlaces a los flujos de acceso; sin canales de contacto inventados |

La landing mantiene sus enlaces públicos. No se excluyen `/terms`, `/privacy` ni `/support` del prerender y no se suprimen errores del crawler para ocultar páginas ausentes. Los borradores **no son documentos legales aprobados**, no solicitan aceptación ni acreditan cumplimiento de la LOPDP.

## Backend integration (`apps/api`)

The API mounts Better Auth 1.7.26 under `/api/auth` (spec `identity/auth-api`). The screens call the official client; these are the operations they use:

| Client action | API operation under `/api/auth` | Status |
| --- | --- | --- |
| `signUp.email` | `POST /sign-up/email` | Connected. Returns **no session** until the email is verified |
| `signIn.email` | `POST /sign-in/email` | Connected. Unverified account → `403 EMAIL_NOT_VERIFIED` and a new verification email |
| `signIn.social` (Google) | `POST /sign-in/social` | Connected when Google is configured on the API |
| `getSession` / `useSession` | `GET /get-session` | Connected |
| `signOut` | `POST /sign-out` | Connected |
| `sendVerificationEmail` | `POST /send-verification-email` | Connected |
| Verification link | `GET /verify-email?token=…&callbackURL=…` | Verifies, starts the session, redirects to `/verificar-email` |
| `requestPasswordReset` / `resetPassword` | `POST /request-password-reset`, `POST /reset-password` | **Not connected yet**: the API sends no reset email |

### Local setup

```bash
docker compose up -d                  # Postgres :5433 + Mailpit (SMTP :1025, inbox http://localhost:8025)
DATABASE_URL=postgres://saas:saas@localhost:5433/saas pnpm --filter @saas/db db:migrate
APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role
cp apps/api/.env.example apps/api/.env   # set NITRO_AUTH_SECRET (openssl rand -base64 32)
pnpm dev:api                          # http://localhost:3001
NUXT_PUBLIC_API_BASE=http://localhost:3001 pnpm dev:web
```

Register on `/registro`, open the email in Mailpit (`http://localhost:8025`) and click the link: the API verifies the email, sets the session cookie and returns you to `/verificar-email`; `/auth/complete` then shows the session. Accounts created before verification was required are unverified: signing in sends them a new link.

### Email delivery (API env, server only)

| Variable | Use |
| --- | --- |
| `NITRO_RESEND_API_KEY`, `NITRO_EMAIL_FROM` | Resend. **Required in production**: the API refuses to start without both. Setting the key in any environment selects Resend |
| `NITRO_SMTP_HOST`, `NITRO_SMTP_PORT` | Non-production without a Resend key: plain SMTP, no TLS/auth. Defaults `localhost:1025` (Mailpit). Sender defaults to `no-reply@localhost` |

Delivery is not awaited by the request (the response time must not reveal accounts); failures are logged without the link or token, and `/verificar-email` offers a resend.

### Google (API env, server only)

1. Create an OAuth client (web application) in Google Cloud. Authorized redirect URI: **the API callback** `http://localhost:3001/api/auth/callback/google` (and the production API URL). It is not a web URL.
2. Set `NITRO_GOOGLE_CLIENT_ID` and `NITRO_GOOGLE_CLIENT_SECRET` on the API, both or neither (empty = Google disabled; only one fails startup). Never put them in `runtimeConfig.public` or the web bundle.
3. Web returns are fixed by this frontend: success `/auth/complete`, error or cancel `/login?error=oauth`.

Linking rule: Google signs into an existing email/password account with the same email **only if that account's email is verified**. An unverified account is never linked (whoever pre-registered an address cannot share the real owner's account) and the user lands on `/login?error=oauth`; once the email is verified, Google signs into that same account.

### Origins, CORS and cookies

- `NITRO_WEB_ORIGIN` is the only CORS origin with credentials and the only trusted origin for callbacks; other callback URLs and foreign `Origin` requests carrying cookies are rejected.
- Locally web (`:3000`) and API (`:3001`) are the same site, so Better Auth's HttpOnly `SameSite=Lax` cookies work. Production requires HTTPS; cross-site deployments (`SameSite=None; Secure`, third-party cookie blocking) are **not set up** yet.
- The frontend uses its own fixed return destinations and ignores free `next`/`redirect` parameters.
- The session is only read in the browser; no passwords or tokens are stored in `localStorage`, `sessionStorage` or JavaScript-readable cookies. The UI does not replace backend authorization.

### Contract check

`pnpm e2e:auth` (API + Postgres + Mailpit running) exercises the API contract over HTTP: sign-up without session, the verification link read from the Mailpit API, verified session, sign-in, identical errors for wrong password and unknown email, sign-out, foreign origin/callback rejection and Google start. Set `EXPECT_GOOGLE=1` to require Google to be configured.

## Pruebas

Desde la raíz:

```bash
pnpm check
pnpm --filter @saas/web test:theme
pnpm --filter @saas/web test:auth
pnpm --filter @saas/web exec playwright install chromium
pnpm --filter @saas/web test:e2e
```

`test:e2e` genera el sitio y abre Chromium contra sus archivos estáticos. Si el build ya está actualizado:

```bash
pnpm --filter @saas/web test:e2e:built
```

Playwright inicia/cierra su servidor estático local en `http://127.0.0.1:4173`. No debe haber otro proceso usando ese puerto. El servidor de `tests/serve-static.mjs` solo sirve archivos de `.output/public`; no implementa endpoints de identidad.

Las pruebas interceptan las solicitudes HTTP a la API local con fixtures de Better Auth 1.7.26 y datos exclusivamente de test. Cubren validación, respuestas aceptadas con/sin sesión, errores, cargas, duplicados, Google, callbacks, cierre, recuperación, verificación y tokens inválidos, navegación pública, recarga, temas, teclado y 320 px. No existe un modo mock en la aplicación de producción. Las pruebas Node verifican bases configurables, cookies, creación de cliente sin solicitudes, mensajes seguros y destinos fijos.

**Límite de la prueba:** red interceptada no valida el intercambio OAuth real con Google, entrega de emails, persistencia en base de datos o atributos de cookies entre dominios reales. No se debe afirmar que esos servicios están integrados por pasar esta suite.

## Build y hosting

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3001 pnpm --filter @saas/web build
pnpm --filter @saas/web preview
```

Publicar `apps/web/.output/public`. Se generan las rutas base de autenticación explícitamente y las páginas públicas mediante el crawler. El hosting debe servir el `index.html` de cada directorio al acceder a rutas como `/login` y `/auth/complete`, con o sin slash final y preservando query strings para el cliente. Si requiere fallback de SPA para navegación no prerenderizada, usar `200.html`; no redirigir todas las rutas a `/` ni incluir tokens en logs de acceso. Las rutas anteriores no necesitan depender del fallback porque tienen HTML propio.

## Checklist real pendiente antes del lanzamiento

- [ ] API Better Auth operativa y compatible, validación de contraseñas y no enumeración/rate limiting comprobados.
- [ ] Login y registro reales desde el origen público (verificación requerida), consulta/expiración y cierre de sesión comprobados. Local: cubierto por `pnpm e2e:auth`.
- [ ] CORS, trustedOrigins, cookies HttpOnly/SameSite/Secure y CSRF probados desde el origen público definitivo.
- [ ] Google real con el cliente OAuth definitivo: cuenta nueva, login de vuelta, cancelación → `/login?error=oauth`, email de una cuenta con contraseña sin verificar (rechazado) y verificada (misma cuenta), sesión en `/auth/complete`; sin secretos públicos.
- [ ] Correos reales con Resend (dominio remitente verificado, `NITRO_RESEND_API_KEY` y `NITRO_EMAIL_FROM` en producción): verificación inicial, reenvío y al iniciar sesión sin verificar; enlaces válidos, vencidos y reutilizados; entrega confirmada desde Lambda. Recuperación de contraseña pendiente de backend.
- [ ] Hosting estático: acceso directo/recarga a todas las rutas y enlaces con query.
- [ ] Reemplazar borradores de `/terms` y `/privacy` por documentos aprobados; definir canales reales de soporte y revisar el resto del contenido comercial de la landing antes de publicación.

Esta checklist corresponde a la integración y preparación externa del lanzamiento. No se completa con respuestas interceptadas ni requiere implementar backend dentro de este cambio.

## Verificación de este cambio (2026-11-20)

- `pnpm check`: límites de paquetes, tokens (3/3) y typecheck del workspace correctos.
- `pnpm --filter @saas/web test:theme`: 7/7.
- `pnpm --filter @saas/web test:auth`: 8/8.
- `pnpm --filter @saas/web build`: generación estática correcta, incluyendo las tres páginas públicas sin exclusiones. El bundle SSR no incluye el cliente Better Auth ni consultas `/get-session`.
- `pnpm --filter @saas/web test:e2e:built`: 43/43 en Chromium contra el sitio generado, con API interceptada solo en tests. Incluye login completo con teclado, envío inválido con Enter y seis variantes de validación de registro (nombre, email, contraseña vacía/corta/larga y confirmación vacía).
- Regresión de verificación corregida y probada: los enlaces inválidos/vencidos mantienen el aviso y permiten reenviar incluso con una sesión cuyo email ya está verificado. El retorno válido sin error sigue mostrando la verificación confirmada por la API.
- Comprobación visual adicional: landing → validación de login → registro en 320 px y tema oscuro, sin errores de ejecución del navegador. Se comprobó contraste de campos y texto tras resolver el tema.
- Revisión de output público: sin fixtures de identidad, credenciales de Google ni mocks de tests; sin cambios de implementación en `apps/api`.
- La API local respondía 404 a `/api/auth/get-session` en esa fecha (superado: ver *Backend integration* y la verificación de `connect-auth-backend`).
- Advertencia no bloqueante del build: Nuxt informa que `tailwindcss/nesting` no se puede cargar. El build y las pruebas pasan; no se ha cambiado la configuración de PostCSS fuera del alcance de este trabajo.
- `openspec validate frontend-auth --strict`: correcto antes del archivo. Specs principales sincronizadas y validadas; cambio archivado en `openspec/changes/archive/2026-11-20-frontend-auth/`.

## Verification: `connect-auth-backend` (2026-11-24)

- `pnpm check` and `pnpm test`: pass (includes `parseConfig` email/Google rules, Resend sender, verification link).
- `pnpm e2e:auth`: 25/25 against API + Postgres + Mailpit, with Google configured (authorization URL, `redirect_uri` = API callback) and without it (client error, no redirect).
- `pnpm e2e:tenant` 11/11 and `pnpm e2e:oauth` (MCP 200 with token, 401 without, `tenant_id` = org) after moving them to verified sign-up.
- `pnpm --filter @saas/web test:e2e:built`: 43/43, including the real cancel return `/login?error=oauth&error=access_denied` (repeated `error` parameter; it previously hid the message).
- Manual browser check (web :3010, API :3011, local ports clashed with other projects), real Google OAuth client:
  - Email sign-up → `/verificar-email` → link from Mailpit → signed in; sign-out; sign-in with email: OK.
  - Google sign-in with a new account → `/auth/complete` with the Google identity: OK.
  - Google cancel → `/login?error=oauth&error=access_denied` with the retry message, no session: OK.
  - **Passed:** Google with the email of an already verified password account: lands on `/auth/complete` with the name given at registration (same account), and the user now has both `credential` and `google` accounts, no `/login?error=oauth`.
