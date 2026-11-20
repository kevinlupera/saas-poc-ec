# Proposal

## Why

El frontend solo ofrece la landing y sus accesos a login y registro todavía son anclas. Necesitamos un flujo de acceso completo y coherente con el diseño existente, conectado al cliente oficial de Better Auth para integrar posteriormente la API sin rehacer formularios ni simular autenticación.

## What Changes

- Incorporar pantallas de login, registro, recuperación y restablecimiento de contraseña, y verificación de email con reenvío.
- Preparar acceso y registro mediante Google usando el flujo de redirección de Better Auth, incluyendo retorno, cancelación y errores.
- Añadir el cliente Vue de Better Auth en `apps/web`, configurado mediante la URL pública existente de la API, con sesión reactiva basada en cookies.
- Incluir validaciones, estados pendientes, errores recuperables y confirmaciones basadas en respuestas reales; una API ausente no producirá éxitos simulados.
- Reutilizar los componentes y tokens compartidos, con formularios accesibles, responsive y compatibles con ambos temas.
- Conectar los accesos de la landing a las rutas reales y ofrecer una pantalla mínima de retorno que confirme la sesión sin construir el panel del negocio.
- Documentar el contrato de integración y una matriz de comprobación para el futuro backend: rutas, cookies, CORS, emails y configuración de Google.
- Incorporar `/terms`, `/privacy` y `/support` para resolver los enlaces existentes sin excluir rutas del prerender. Términos y privacidad serán borradores explícitos pendientes de revisión; soporte ofrecerá ayuda básica sin contactos inventados. Ampliación autorizada tras detectar los 404 del build.
- Mantener fuera de alcance el backend, base de datos, envío de emails, configuración externa de OAuth, onboarding y verticales, dashboard, invitaciones, 2FA y cuenta pública del cliente de reservas.

## Capabilities

### New Capabilities

- `identity/user-auth`: flujos de acceso del frontend mediante email/contraseña y Google, recuperación y verificación de email, estado de sesión y frontera de integración con Better Auth.
- `marketing/public-information`: páginas informativas enlazadas desde la landing, con borradores legales identificados y ayuda básica de acceso.

### Modified Capabilities

Ninguna. Los enlaces reales de la landing cumplen los requisitos existentes de `marketing/landing-page`; no cambian su contrato. Los formularios consumen `ui/design-tokens` sin modificar sus requisitos.

## Impact

- `apps/web`: nuevas páginas y componentes de autenticación, cliente/plugin, lógica de sesión, validación, mensajes en español y pruebas.
- `apps/web/app/app.vue`: soporte de layout compartido de autenticación si se utiliza `NuxtLayout`, preservando la landing.
- Componentes y datos de la landing: sustitución de anclas de acceso por rutas de Nuxt.
- `packages/ui`: solo primitivas de formulario reutilizables que falten; la lógica de autenticación permanece en `apps/web`.
- Dependencias: cliente `better-auth` en la aplicación web, lockfile y herramientas de prueba mínimas si las actuales no permiten probar los flujos.
- Configuración: conservar `NUXT_PUBLIC_API_BASE`; no introducir secretos de OAuth ni código de servidor de Better Auth en la web.
- `apps/api`: sin cambios de implementación. La futura API deberá satisfacer el contrato documentado para que las operaciones se completen de extremo a extremo.
- Despliegue: preservar la generación estática actual y documentar acceso directo a las rutas y fallback del hosting.
