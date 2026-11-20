# Design

## Context

Ver la motivación en `proposal.md`. La aplicación usa Nuxt 4 y genera un sitio estático (`apps/web/package.json`: `nuxt generate`). `app.vue` renderiza `NuxtPage`, existe una sola página de landing y el layer `@saas/ui` proporciona componentes y tokens compartidos. Todavía faltan primitivas de formulario como Input y Label.

`runtimeConfig.public.apiBase` ya se configura mediante `NUXT_PUBLIC_API_BASE`, con `http://localhost:3001` como valor local. El plugin `$api` usa cookies; la API ya dispone de CORS con origen web explícito y credenciales. No existen dependencia, cliente, endpoints ni sesión de Better Auth. El CORS actual es una base, no prueba de que OAuth y cookies funcionen en producción.

El diseño es necesario por la nueva dependencia de identidad y las fronteras de seguridad entre el sitio estático, una API separada y Google. La capability principal es `identity/user-auth`; los accesos de la landing y los tokens se ajustan a contratos existentes. Tras detectar enlaces existentes a páginas ausentes, se autorizó añadir `marketing/public-information` para resolver sus rutas sin excluirlas del prerender.

## Goals / Non-Goals

**Goals:**
- Separar presentación, cliente de identidad y adaptación de errores sin crear una capa de servicios genérica.
- Mantener el despliegue estático: no consultar sesiones ni transportar cookies privadas durante prerender.
- Poder probar los flujos con respuestas controladas en tests, conservando llamadas reales en producción.
- Dejar una frontera documentada que permita incorporar el backend después sin rehacer las pantallas.

**Non-Goals:**
- No introducir servidores Nuxt de autenticación, proxies, endpoints Nitro, esquemas de base de datos ni plugins de autorización.
- No construir el dashboard ni tratar el retorno autenticado como onboarding del negocio.
- No resolver account linking con lógica propia, permisos de tenants, invitaciones, 2FA o acceso sin contraseña del cliente de reservas.
- No configurar Google Cloud ni enviar emails desde el navegador.

## Decisions

### 1. Cliente oficial Vue, instanciado desde configuración de Nuxt

Añadir `better-auth` a `@saas/web` e importar `createAuthClient` desde `better-auth/vue`. Instanciarlo en un plugin de cliente usando `useRuntimeConfig().public.apiBase`; no capturar configuración de un ambiente en un singleton de módulo ni importar módulos de servidor de Better Auth. El adaptador de autenticación permanece en `apps/web`, fuera de `@saas/ui` y `@saas/shared`.

Usar el origen/base de la API y el prefijo `/api/auth`, evitando concatenar ese prefijo dos veces. El contrato inicial de `NUXT_PUBLIC_API_BASE` será la base de la API existente, no la URL de un endpoint. Las opciones de fetch del cliente deben incluir credenciales de manera explícita y verificarse en pruebas. No reutilizar `$api` como si fuera el protocolo de Better Auth: cada cliente conserva su responsabilidad.

Fijar en el lockfile una versión estable compatible al implementar y verificar los tipos y documentación de esa versión. Un composable fino expondrá cliente, sesión y errores de presentación; no copiar todos los métodos de la librería ni crear un SDK propio.

**Alternativa descartada:** formularios que llaman endpoints inventados con `$fetch`; duplicarían el contrato de identidad y el manejo de sesión.

### 2. Rutas concretas y un retorno mínimo, sin dashboard

| Ruta | Responsabilidad |
| --- | --- |
| `/login` | Email/contraseña, Google, acceso a registro y recuperación |
| `/registro` | Nombre, email, contraseña, confirmación y Google |
| `/recuperar-contrasena` | Solicitud por email y confirmación genérica |
| `/restablecer-contrasena` | Lectura del token, nueva contraseña y confirmación |
| `/verificar-email` | Instrucciones, email editable para reenvío y estados de error |
| `/auth/complete` | Resolver sesión; mostrar identidad mínima, cierre de sesión o acceso al login |

El retorno autenticado evita enviar a una ruta de panel inexistente. No crea negocio ni selecciona vertical. No se añade middleware de rutas protegidas global: no existe todavía una superficie de negocio que proteger. `/auth/complete` muestra carga, identidad confirmada, estado anónimo o error recuperable; nunca datos ficticios.

Usar callbacks absolutos derivados del origen web en el navegador y rutas constantes. El flujo inicial no necesita un parámetro libre `next`/`redirect`; si aparece, ignorarlo y usar el destino fijo. No confiar en la query para autorizar o declarar autenticación.

**Alternativa descartada:** añadir un dashboard placeholder o completar el onboarding; ampliaría el alcance sin contrato de negocio.

### 3. Formularios y layout compartidos con la identidad visual existente

Añadir un layout de autenticación con marca enlazada a la landing, navegación de retorno y cambio de tema, reutilizando `useTheme`. Si se usa el sistema de layouts, envolver `NuxtPage` en `NuxtLayout` en `app.vue` y comprobar que la landing mantiene su estructura.

Usar Card y Button existentes. Incorporar solo Input y Label, y cualquier otra primitiva estrictamente necesaria, según las convenciones de shadcn-vue ya adoptadas. Los formularios, mensajes y botón de proveedor son componentes locales de autenticación; no mover lógica de negocio al layer UI.

Cada formulario tendrá etiqueta visible, `autocomplete` apropiado, validación por campo, error general anunciado, foco al primer error, envío pendiente y prevención de duplicados. Permitir pegado y gestores de contraseñas. Deshabilitar envíos durante solicitudes, no permanentemente después de un fallo. La validación de formato no sustituye la del servidor. Usar la política por defecto de contraseñas de la versión elegida y documentarla para alinear el backend; la confirmación nunca se envía a la API.

**Alternativa descartada:** un motor dinámico de formularios, múltiples dependencias de validación o rediseñar la landing. Las necesidades actuales permiten formularios pequeños y helpers puntuales.

### 4. Flujos oficiales de Better Auth y estados explícitos

Métodos documentados que deberán comprobarse contra la versión instalada:

| Acción | Cliente | Destino / resultado |
| --- | --- | --- |
| Login | `signIn.email` | Confirmar sesión antes de mostrar el retorno autenticado |
| Registro | `signUp.email` | Verificación/acceso si no hay sesión; retorno si hay sesión válida |
| Google, desde ambas pantallas | `signIn.social({ provider: 'google', ... })` | Callback web `/auth/complete`; error al login |
| Recuperación | `requestPasswordReset` | `redirectTo` web `/restablecer-contrasena` |
| Restablecimiento | `resetPassword` | Token y `newPassword`; confirmación con acceso al login |
| Reenvío de verificación | `sendVerificationEmail` | `callbackURL` web `/verificar-email` |
| Sesión | `useSession` / `getSession` | Cookies y estados cargando, autenticado, anónimo o error |
| Salida | `signOut` | Invalidar/refrescar estado y volver al login tras confirmación |

El backend procesa el enlace original de verificación y luego redirige al frontend. La pantalla de retorno de verificación puede consultar la sesión y su atributo de email verificado; sin evidencia de la API solo muestra instrucciones para continuar al login. Un indicador de URL no prueba verificación. Los errores del enlace se normalizan y ofrecen reenvío. No crear un endpoint de verificación en la web.

El enlace de recuperación incorpora el token en la URL según el contrato de Better Auth. Mantenerlo solo en memoria durante el formulario; no registrarlo, guardarlo en storage ni enviarlo a analíticas. Retirar el token de la barra del navegador una vez capturado cuando sea compatible con el flujo, y no volver a utilizarlo tras éxito o rechazo. Una recarga sin token ofrece solicitar otro enlace. Establecer una política de referrer apropiada para páginas sensibles y no cargar terceros allí.

El éxito de una solicitud de email significa aceptación de la API, no entrega. Recuperación y reenvío usan mensajes genéricos. El registro debe tolerar respuestas indistinguibles para cuentas nuevas y existentes cuando la API aplica esa política. No deducir si existe una cuenta. No presentar un error `403` cualquiera como email sin verificar: usar el código documentado del backend.

Google usa autorización por redirección, no un SDK adicional ni tokens manuales en el navegador. Los destinos de éxito y error usan las opciones soportadas por la versión instalada. Capturar errores al iniciar el flujo y al volver del proveedor, limpiar carga y ofrecer reintento. El backend es dueño del intercambio de código, `state`, cuenta vinculada y validación del proveedor.

**Alternativa descartada:** simular registros, enlaces o sesiones cuando la API no existe; ocultaría las dependencias reales.

### 5. Sesión únicamente en el navegador para este sitio estático

No se consultará sesión en prerender ni se guardará identidad de una persona en HTML generado. La inicialización de la sesión vive en cliente, con un estado inicial de carga coherente con el HTML estático. Evitar usar un plugin `.client` desde setup del servidor sin una frontera explícita de cliente.

Usar el estado reactivo de Better Auth y evitar una segunda fuente de verdad persistente. Distinguir un resultado válido sin sesión de un fallo de red. Tras login, retorno de Google o sign-out, actualizar/invalidar la sesión según el cliente oficial. No borrar la identidad por un cierre fallido como si el servidor ya hubiera invalidado la cookie.

Cookies HttpOnly y sus atributos los determina el backend. No almacenar contraseñas, tokens de sesión ni tokens del proveedor en `localStorage`, `sessionStorage` o cookies legibles por JavaScript. Los estados de UI no reemplazan controles de acceso de la API.

**Alternativa descartada:** autenticación SSR ahora. El sitio usa generación estática y una API separada; SSR exigiría otro despliegue y transporte de cookies fuera del alcance.

### 6. Contrato que deberá implementar el backend futuro

Documentar en `apps/web/README.md` durante la implementación:

- Base local: web `http://localhost:3000`, API `http://localhost:3001`, prefijo Better Auth `/api/auth`.
- Operaciones oficiales de email/password, registro, recuperación, restablecimiento, verificación, Google, consulta y cierre de sesión; no definir respuestas JSON alternativas al cliente instalado.
- Backend compatible con la versión del cliente, autenticación por email habilitada y política de contraseña alineada. Recomendación de integración: exigir verificación para credenciales y configurar envío inicial/reenvío, sin imponer al frontend que todos los registros devuelvan sesión.
- Handlers de envío de verificación y recuperación con enlaces correctos y políticas de no enumeración/rate limiting del lado servidor. La UI no garantiza no enumeración por sí sola.
- Google habilitado en el servidor. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y secreto de Better Auth nunca entran en `runtimeConfig.public` ni en variables del bundle web.
- Callback OAuth registrado en Google para **la API**, localmente `http://localhost:3001/api/auth/callback/google`. No confundirlo con `/auth/complete`, que es el retorno web posterior.
- Origen web permitido en `trustedOrigins` y callbacks válidos; CORS con origen explícito, credenciales, métodos y headers requeridos por el cliente. El backend sigue validando CSRF/origen y destinos; no se deshabilitan esas protecciones para integrar.
- En producción, HTTPS y cookies con atributos correctos. Preferir web y API bajo el mismo sitio; si están en sitios distintos, revisar `SameSite=None; Secure`, bloqueo de cookies de terceros y compatibilidad real del navegador antes de declarar viable el despliegue.
- Probar aceptación y rechazo real de credenciales, emails y tokens una vez disponible el backend. Las pruebas con respuestas interceptadas no certifican OAuth, entrega de correo ni cookies reales entre dominios.

**Alternativa descartada:** modificar ahora `apps/api` o dar por suficiente el middleware CORS existente. Este cambio entrega una integración preparada, no una API operativa.

### 7. Pruebas por contrato y de navegador, sin modo mock de producción

Añadir pruebas de helpers y del adaptador cuando aporten valor, más pruebas de navegador con red interceptada en el límite HTTP. Los fixtures deben corresponder al protocolo de la versión instalada; no limitarse a sustituir un composable que siempre devuelve éxito. Una respuesta de registro sin sesión merece un caso independiente.

Cubrir rutas, validaciones, cargas y errores, sesión y salida, Google con callback y cancelación, tokens ausentes/vencidos, errores desconocidos, no enumeración visual y rechazo de destinos externos. Probar al menos 320 px, escritorio, tema oscuro, teclado y recarga directa de rutas en un build generado. Comprobar también indisponibilidad de API. Las rutas prerenderizadas no deben depender de un backend disponible.

Usar herramientas existentes cuando alcancen; actualmente solo hay pruebas Node para tema, por lo que una herramienta de navegador como Playwright puede añadirse a la web para estos escenarios. No introducir una plataforma de pruebas completa ni un servidor de autenticación de desarrollo permanente.

### 8. Páginas públicas faltantes, sin exclusiones del build

La landing ya enlaza a `/terms`, `/privacy` y `/support`; el crawler falla con 404 porque no existen. La ampliación autorizada añade esas tres páginas al frontend reutilizando el layout temático y navegación de retorno. Términos y privacidad se identifican como borradores no definitivos, sin aceptación contractual ni afirmaciones de cumplimiento legal. No se inventan responsables, plazos o contactos. Soporte incluye enlaces internos a los flujos de acceso y explica sus limitaciones actuales. El hosting debe servir las tres rutas, verificadas mediante acceso directo y enlaces del footer. Antes del lanzamiento, los borradores requieren reemplazo por contenido aprobado. No se desactiva el crawler ni `failOnError`.

## Risks / Trade-offs

- [Backend aún inexistente] -> Aceptar como entregable UI, cliente, tests controlados y contrato; declarar pendiente el E2E real, sin falsearlo.
- [Evolución de Better Auth] -> Fijar versión y comprobar API pública, códigos de error y fixtures durante implementación.
- [Cookies entre orígenes/sitios] -> Contrato explícito y prueba real por ambiente antes de considerar integrada la autenticación.
- [Rutas estáticas con query/token] -> Generar las rutas base sin queries, gestionar parámetros en cliente y documentar rewrites/fallback del hosting.
- [Regresión del tema o landing al introducir layout] -> Mantener sus tests y comprobar navegación/tema en ambas superficies.
- [Mensajes de URL manipulados] -> Tratarlos como información no confiable, nunca como sesión o verificación confirmada.
- [Doble clic, respuesta tardía o error de proveedor] -> Un envío activo por formulario, estados explícitos y salidas recuperables.

## Migration Plan

1. Incorporar cliente y pruebas en la web; no migrar datos ni tocar la API.
2. Añadir primitivas mínimas, layout, pantallas, sesión y enlaces de landing.
3. Verificar typecheck, límites de paquetes, tokens, pruebas existentes, nuevas pruebas y generación estática.
4. Publicar la web con `NUXT_PUBLIC_API_BASE` correcto y configuración de rutas del hosting. Mientras no exista backend, las operaciones fallan de forma visible y recuperable.
5. Integrar posteriormente la API siguiendo la checklist y ejecutar pruebas reales de credenciales, cookies, Google y emails. Este paso es un prerrequisito externo, no una tarea de implementación de este cambio.

**Rollback:** revertir los cambios de frontend, dependencias y lockfile y volver a desplegar la versión anterior. No existen migraciones de datos ni cambios de endpoints que revertir.

## References

Documentación oficial consultada al elaborar el plan; volver a contrastarla con la versión seleccionada al implementar:
- https://www.better-auth.com/docs/integrations/nuxt
- https://www.better-auth.com/docs/authentication/email-password
- https://www.better-auth.com/docs/authentication/google
