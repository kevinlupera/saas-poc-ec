# Tasks

## 1. Cliente de identidad y frontera de integración

- [x] 1.1 Seleccionar una versión estable compatible de `better-auth`, añadirla a `@saas/web` y actualizar el lockfile; verificar instalación, tipos de los métodos del diseño y ausencia de imports de servidor en el cliente web.
- [x] 1.2 Crear el plugin de cliente y el acceso fino al cliente de identidad desde `runtimeConfig.public.apiBase`, con prefijo `/api/auth` y cookies; verificar con pruebas que dos bases configuradas dirigen las solicitudes al destino correcto sin duplicar el prefijo y que no se hacen llamadas durante prerender.
- [x] 1.3 Incorporar las utilidades mínimas de mensajes seguros, validación y destinos de retorno fijos; verificar pruebas de errores desconocidos, email sin verificar identificado por código, destinos externos/relativos al protocolo y exclusión de credenciales o tokens de logs y storage.
- [x] 1.4 Configurar el soporte mínimo de pruebas de navegador con interceptación HTTP y fixtures del protocolo de la versión instalada; verificar un caso exitoso y otro de API no disponible sin introducir un modo mock de producción.
- [x] 1.5 Documentar en `apps/web/README.md` configuración pública, versión/protocolo, endpoints del cliente y prerrequisitos externos de backend; verificar que distingue API base, callback Google en la API, retorno web, cookies/CORS/trustedOrigins y secretos exclusivamente de servidor.

## 2. Base visual y navegación de autenticación

- [x] 2.1 Incorporar solo las primitivas de formulario necesarias que falten en `@saas/ui`, respetando shadcn-vue y tokens existentes; verificar tipos, labels asociados y estados de foco/error en ambos temas sin mover lógica de identidad al paquete UI.
- [x] 2.2 Crear layout y componentes locales de autenticación, integrar `NuxtLayout` si corresponde y reutilizar el cambio de tema; verificar con pruebas de navegador navegación por teclado, ancho de 320 px, escritorio, modo oscuro y conservación de la landing.
- [x] 2.3 Crear las seis rutas descritas en el diseño y conectar todos los accesos de login/registro de la landing mediante navegación de Nuxt; verificar enlaces de escritorio/móvil, CTA de hero/precios/cierre que correspondan y acceso directo sin anclas vacías.

## 3. Sesión, login y registro con email

- [x] 3.1 Implementar resolución reactiva de sesión y `/auth/complete` con estados cargando, autenticado, anónimo y error; verificar pruebas para cada estado y que ningún parámetro de URL habilita identidad sin respuesta válida de la API.
- [x] 3.2 Implementar login con email/contraseña, mostrar/ocultar contraseña, bloqueo de duplicados y errores recuperables; verificar pruebas de validación sin solicitud, credenciales rechazadas, código de verificación requerida, `403` no relacionado, API ausente y éxito seguido de sesión confirmada.
- [x] 3.3 Implementar registro con nombre/email/contraseña/confirmación y la política de contraseña alineada al cliente/backend documentados; verificar pruebas de campos inválidos, contraseñas distintas, rechazo de API y registro aceptado tanto con sesión como sin ella, sin revelar existencia de cuenta ni crear negocio.
- [x] 3.4 Implementar cierre de sesión desde el retorno mínimo y sincronización de identidad; verificar pruebas de éxito que elimina datos visibles y fallo que no finge invalidación, además de consulta de sesión al recargar la pantalla.
- [x] 3.5 Documentar los estados de registro/sesión y cómo ejecutar las pruebas de este grupo en el README de la web; verificar que los comandos documentados funcionan con red interceptada y que la UI no depende de almacenamiento local de credenciales.

## 4. Acceso y registro mediante Google

- [x] 4.1 Añadir continuar con Google a login y registro usando el mismo `signIn.social`, callbacks propios y estados pendientes; verificar solicitudes HTTP del cliente y destinos correctos, sin secretos ni contraseñas del formulario en los parámetros del proveedor.
- [x] 4.2 Resolver retorno exitoso, error al iniciar, cancelación/error del proveedor y retorno sin sesión; verificar pruebas de navegador con respuestas interceptadas que exigen sesión confirmada, muestran mensajes seguros y permiten reintentar o usar email sin quedar bloqueados.
- [x] 4.3 Completar la checklist Google en el README con callback local de la API `http://localhost:3001/api/auth/callback/google`, retorno web `/auth/complete` y responsables del backend/proveedor; verificar que no se presenta el flujo interceptado como validación OAuth real ni se pide exponer secretos en configuración pública.

## 5. Recuperación, restablecimiento y verificación de email

- [x] 5.1 Implementar recuperación por email con `requestPasswordReset` y `redirectTo` a la ruta de restablecimiento; verificar pruebas de email inválido, solicitud aceptada con confirmación genérica, duplicados y fallo de servicio sin falso éxito ni promesa de entrega.
- [x] 5.2 Implementar nueva contraseña y confirmación con `resetPassword`, manejo seguro del token y política de referrer de pantallas sensibles; verificar pruebas de éxito, token ausente/vencido/rechazado, contraseñas distintas, token no persistido/registrado y regreso al login sin asumir sesión.
- [x] 5.3 Implementar instrucciones de verificación y reenvío con `sendVerificationEmail`, email editable y confirmación genérica; verificar pruebas de reenvío aceptado, fallo de red, error de enlace y navegación al login.
- [x] 5.4 Manejar el retorno del enlace de verificación sin confiar en indicadores de query para probar identidad o email verificado; verificar pruebas de query manipulada, sesión con estado confirmado por API y retorno sin sesión que ofrece continuar al acceso.
- [x] 5.5 Documentar contratos de enlaces, política de contraseña, privacidad de mensajes y handlers de email pendientes en el backend; verificar correspondencia entre rutas documentadas, opciones del cliente y casos de prueba de recuperación/verificación.

## 6. Verificación transversal y entrega del frontend

- [x] 6.1 Ejecutar `pnpm check`, `pnpm --filter @saas/web test:theme` y las pruebas nuevas de autenticación; verificar resultados correctos y registrar comandos y cualquier limitación real sin marcar como ejecutadas pruebas omitidas.
- [x] 6.2 Ejecutar `pnpm --filter @saas/web build` sin API de autenticación disponible y servir el resultado estático; verificar en navegador recarga directa de las seis rutas, queries de retorno/token, ausencia de consultas de sesión durante build y errores recuperables durante uso sin backend.
- [x] 6.3 Recorrer en navegador landing, login/registro con email y Google, recuperación, restablecimiento, verificación y salida, con API interceptada; verificar foco, anuncios de error, pegado/autocompletado, 320 px, escritorio y temas, y documentar la configuración de fallback/rutas que necesita el hosting.
- [x] 6.4 Revisar diff y bundle para confirmar que no hay cambios de implementación en `apps/api`, secretos, servidor mock de producción, credenciales persistidas, dashboard u onboarding fuera de alcance; verificar que el README entrega una checklist separada de integración real pendiente para cookies, Google y emails.

## 7. Páginas públicas autorizadas para resolver el build

- [x] 7.1 Crear `/terms`, `/privacy` y `/support` con diseño compartido, borradores legales explícitos y ayuda de acceso sin contactos inventados; documentar revisión legal pendiente y verificar en navegador enlaces del footer, acceso directo, temas y 320 px, y build completo sin exclusiones de prerender.

## 8. Correcciones de la verificación

- [x] 8.1 Priorizar el error de enlace de verificación inválido/vencido frente a una sesión ya verificada y mantener el reenvío disponible; verificar la regresión para sesiones anónimas y verificadas, errores inválidos/vencidos y retorno válido sin error.
- [x] 8.2 Añadir pruebas persistentes de envío con Enter y acceso con teclado, además de nombre vacío, email inválido y contraseñas vacías, cortas o largas en registro; verificar que los datos inválidos no envían solicitudes y enfocan el primer campo inválido, y ejecutar la suite de navegador y typecheck.

## Workflow follow-up

- Cuando exista el backend, ejecutar la checklist real de integración del README para email/contraseña, sesión/cookies, Google y enlaces de email; no es requisito completarlo con un backend simulado para cerrar este cambio de frontend.
- Verificar el cambio implementado con OpenSpec antes de archivarlo y dejar explícitas las comprobaciones externas que sigan pendientes.
