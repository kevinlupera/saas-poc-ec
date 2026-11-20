# Frontend web

Nuxt 4 con generación estática, componentes `@saas/ui` y cliente Vue oficial de Better Auth **1.7.26**. Este paquete implementa la interfaz y el contrato cliente; **no incorpora un backend de autenticación**.

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

## Contrato de integración del backend pendiente

Implementar Better Auth en la API, con una versión compatible con el cliente fijado en el lockfile. No basta con responder objetos propios: los fixtures de tests siguen el protocolo de Better Auth y las pantallas llaman al cliente oficial.

| Acción cliente | Operación de API relativa a `/api/auth` |
| --- | --- |
| `signIn.email` | `POST /sign-in/email` |
| `signUp.email` | `POST /sign-up/email` |
| `signIn.social` | `POST /sign-in/social` |
| `getSession` / `useSession` | `GET /get-session` y refresh cuando lo requiera el protocolo |
| `signOut` | `POST /sign-out` |
| `requestPasswordReset` | `POST /request-password-reset` |
| `resetPassword` | `POST /reset-password` |
| `sendVerificationEmail` | `POST /send-verification-email` |
| Enlace de verificación procesado por la API | `GET /verify-email` con token y callback |

### Credenciales y sesión

- Habilitar email/contraseña en el backend. La validación de nuevas contraseñas usa los valores por defecto de Better Auth: **8 a 128 caracteres**; alinear la política de servidor. No recortar contraseñas y no enviar la confirmación a la API. El login no aplica una longitud mínima a contraseñas existentes.
- Recomendado: exigir verificación para acceso por credenciales y configurar envío inicial de verificación. El registro tolera una respuesta aceptada sin sesión (incluidas respuestas sintéticas para no enumeración); en ese caso lleva a verificación. Una aceptación no garantiza cuenta nueva ni entrega de email.
- La identidad visible proviene de la sesión de la API. Se distinguen carga, sesión confirmada, respuesta válida sin sesión y fallo de consulta. Login y Google no muestran acceso confirmado sin resolver sesión.
- La sesión se consulta solo en navegador: no hay cookies de usuarios en HTML generado ni solicitudes de sesión durante prerender. Better Auth mantiene la fuente de verdad reactiva; no se persisten contraseñas o tokens en `localStorage`, `sessionStorage` ni cookies legibles por JavaScript. La preferencia de tema sí puede usar almacenamiento local.
- Un cierre fallido no se trata como invalidación confirmada. La autorización real siempre corresponde al backend; no hay middleware global de panel ni permisos de negocio en este corte.
- Emitir cookies HttpOnly con atributos adecuados al ambiente y conservar las protecciones CSRF/origen de Better Auth. La UI no sustituye rate limiting, validación de tokens, expiración, no enumeración ni controles de acceso.

### Orígenes, CORS y cookies

- API local: `http://localhost:3001`; web local: `http://localhost:3000`.
- Añadir el origen web a `trustedOrigins` y permitir solo callbacks válidos.
- CORS debe permitir el origen web explícito, credenciales, métodos y headers que envía el cliente. No usar `Access-Control-Allow-Origin: *` con cookies. El middleware existente es una base, no una validación de toda la integración.
- Producción requiere HTTPS. Preferir web/API bajo el mismo sitio; si se despliegan en sitios distintos, revisar `SameSite=None; Secure`, bloqueo de cookies de terceros y viabilidad real en los navegadores soportados.
- Este frontend usa destinos de retorno propios y fijos; ignora parámetros libres `next` o `redirect`. El backend debe validar igualmente los destinos y el origen de las solicitudes.

### Google

Responsabilidades del backend/proveedor, **pendientes de implementar/configurar**:

1. Habilitar Google como proveedor social de Better Auth en la API y crear el cliente OAuth correspondiente en Google Cloud.
2. Mantener `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y el secreto de Better Auth en configuración **exclusiva del servidor**, nunca en `runtimeConfig.public` ni en el bundle web.
3. Configurar la base pública de Better Auth con la URL real de la API. Registrar en Google el callback exacto de **la API**, localmente:
   `http://localhost:3001/api/auth/callback/google`.
4. Permitir el origen y callbacks de la web. Tras el intercambio con Google, el retorno exitoso de la aplicación es `/auth/complete`; el retorno de error es `/login?error=oauth`. **No confundir este retorno web con el callback OAuth de la API**.
5. El backend gestiona código OAuth, `state`, tokens del proveedor, cuenta vinculada y creación de identidad. No se añade un SDK de Google al formulario.

Las dos pantallas usan el mismo flujo `signIn.social({ provider: 'google', ... })`. El cliente oficial sigue la redirección devuelta por la API. Un error al iniciarlo o un retorno de cancelación permite reintentar o usar email. El estado autenticado se obtiene después consultando la sesión.

### Enlaces de email

- Configurar en el servidor `emailVerification.sendVerificationEmail` y `emailAndPassword.sendResetPassword`, junto con envío inicial/reenvío, proveedores y las políticas de entrega, rate limiting y no enumeración.
- Recuperación: la solicitud fija `redirectTo` al origen web + `/restablecer-contrasena`. El enlace que emite Better Auth pasa por la API y finalmente lleva a la web con `token=...`, o con un indicador de token inválido/vencido.
- El formulario captura el token solo en memoria y lo retira de la URL mediante reemplazo de historial. No lo registra ni lo guarda en storage. Tras éxito o rechazo por token inválido/vencido, lo descarta. Recargar después de retirarlo exige abrir el enlace de nuevo o solicitar otro.
- Un reset aceptado muestra confirmación y ofrece login; **no presupone sesión iniciada**.
- Verificación: el enlace original se procesa en la API mediante `/verify-email` y redirige a `/verificar-email` en la web. `verified=true` o un indicador similar en la URL no prueba verificación; solo una sesión de la API puede confirmar el estado de su email.
- Recuperación y reenvío muestran confirmación genérica de solicitud aceptada, no confirmación de entrega. Una API ausente produce error recuperable, nunca un éxito simulado. El backend debe aplicar la no enumeración real.
- La web aplica `Referrer-Policy` mediante meta `no-referrer` y no carga analíticas ni scripts de terceros en estas pantallas. No incorporar tokens a logs, capturas de pruebas reales o herramientas de medición.

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
- [ ] Login y registro reales (sesión inmediata y verificación requerida), consulta/expiración y cierre de sesión comprobados.
- [ ] CORS, trustedOrigins, cookies HttpOnly/SameSite/Secure y CSRF probados desde el origen público definitivo.
- [ ] Google real: registro, login, cancelación, retorno y sesión; sin secretos públicos.
- [ ] Correos reales: verificación inicial/reenvío y recuperación; enlaces válidos, vencidos y reutilizados.
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
- La API local responde 404 a `/api/auth/get-session`; esto no impide generar el sitio y confirma que todavía no existe integración de autenticación real.
- Advertencia no bloqueante del build: Nuxt informa que `tailwindcss/nesting` no se puede cargar. El build y las pruebas pasan; no se ha cambiado la configuración de PostCSS fuera del alcance de este trabajo.
- `openspec validate frontend-auth --strict`: correcto antes del archivo. Specs principales sincronizadas y validadas; cambio archivado en `openspec/changes/archive/2026-11-20-frontend-auth/`.
