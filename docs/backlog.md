# Backlog técnico: backend y frontend

**Fuentes:** `historias-de-usuario.md` (v1, referente Riservafy) y `historias-de-usuario-2.md` (v2, base principal).
**Criterio:** v2 manda en alcance y fases. De v1 se toman solo lo que v2 no cubre o lo que lo completa (marcado `v1`).
**Tamaño:** estimación relativa (S ≈ 1–2 días, M ≈ 3–5, L ≈ 1–2 semanas) para una persona. Sirve para ordenar, no para comprometer fechas.

## 1. Análisis de las dos versiones

### Qué cubre cada una

| Tema | v1 (Riservafy) | v2 | Decisión para el backlog |
| --- | --- | --- | --- |
| Alcance | 30 historias, sin fases, sin super admin | ~110 historias en 4 actores, con fases MVP/F2/F3 | v2 como base |
| Plataforma (super admin) | No existe | SA-01 a SA-21 | v2 |
| Modelo por vertical | Solo "tipo de negocio" | Plantillas, módulos, terminología, campos | v2 |
| Planes y precios | Free / Starter $15 / Team $34 / Pro $69, asientos extra $7/$6 | Pregunta abierta | Usar v1 como propuesta inicial de SA-07 |
| Créditos de mensajería | SMS por plan (200/600/1200), **no se acumulan**, Unicode consume más | WhatsApp principal, créditos extra (SA-12) | Créditos por canal; adoptar regla de no acumulación de v1 |
| Comisión por cobro | 2 % / 1 % / 0,5 % / 0 %, tope $5 | No existe; el dinero va a la cuenta del negocio (NA-37) | **Conflicto**, ver 1.2 |
| Marketplace de productos | HU-26e | No existe | Fuera del backlog hasta decidir |
| Cookies, legales, soporte | HU-19, HU-27, HU-28 | Solo LOPDP en no funcionales | Agregar al MVP (barato y exigible por LOPDP) |
| App móvil | Apps nativas (observado) | PWA (pregunta abierta) | PWA en MVP |
| Reportes | HU-23 sin fase | NA-48 en F2 | F2 |

### Conflictos que bloquean diseño

1. **Comisión de plataforma vs. pasarela del negocio.** v1 cobra comisión por pago; v2 (NA-37) conecta la pasarela propia del negocio. Con pasarela propia la plataforma no puede retener comisión salvo que la pasarela soporte split (marketplace). Decidir antes de F2: o split payments, o sin comisión y monetizar solo por suscripción.
2. **Límite de reservas en plan gratis.** v1 dice "hasta 20 citas/mes"; la regla 7 de v2 dice que nunca se corta una reserva sin aviso. Definir si al llegar a 20 se aceptan y se avisa, o se bloquean.
3. **Sedes.** NA-11 (varias sedes) es F2, pero NA-19 (filtro por sede) y la regla 1 (horario de sede) son MVP. El modelo de datos debe tener `sede` desde el día uno, aunque el MVP solo permita una.

### Huecos en ambas versiones (necesarios para el MVP)

- Verificación de email y recuperación de contraseña.
- Almacenamiento de archivos (logo, portada, fotos de servicio y de profesional).
- Entrada de WhatsApp (webhook) para CL-13 respuesta: no hay historia que defina qué hacer con mensajes no reconocidos.
- Estado "suspendido" del negocio en la página pública: diseño de la pantalla.
- Ambiente de pruebas por negocio: cómo prueba el dueño su link sin consumir créditos.

## 2. MVP: backend

Orden sugerido: de arriba abajo. Las dependencias marcan qué debe existir antes.

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| BE-01 | Modelo de datos multi-tenant: `tenant_id` en toda tabla, Row Level Security en PostgreSQL, tablas `tenant`, `sede` (una por negocio en MVP), pruebas que intentan leer otro tenant | HU-29, RNF multi-tenancy | — | L |
| BE-02 | Autenticación: email + contraseña, Google OAuth, verificación de email, recuperación de contraseña, tokens de invitación, 2FA (obligatorio para usuarios de plataforma) | NA-01, SA-05, SA-18, HU-01/02 | BE-01 | M |
| BE-03 | Autorización por rol: plataforma (super admin, soporte, finanzas) y negocio (owner, admin, recepción, profesional); visibilidad por campo (recepción no ve ingresos; soporte no ve datos de pago) | NA-13, SA-18, PR-01, PR-04 | BE-02 | M |
| BE-04 | Planes y límites: definición versionada, snapshot del plan en la suscripción, contadores de uso (profesionales, reservas/mes, créditos), validación en cada operación, avisos al 80 % y 100 % | SA-07, NA-51, regla 7 | BE-01 | M |
| BE-05 | Catálogo de módulos con feature flags por plan y por negocio; guard que rechaza endpoints de módulos inactivos; modo beta por negocio | SA-14 | BE-04 | S |
| BE-06 | Plantillas de vertical versionadas (terminología, servicios de ejemplo, campos, políticas, módulos, mensajes); aplicar al registrar; cambiar antes de la primera reserva. Seed: barbería y consultorio | SA-13 básico, NA-01 | BE-05 | M |
| BE-07 | Trial y plan gratis: job de vencimiento, paso a gratis o bloqueo según configuración, avisos a 7, 3 y 1 días | SA-08 | BE-04, BE-17 | S |
| BE-08 | API de consola: lista de negocios con filtros, búsqueda y paginación; detalle con uso frente a límites e historial; suspender/reactivar con motivo (página pública "no disponible", panel en solo lectura); alta asistida con invitación al owner | SA-01, SA-02, SA-03, SA-05 | BE-03, BE-04 | M |
| BE-09 | Configuración del negocio: datos de contacto, dirección y coordenadas, zona horaria, moneda, idioma, formato de fecha (por defecto America/Guayaquil, USD, es), branding, slug único | NA-03, NA-04 básico, HU-04 | BE-01 | S |
| BE-10 | Almacenamiento de archivos (S3 compatible) con URLs firmadas, límites de tamaño y tipo | NA-04, NA-06, CL-02 | BE-01 | S |
| BE-11 | Estado del asistente de puesta en marcha (pasos completados, reanudar) y lista de pendientes | NA-02 | BE-09, BE-12, BE-13 | S |
| BE-12 | Servicios: nombre, descripción, foto, categoría, duración, precio (fijo, desde, gratis), buffers antes/después, oculto; asignación de profesionales | NA-06, NA-07 asignación | BE-01 | M |
| BE-13 | Equipo: invitar con rol, aceptar, desactivar; respeta límite del plan | NA-13 | BE-03, BE-04 | S |
| BE-14 | Horarios: horario de sede, horario semanal por profesional con varios bloques por día (nunca fuera del de la sede), excepciones, feriados de Ecuador precargados y editables, detección de citas en conflicto al crear una excepción | NA-14, NA-15 | BE-12, BE-13 | M |
| BE-15 | Bloqueos de tiempo con recurrencia (RRULE) | NA-22 | BE-14 | S |
| BE-16 | Reglas de reserva: anticipación mínima, máximo a futuro, intervalo de slot, máximo por día y por cliente; globales o por servicio (gana el servicio) | NA-16 | BE-12 | S |
| BE-17 | **Motor de disponibilidad**: regla 1 completa (horarios, excepciones, bloqueos, citas con buffers, reglas); "cualquier profesional" con asignación por menor carga o prioridad; UTC en BD, hora local en reglas; < 300 ms p95 por mes y profesional; suite de pruebas de tiempo (DST, cambio de día, zonas distintas) | NA-18, CL-03, reglas 1 y 4 | BE-14, BE-15, BE-16 | L |
| BE-18 | **Creación atómica de cita**: restricción de exclusión `tstzrange` por profesional; ante conflicto devuelve "ese horario acaba de ocuparse" + alternativas cercanas; origen público (invitado) e interno (manual, con permiso para saltar reglas) | regla 2, CL-04, NA-20 | BE-17 | M |
| BE-19 | Máquina de estados de la cita (pendiente → confirmada → llegó → en curso → completada; cancelada / no asistió), historial con quién, cuándo y por qué, contador de no-shows, eventos de dominio que disparan notificaciones | regla 5, NA-23, PR-03 | BE-18 | M |
| BE-20 | Mover, reprogramar o cambiar de profesional con validación de conflictos y bandera "notificar al cliente" | NA-21 | BE-18 | S |
| BE-21 | Política de cancelación (ventana en horas) con snapshot en la cita y registro de aceptación del cliente | NA-39 ventana, CL-06, regla 6 | BE-18 | S |
| BE-22 | Links de gestión firmados, únicos por cita y con vencimiento: reprogramar o cancelar respetando la ventana | CL-14 | BE-20, BE-21 | S |
| BE-23 | Clientes (mini-CRM): alta automática en la primera reserva, deduplicación por teléfono E.164 o email normalizado, historial, gasto total, no-shows, notas, etiquetas | NA-26, PR-04 | BE-18 | M |
| BE-24 | Preguntas del formulario por servicio (texto, lista, sí/no; obligatorias) y respuestas guardadas en la cita (JSONB con definición validada) | NA-32 básico, CL-05 | BE-12 | S |
| BE-25 | API pública de reservas: info del negocio, servicios, profesionales, slots, crear cita; caché, rate limiting, respuesta de negocio suspendido | CL-01 a CL-04, SA-03 | BE-17, BE-18 | M |
| BE-26 | Verificación OTP por WhatsApp o SMS cuando el negocio la exige; rate limiting por teléfono e IP | CL-04, RNF seguridad | BE-27 | S |
| BE-27 | **Infraestructura de notificaciones**: cola con reintentos e idempotencia, registro de entrega por mensaje, canales email y WhatsApp, consumo de créditos, caída a email con saldo cero | RNF notificaciones, NA-34 | BE-28 | L |
| BE-28 | Proveedores globales (email, WhatsApp Business API, SMS, almacenamiento): credenciales cifradas, ruta alternativa si falla uno, prueba de envío | SA-17 | BE-03 | M |
| BE-29 | Plantillas de mensaje con variables ({cliente}, {servicio}, {fecha}, {hora}, {profesional}, {link_gestion}); defaults es/en de plataforma; override por negocio; restaurar default | SA-15, NA-33 | BE-27 | S |
| BE-30 | Programador de recordatorios (por ejemplo 24 h y 2 h antes), configurable por negocio; se reprograma o cancela si la cita cambia | NA-34, CL-13 link | BE-19, BE-27 | M |
| BE-31 | Confirmación al cliente con dirección, mapa, archivo .ics y links a Google y Outlook | CL-12 | BE-27 | S |
| BE-32 | Avisos internos (nueva reserva, cancelación, reprogramación) a admin y profesional, por email, push o WhatsApp según preferencia de cada persona; web push (VAPID) para la PWA | NA-35, PR-02 | BE-27 | M |
| BE-33 | Tiempo real en agenda (SSE o WebSocket por tenant) | NA-19, PR-03 | BE-19 | S |
| BE-34 | Consentimientos del cliente: recordatorios (necesario) y marketing (opcional), con fecha y origen | CL-20 consentimiento | BE-23 | S |
| BE-35 | Auditoría mínima: acciones de consola (suspender, alta asistida) con motivo, e historial de citas. El log global inmutable queda en F2 | SA-03, NA-23 | BE-01 | S |
| BE-36 | Operación: logs estructurados con `tenant_id`, métricas, trazas, alertas por errores de envío; backups diarios con prueba de restauración | RNF observabilidad y respaldo | — | M |

## 3. MVP: frontend

Cuatro superficies: **página pública** (cliente), **panel del negocio**, **PWA del profesional** (mismo panel, vista reducida) y **consola de plataforma**.

### Base

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| FE-01 | Base: sistema de diseño, layout del panel, i18n (es por defecto, en preparado), formato de fecha, hora y moneda por locale, accesibilidad base | RNF i18n | — | M |
| FE-02 | Pantallas de acceso: registro (email o Google) con elección de vertical, login, verificación de email, recuperación de contraseña, aceptar invitación, 2FA | NA-01, SA-18, HU-01/02 | BE-02 | M |
| FE-03 | UI condicionada por rol, módulo y plan (oculta lo que el rol o el plan no permite) | NA-13, SA-14 | BE-03, BE-05 | S |

### Página pública (cliente)

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| FE-04 | Página del negocio: logo, portada, colores, descripción, dirección, mapa, horario con estado de hoy, servicios por categoría, buscador si hay más de 10; SSR o estática para < 2 s en 4G; pantalla de "no disponible" si está suspendido | CL-01, HU-13, NA-04 | BE-25 | M |
| FE-05 | Flujo de reserva: elegir profesional o "cualquiera" (foto y nombre), calendario con días sin cupo deshabilitados, botón "primer horario disponible", aviso de zona horaria distinta | CL-02, CL-03 | FE-04 | M |
| FE-06 | Datos del invitado: nombre, teléfono con código de país (+593 por defecto), email opcional, OTP si aplica; preguntas del servicio con avance guardado en el navegador | CL-04, CL-05 | BE-24, BE-26 | M |
| FE-07 | Resumen y confirmación: servicio, duración, precio, profesional, política de cancelación con casilla, consentimientos; manejo de "ese horario acaba de ocuparse" con alternativas | CL-06, HU-17, CL-20, regla 2 | BE-18, BE-21 | S |
| FE-08 | Página de confirmación con "agregar a mi calendario" (.ics, Google, Outlook) | CL-12 | BE-31 | S |
| FE-09 | Página de gestión por link firmado: reprogramar o cancelar; fuera de la ventana muestra el contacto del negocio | CL-14 | BE-22 | S |
| FE-10 | Banner de cookies (aceptar o rechazar analíticas) y páginas de términos, privacidad y soporte `v1` | HU-19, HU-27, HU-28 | — | S |

### Panel del negocio

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| FE-11 | Asistente de 4 pasos (datos, horario, primer servicio, primer profesional), reanudable, y lista de pendientes | NA-02 | BE-11 | M |
| FE-12 | Ajustes del negocio: datos, zona horaria, moneda, idioma; personalización de la página con vista previa en vivo | NA-03, NA-04 básico | BE-09, BE-10 | M |
| FE-13 | Servicios: CRUD con foto, categoría, precio, buffers, oculto; asignación de profesionales | NA-06, NA-07 | BE-12 | M |
| FE-14 | Equipo: invitar con rol, lista, desactivar, uso frente al límite del plan | NA-13 | BE-13 | S |
| FE-15 | Horarios: editor semanal con varios bloques por día, excepciones y feriados; aviso de citas en conflicto con opción de reprogramarlas | NA-14, NA-15 | BE-14 | M |
| FE-16 | Reglas de reserva (globales y por servicio) y política de cancelación | NA-16, NA-39 | BE-16, BE-21 | S |
| FE-17 | **Agenda**: día, semana y mes; columnas por profesional; colores por estado o servicio; filtro por sede; tiempo real; arrastrar para mover o cambiar de profesional con diálogo de conflicto y "¿notificar al cliente?"; bloqueos (con repetición) | NA-19, NA-21, NA-22 | BE-20, BE-33 | L |
| FE-18 | Detalle de cita: cambio de estado, historial de cambios, respuestas del formulario, acceso a la ficha | NA-23 | BE-19 | S |
| FE-19 | Cita manual: buscar o crear cliente al vuelo, saltar reglas con permiso | NA-20 | BE-18, BE-23 | M |
| FE-20 | Clientes: lista con búsqueda, ficha con historial, gasto, no-shows, notas y etiquetas | NA-26 | BE-23 | M |
| FE-21 | Constructor básico de preguntas por servicio | NA-32 básico | BE-24 | S |
| FE-22 | Mensajes: editor de plantillas con variables, vista previa por canal, restaurar default; canales y horarios de recordatorio; preferencias de avisos internos por persona | NA-33, NA-34, NA-35 | BE-29, BE-30, BE-32 | M |
| FE-23 | Compartir: link, QR descargable en PNG y PDF, links directos a servicio o profesional, botones para Instagram y WhatsApp | NA-44 | BE-09 | S |
| FE-24 | Mi suscripción: plan actual y barras de uso por límite con avisos al 80 % y 100 % | NA-51 | BE-04 | S |

### PWA del profesional

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| FE-25 | PWA instalable: mi agenda de hoy y de la semana, próximo cliente, cambio de estado con un toque, ficha del cliente de solo lectura según rol, activar notificaciones push | PR-01 a PR-04 | BE-32, BE-33 | M |

### Consola de plataforma

| ID | Ítem | Historias | Depende de | Tam. |
| --- | --- | --- | --- | --- |
| FE-26 | Negocios: lista con filtros, búsqueda y paginación; detalle con uso y suscripción; suspender o reactivar con motivo; alta asistida | SA-01, SA-02, SA-03, SA-05 | BE-08 | M |
| FE-27 | Planes y módulos: editor de planes con límites; flags por plan y por negocio | SA-07, SA-14 | BE-04, BE-05 | M |
| FE-28 | Editor básico de plantillas de vertical con vista previa de la página de reservas; mensajes por defecto es/en | SA-13 básico, SA-15 | BE-06, BE-29 | M |
| FE-29 | Proveedores globales con prueba de envío; usuarios internos y roles | SA-17, SA-18 | BE-28, BE-03 | S |

## 4. F2: cobrar y operar como negocio mediano

| Épica | Historias | Backend | Frontend |
| --- | --- | --- | --- |
| Pagos del negocio | NA-37, NA-38, NA-39 dinero, NA-40, CL-07 | Conexión a pasarela (Payphone, Kushki, Datafast, Deuna), estado "retenida" con vencimiento de 10 min y job de liberación (regla 3), webhooks de pago, estados de pago, reembolsos, propinas. **Resolver antes el conflicto 1.2.1** | Conectar pasarela, configuración de depósito por servicio, paso de pago en la reserva, registro de pago en el local |
| Facturación SRI | NA-41, SA-10 | Integración por API con la plataforma de facturación, datos fiscales, consumidor final | Datos fiscales del negocio y del cliente, emitir desde la cita |
| Suscripción automática | SA-09, SA-12, NA-52 | Cobro recurrente, reintentos, estado "moroso", prorrateo, venta de créditos de mensajería | Cambiar plan y tarjeta, facturas, comprar créditos |
| Servicios avanzados | NA-07 variantes, NA-08, NA-12, NA-54, CL-08 | Precio y duración por profesional, add-ons en el cálculo de duración, links de Meet o Zoom, servicios privados o con contraseña, búsqueda de horarios contiguos | Editor de variantes y add-ons, selección de add-ons en la reserva, botón "Unirse" (PR-10) |
| Recursos y sedes | NA-10, NA-11 | Recursos en el motor de disponibilidad (profesional Y recurso libres), varias sedes | CRUD de recursos, columnas por recurso en la agenda, selector de sede en la página pública |
| Clases y lista de espera | NA-09, NA-25, CL-09, CL-15 | Capacidad por slot, cupos restantes, lista de espera con ventana de confirmación | Cupos en la reserva, inscribirse a lista de espera, gestión en el panel |
| Agenda avanzada | NA-17, NA-24, CL-22 | Aprobación manual con retención y expiración, series recurrentes con detección de conflictos, reserva múltiple parcial | Bandeja de pendientes, crear y editar series, selección de varios slots |
| Clientes avanzado | NA-27, NA-29, NA-30, NA-31, CL-10 | Campos personalizados (JSONB validado), importación CSV/Excel con reporte de errores, fusión, bloqueo o depósito por no-shows, "¿para quién es?" | Editor de campos, asistente de importación con mapeo, fusión, campo en la reserva |
| Fichas privadas (salud) | NA-28, PR-05 | Cifrado en reposo, acceso por rol auditado, fotos con consentimiento. **Pendiente decidir si entra (pregunta abierta)** | Notas de sesión y fotos en la PWA |
| Formularios avanzados | NA-32 archivos y firma, NA-53, NA-56, CL-05 archivos | Archivos y firma, lógica condicional, instrucciones previas y recordatorio de formulario pendiente | Preguntas condicionales, subida de archivos, firma |
| Comunicación avanzada | NA-36, CL-13 respuesta | Seguimiento tras la cita, webhook de entrada de WhatsApp (1 confirma, 2 cancela, botones) | Configuración de seguimientos |
| Calendarios externos | NA-46, PR-08 | Sincronización en dos vías con Google y Outlook; eventos externos bloquean slots | Conectar calendario (admin y profesional) |
| Profesional | PR-06, PR-07, PR-10 | Solicitud de bloqueo o día libre con aprobación, cita de seguimiento sugerida | Pedir día libre, agendar seguimiento, unirse a videollamada |
| Canales | NA-45 | Widget embebible (script), plugin de WordPress | Modo inline y botón flotante |
| Reportes | NA-48, HU-23 | Consultas de ocupación, ingresos, no-shows, servicios, clientes nuevos y recurrentes, rendimiento por profesional; exportar CSV | Tablero con filtros por fecha, sede y profesional |
| Cuenta del cliente | CL-11, CL-17, CL-18, CL-20 autoservicio, CL-21 | Login por código (sin contraseña) por negocio, repetir reserva, exportar o borrar datos | Idioma automático con selector, "mis citas", repetir, WCAG 2.1 AA en el flujo |
| Terminología | NA-05 | Diccionario por tenant aplicado a mensajes | Etiquetas dinámicas en panel y página pública |
| Plataforma | SA-04, SA-06, SA-13 completo, SA-16, SA-19, SA-21 | Impersonación con motivo y tiempo límite, exportación y borrado con 30 días de gracia, log de auditoría inmutable, métricas MRR, salud de colas y reintento manual | Banner de impersonación, log de accesos de soporte visible para el negocio, tablero de métricas y de salud, editor completo de plantillas |

## 5. F3: fidelizar y abrir la plataforma

| Épica | Historias | Backend | Frontend |
| --- | --- | --- | --- |
| Paquetes y membresías | NA-42, CL-19 | Saldos, consumo al reservar, avisos de vencimiento | Venta, saldo en la cuenta y en la confirmación |
| Cupones y gift cards | NA-43, SA-11 | Códigos con vigencia, límite de usos y alcance | Gestión y campo en la reserva |
| Reseñas | NA-50, CL-16 | Solo con cita completada, respuesta del dueño, sin borrado | Formulario de reseña, mostrar en la página pública |
| Comisiones del equipo | NA-49, PR-09 | Cálculo por porcentaje y periodo | Reporte del dueño y vista del profesional |
| API y webhooks | NA-47 | Tokens de API, eventos de dominio con firma HMAC y reintentos | Gestión de tokens y suscripciones a webhooks |
| Marca y medición | NA-04 dominio propio, NA-55 | Dominio propio con TLS, redirección tras reservar, eventos al pixel respetando cookies | Configuración de dominio, pixel y redirección |
| Citas colectivas | NA-57 | Disponibilidad con varios profesionales requeridos | Configuración del servicio y vista en la agenda de cada uno |
| Migración | NA-58 | Importar desde Calendly, Koalendar y Google Calendar sin reenviar confirmaciones | Asistente de importación con vista previa |
| Anuncios | SA-20 | Segmentación por plan o vertical, programación | Editor en consola y aviso en el panel |
| Marketplace `v1` | HU-26e | Por decidir | Por decidir |

## 6. Decisiones pendientes que afectan el backlog

- [ ] Comisión por cobro (v1) frente a pasarela propia del negocio (v2). Bloquea el diseño de pagos de F2.
- [ ] Precios y límites de los planes: ¿se adopta la propuesta de v1 (Free, Starter, Team, Pro con cobro por asiento)?
- [ ] Qué pasa al llegar al límite de reservas del plan gratis (regla 7). Bloquea BE-04.
- [ ] Proveedor de WhatsApp Business API. Bloquea BE-27 y el costo de los créditos.
- [ ] Fichas clínicas en F2 o fuera. Define si hace falta cifrado de campos desde el MVP.
- [ ] Marketplace de productos (v1): ¿entra al producto?
