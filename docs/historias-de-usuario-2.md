# Historias de usuario — SaaS de agendamiento de citas

## Índice

1. [Visión, actores y glosario](#1-visión-actores-y-glosario)
2. [Modelo configurable por tipo de negocio](#2-modelo-configurable-por-tipo-de-negocio)
3. [Administrador de la plataforma (super admin)](#3-administrador-de-la-plataforma-super-admin)
4. [Panel admin del negocio](#4-panel-admin-del-negocio-owner-y-administrador)
5. [Profesional (staff)](#5-profesional-staff)
6. [Cliente final](#6-cliente-final-quien-reserva)
7. [Reglas de negocio y requisitos no funcionales](#7-reglas-de-negocio-y-requisitos-no-funcionales)
8. [Priorización por fases y preguntas abiertas](#8-priorización-por-fases-y-preguntas-abiertas)
9. [Referencia: Koalendar en clínicas, spas y barberías](#9-referencia-koalendar-en-clínicas-spas-y-barberías)

## 1. Visión, actores y glosario

Un SaaS multi-tenant donde cada negocio (barbería, consultorio, spa, estudio de clases, consultor) publica su página de reservas en menos de 10 minutos. Todo se construye sobre un núcleo genérico: servicios, profesionales, recursos y reglas. Lo que cambia entre tipos de negocio es **configuración**, no código. Al registrarse, el negocio elige una plantilla de vertical que precarga terminología, campos y políticas. Después puede ajustar todo.

Cada historia lleva un ID (SA = super admin, NA = negocio admin, PR = profesional, CL = cliente), su criterio de aceptación y la fase en que entra (MVP, F2, F3; ver sección 8).

### Actores

| Actor | Quién es | Dónde trabaja |
| --- | --- | --- |
| Super admin | Tú y tu equipo, dueños de la plataforma | Consola de plataforma |
| Soporte de plataforma | Agente interno con permisos limitados | Consola de plataforma |
| Dueño del negocio (owner) | Quien contrata y paga la suscripción | Panel del negocio |
| Administrador / recepción | Gestiona agenda, clientes y cobros del negocio | Panel del negocio |
| Profesional (staff) | Barbero, médico, terapeuta, instructor | Panel del negocio (vista reducida) y app móvil |
| Cliente final | Quien reserva, como invitado o con cuenta | Página pública de reservas, widget, links |

### Glosario

| Término | Definición |
| --- | --- |
| Tenant / negocio | Una cuenta cliente del SaaS, con sus datos aislados del resto |
| Sede | Ubicación física del negocio con horario propio; un negocio puede tener varias |
| Servicio | Lo que se reserva: duración, precio, buffers, quién lo presta y qué recursos usa |
| Profesional | Persona que presta servicios y tiene agenda propia |
| Recurso | Algo limitado que la cita ocupa: sala, silla, camilla, equipo |
| Modalidad | 1:1 (una cita, un cliente), grupal/clase (cupos), o solo recurso (alquiler de cancha, sala) |
| Plantilla de vertical | Paquete de configuración inicial por tipo de negocio |
| Módulo | Funcionalidad que se activa o desactiva por negocio y por plan (pagos, clases, fichas, lista de espera) |
| Campo personalizado | Dato extra en la ficha del cliente, del servicio o de la cita, definido por el negocio |
| Política | Regla de cancelación, depósito, no-show o aprobación |
| Slot | Horario disponible que se muestra al cliente, calculado en tiempo real |

## 2. Modelo configurable por tipo de negocio

La extensibilidad descansa en seis ejes de configuración. Una plantilla de vertical es solo un valor inicial para cada eje. Agregar un vertical nuevo (veterinaria, taller, coworking) consiste en crear una plantilla desde la consola, sin desplegar código.

| Eje configurable | Qué controla | Ejemplo |
| --- | --- | --- |
| Terminología | Etiquetas visibles: profesional, cliente, cita, servicio | "Barbero" y "Corte"; "Doctor", "Paciente" y "Consulta" |
| Módulos | Qué funciones existen para el negocio (limitado por su plan) | Clases grupales, fichas clínicas, depósitos, lista de espera, paquetes |
| Campos personalizados | Datos extra en cliente, servicio o cita: texto, número, fecha, lista, archivo, consentimiento | Alergias, seguro médico, placa del vehículo, nombre de la mascota |
| Modalidad de reserva | 1:1, grupal con cupos, o por recurso | Barbería 1:1; yoga grupal; cancha por recurso |
| Reglas y políticas | Anticipación, intervalos, buffers, aprobación manual, cancelación, depósito, no-show | Clínica: aprobación manual; spa: depósito del 30 % |
| Comunicación | Plantillas de mensajes, canales y tiempos de recordatorio | WhatsApp 24 h y 2 h antes |

### Plantillas iniciales sugeridas

| Vertical | Modalidad | Recursos | Campos típicos | Políticas por defecto | Módulos activos |
| --- | --- | --- | --- | --- | --- |
| Barbería / peluquería | 1:1, "cualquier barbero" permitido | Sillas (opcional) | Preferencias de corte, foto de referencia | Recordatorio 2 h; no-show tras 15 min | Agenda, clientes, walk-ins, lista de espera |
| Consultorio / clínica | 1:1, presencial o teleconsulta | Consultorios, equipos | Cédula, fecha de nacimiento, seguro, motivo de consulta, consentimiento | Aprobación manual opcional; cancelación con 24 h | Fichas privadas, formularios previos, videollamada |
| Spa / estética / uñas | 1:1 y paquetes | Cabinas, camillas | Tipo de piel, contraindicaciones | Depósito; cancelación con 24 h | Pagos, paquetes, add-ons |
| Estudio de clases (yoga, gym, baile) | Grupal con cupos | Salas | Nivel, contacto de emergencia | Cancelación con 12 h; lista de espera automática | Clases, membresías, lista de espera |
| Servicios profesionales (abogado, contador, coach) | 1:1, virtual o presencial | Ninguno | Empresa, tema a tratar | Pago previo opcional | Videollamada, formularios, pagos |

**Regla de diseño:** ninguna pantalla ni regla debe preguntar "¿es clínica?". Preguntan "¿tiene activo el módulo de fichas?" o "¿este servicio requiere recurso?". Así un vertical nuevo nunca obliga a tocar código.

## 3. Administrador de la plataforma (super admin)

El super admin gestiona negocios, planes, plantillas y la salud de la plataforma. Nunca toca la operación diaria de un negocio sin dejar rastro.

### Épica SA-A: Gestión de negocios (tenants)

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| SA-01 | Como super admin quiero ver la lista de negocios con plan, estado, vertical y fecha de alta, para saber quién usa la plataforma | Filtros por estado (trial, activo, moroso, suspendido), plan y vertical; búsqueda por nombre, slug o email del owner; paginación | MVP |
| SA-02 | Como super admin quiero ver el detalle de un negocio (uso, límites, staff, reservas del mes, pagos), para atender soporte | Muestra uso frente a límites del plan, último acceso e historial de suscripción | MVP |
| SA-03 | Como super admin quiero suspender o reactivar un negocio, para manejar impagos o abusos | Si está suspendido, la página pública muestra "no disponible" y el panel queda en solo lectura; los datos no se borran; queda en auditoría con motivo | MVP |
| SA-04 | Como soporte quiero entrar al panel de un negocio como si fuera su admin (impersonar), para reproducir problemas | Requiere motivo; sesión con banner visible y límite de tiempo; cada acción queda auditada con el usuario real; el negocio puede ver un log de accesos de soporte | F2 |
| SA-05 | Como super admin quiero crear un negocio manualmente (alta asistida), para clientes que vendí yo | Elijo plantilla y plan; el owner recibe invitación por email para poner su contraseña | MVP |
| SA-06 | Como super admin quiero exportar o eliminar todos los datos de un negocio, para cumplir la LOPDP y cerrar cuentas | Exporta en ZIP (JSON/CSV); el borrado definitivo tiene doble confirmación y 30 días de gracia | F2 |

### Épica SA-B: Planes, suscripciones y cobro

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| SA-07 | Como super admin quiero definir planes con precio y límites (profesionales, sedes, reservas al mes, créditos de WhatsApp/SMS, módulos incluidos), para monetizar por valor | Los límites se aplican en el backend, no solo en la interfaz; cambiar un plan no afecta a quien ya lo tiene salvo que lo migre explícitamente | MVP |
| SA-08 | Como super admin quiero ofrecer un plan gratis y un trial de N días, para captar negocios | Al vencer el trial el negocio pasa al plan gratis o queda bloqueado, según configuración; avisos a los 7, 3 y 1 días | MVP |
| SA-09 | Como super admin quiero cobrar la suscripción de forma recurrente con tarjeta, para no cobrar a mano | Integración con pasarela (Payphone, Kushki o Stripe según el mercado); reintentos de cobro; estado "moroso" tras X días | F2 |
| SA-10 | Como super admin quiero emitir la factura electrónica SRI de cada suscripción, para cumplir en Ecuador | Se genera al confirmarse el pago, con los datos fiscales del negocio; integración por API con la plataforma de facturación | F2 |
| SA-11 | Como super admin quiero crear cupones y descuentos, para campañas y aliados | Porcentaje o monto, vigencia, límite de usos, plan aplicable | F3 |
| SA-12 | Como super admin quiero vender créditos extra de mensajería, para cubrir el costo de WhatsApp y SMS | El saldo se descuenta por mensaje enviado; se avisa al negocio con saldo bajo; con saldo cero el canal cae a email | F2 |

### Épica SA-C: Plantillas de vertical y módulos

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| SA-13 | Como super admin quiero crear y editar plantillas de vertical (terminología, servicios de ejemplo, campos, políticas, módulos, textos de mensajes), para lanzar nuevos tipos de negocio sin programar | La plantilla se versiona; publicar una versión nueva no cambia a los negocios ya creados; vista previa de la página de reservas resultante | MVP (editor básico) / F2 (editor completo) |
| SA-14 | Como super admin quiero un catálogo de módulos con feature flags por plan y por negocio, para activar funciones gradualmente | Un módulo desactivado oculta su interfaz y rechaza sus endpoints; se puede activar como beta para negocios concretos | MVP |
| SA-15 | Como super admin quiero definir los mensajes por defecto en español e inglés, para que el negocio arranque con buenos textos | Variables disponibles: {cliente}, {servicio}, {fecha}, {hora}, {profesional}, {link\_gestion} | MVP |

### Épica SA-D: Operación, métricas y seguridad

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| SA-16 | Como super admin quiero un tablero con MRR, negocios activos, altas, bajas, reservas totales y mensajes enviados, para seguir el negocio | Rangos de fechas y comparación con el periodo anterior; desglose por plan y vertical | F2 |
| SA-17 | Como super admin quiero configurar los proveedores globales (email, WhatsApp Business API, SMS, almacenamiento), para no repetirlo por negocio | Credenciales cifradas; ruta alternativa si un proveedor falla; prueba de envío | MVP |
| SA-18 | Como super admin quiero gestionar usuarios internos con roles (super admin, soporte, finanzas), para limitar accesos | 2FA obligatorio; soporte no ve datos de pago completos | MVP |
| SA-19 | Como super admin quiero un log de auditoría global (quién hizo qué, cuándo, en qué negocio), para investigar incidentes | Inmutable; filtrable por negocio, usuario y acción; retención mínima de 12 meses | F2 |
| SA-20 | Como super admin quiero publicar anuncios dentro del panel de los negocios (novedades, mantenimientos), para comunicarme sin email | Segmentación por plan o vertical; programables; se pueden cerrar | F3 |
| SA-21 | Como super admin quiero ver salud técnica (cola de notificaciones, errores de envío, webhooks fallidos), para actuar antes que el cliente | Alertas por umbral; reintento manual de mensajes fallidos | F2 |

## 4. Panel admin del negocio (owner y administrador)

Este panel es el corazón del producto. Un negocio nuevo debe llegar de cero a su primera reserva real sin ayuda. "Admin" incluye al owner y a recepción; las diferencias de permisos están en NA-13.

### Épica NA-A: Registro y puesta en marcha

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-01 | Como dueño quiero registrarme con email o Google y elegir mi tipo de negocio, para empezar con una configuración que ya tenga sentido | La plantilla elegida precarga terminología, servicios de ejemplo, campos y políticas; se puede cambiar de plantilla antes de la primera reserva | MVP |
| NA-02 | Como dueño quiero un asistente de 4 pasos (datos del negocio, horario, primer servicio, primer profesional), para publicar rápido | Al terminar tengo un link público funcionando; el asistente se puede retomar donde lo dejé; una lista de pendientes muestra lo que falta configurar | MVP |
| NA-03 | Como dueño quiero configurar zona horaria, moneda, idioma y formato de fecha, para que todo se muestre bien | Por defecto: America/Guayaquil, USD, español | MVP |
| NA-04 | Como dueño quiero personalizar mi página con logo, portada, colores, descripción, dirección, mapa y redes, para que se vea como mi marca | Vista previa en vivo; URL tipo midominio.com/mi-negocio; quitar la marca de la plataforma y usar dominio propio según el plan | MVP (básico) / F3 (dominio propio) |
| NA-05 | Como dueño quiero cambiar la terminología (por ejemplo "Estilista" en vez de "Profesional"), para hablarle a mis clientes en su idioma | Se aplica en la página pública, los mensajes y el panel | F2 |

### Épica NA-B: Sedes, servicios y recursos

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-06 | Como admin quiero crear servicios con nombre, descripción, foto, categoría, duración, precio (fijo, desde o gratis) y buffers antes y después, para que el cálculo de horarios sea real | Los buffers ocupan agenda pero no se muestran al cliente; el servicio puede estar oculto (solo reserva interna) | MVP |
| NA-07 | Como admin quiero asignar qué profesionales hacen cada servicio, con precio o duración distintos por profesional, para reflejar seniority | Si no hay variante se usa el valor base; el cliente ve el precio del profesional elegido | MVP (asignación) / F2 (variantes) |
| NA-08 | Como admin quiero ofrecer add-ons (por ejemplo "barba +$5, +15 min"), para vender más en la misma cita | Suman duración y precio; el cálculo de disponibilidad usa la duración total | F2 |
| NA-09 | Como admin quiero marcar un servicio como grupal con capacidad máxima, para dar clases | El cliente ve los cupos restantes; al llenarse se ofrece lista de espera si el módulo está activo | F2 |
| NA-10 | Como admin quiero crear recursos (sala, camilla, silla, equipo) y exigirlos por servicio, para no tener dos citas en la misma sala | Un slot solo existe si hay profesional Y recurso libres; el recurso se asigna solo y se puede cambiar a mano | F2 |
| NA-11 | Como dueño quiero gestionar varias sedes con su dirección, horario, staff y servicios, para crecer | El cliente elige primero la sede; los reportes se filtran por sede | F2 |
| NA-12 | Como admin quiero marcar servicios como presenciales, virtuales o ambos, para ofrecer teleconsultas | Si es virtual se genera un link de Meet o Zoom y va en la confirmación | F2 |

### Épica NA-C: Equipo y disponibilidad

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-13 | Como dueño quiero invitar miembros del equipo con un rol (owner, admin, recepción, profesional), para delegar sin perder control | Recepción gestiona agenda y clientes pero no ve ingresos ni configuración; el profesional solo ve su agenda (sección 5); el número de profesionales respeta el límite del plan | MVP |
| NA-14 | Como admin quiero definir el horario semanal de cada profesional, con varios bloques por día, para reflejar turnos partidos | Por ejemplo 9:00–13:00 y 15:00–19:00; el horario del profesional nunca se sale del de la sede | MVP |
| NA-15 | Como admin quiero registrar excepciones (vacaciones, permisos, feriados, horario especial de un día), para que no se reserve cuando no hay nadie | Feriados de Ecuador precargados y editables; si hay citas en conflicto se avisa y se ofrece reprogramarlas | MVP |
| NA-16 | Como admin quiero configurar reglas de reserva (anticipación mínima, máximo de días a futuro, intervalo de slots, máximo de citas por día o por cliente), para controlar la agenda | Las reglas pueden ser globales o por servicio; la regla del servicio tiene prioridad | MVP |
| NA-17 | Como admin quiero exigir aprobación manual en ciertos servicios, para filtrar antes de confirmar | La cita queda "pendiente" y retiene el slot; si no se aprueba en X horas se libera y se avisa al cliente | F2 |
| NA-18 | Como admin quiero que el cliente pueda elegir "cualquier profesional disponible", para llenar huecos | Asignación por menor carga del día o por orden de prioridad configurable | MVP |

### Épica NA-D: Agenda y operación diaria

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-19 | Como recepción quiero ver la agenda por día, semana y mes, en columnas por profesional o recurso, para ver quién está libre | Colores por estado o por servicio; filtro por sede; se actualiza en tiempo real sin recargar | MVP |
| NA-20 | Como recepción quiero crear una cita manual (teléfono, walk-in) buscando o creando al cliente al vuelo, para registrar todo en un solo lugar | Puedo saltarme las reglas de anticipación con permiso; el cliente recibe la confirmación si tiene contacto | MVP |
| NA-21 | Como recepción quiero mover una cita arrastrándola o cambiar de profesional, para reprogramar rápido | Valida conflictos; pregunta si se notifica al cliente | MVP |
| NA-22 | Como admin quiero bloquear tiempo (almuerzo, reunión) en la agenda de un profesional, para que no se reserve | El bloqueo puede repetirse | MVP |
| NA-23 | Como recepción quiero cambiar el estado de la cita (pendiente, confirmada, llegó, en curso, completada, no asistió, cancelada), para llevar control real | Cada cambio queda en el historial de la cita con usuario y hora; "no asistió" suma al contador del cliente | MVP |
| NA-24 | Como recepción quiero crear citas recurrentes (cada semana, cada 15 días), para clientes fijos y tratamientos | Se muestran los conflictos antes de crear la serie; se puede editar una cita o toda la serie | F2 |
| NA-25 | Como recepción quiero una lista de espera por servicio y día, para llenar cancelaciones | Al liberarse un slot se avisa a los primeros de la lista; el primero en confirmar se lo queda | F2 |

### Épica NA-E: Clientes (mini-CRM)

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-26 | Como admin quiero una ficha por cliente con contacto, historial de citas, gasto total, no-shows, notas y etiquetas, para atender mejor | Se crea sola en la primera reserva; se deduplica por teléfono o email normalizado | MVP |
| NA-27 | Como admin quiero definir campos personalizados para la ficha del cliente (texto, lista, fecha, archivo, sí/no), para guardar lo que mi negocio necesita | Puedo marcar si el cliente lo llena al reservar y si es obligatorio | F2 |
| NA-28 | Como admin de clínica quiero notas privadas de sesión visibles solo para el profesional que atiende y el owner, para proteger datos de salud | Se activa con el módulo de fichas; acceso auditado; cifrado en reposo | F2 |
| NA-29 | Como admin quiero importar clientes desde CSV o Excel, para migrar desde mi cuaderno u otro sistema | Mapeo de columnas, vista previa, reporte de errores y duplicados | F2 |
| NA-30 | Como admin quiero fusionar clientes duplicados, para mantener el historial limpio | Elijo la ficha principal; las citas y notas se unen | F2 |
| NA-31 | Como admin quiero bloquear a un cliente o exigirle depósito tras N no-shows, para protegerme | Regla automática configurable; el cliente ve un mensaje neutro | F2 |

### Épica NA-F: Formularios y comunicación

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-32 | Como admin quiero agregar preguntas al formulario de reserva, por servicio, para llegar preparado | Tipos: texto, lista, sí/no, archivo, firma de consentimiento; pueden ser obligatorias | MVP (básico) / F2 (archivos y firma) |
| NA-33 | Como admin quiero editar los mensajes de confirmación, recordatorio, reprogramación, cancelación y seguimiento, con variables, para que suenen a mi negocio | Vista previa por canal; restaurar el texto por defecto | MVP |
| NA-34 | Como admin quiero elegir canales (email, WhatsApp, SMS) y cuándo se envían los recordatorios (por ejemplo 24 h y 2 h antes), para reducir no-shows | WhatsApp y SMS consumen créditos del plan; el cliente puede confirmar o cancelar desde el mensaje | MVP (email + WhatsApp) |
| NA-35 | Como admin quiero recibir avisos internos de nueva reserva, cancelación o reprogramación, para enterarme al instante | Email, push o WhatsApp al admin y al profesional asignado; configurable por persona | MVP |
| NA-36 | Como admin quiero enviar un mensaje de seguimiento tras la cita (gracias, reseña, "te toca tu próximo corte"), para que vuelvan | Disparo X días después, por servicio | F2 |

### Épica NA-G: Pagos y políticas

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-37 | Como dueño quiero conectar mi cuenta de pasarela (Payphone, Kushki, Datafast o Deuna), para cobrar online a mi nombre | El dinero va a la cuenta del negocio, no a la plataforma; se valida la conexión | F2 |
| NA-38 | Como admin quiero exigir pago total, depósito (monto o porcentaje) o nada, por servicio, para asegurar la cita | El slot se retiene 10 min mientras el cliente paga; si no paga, se libera | F2 |
| NA-39 | Como admin quiero definir la política de cancelación (ventana en horas, reembolso total o parcial, cargo por no-show), para que sea clara y automática | El cliente la ve antes de reservar; fuera de la ventana no puede cancelar online (o pierde el depósito) | MVP (ventana) / F2 (dinero) |
| NA-40 | Como recepción quiero registrar un pago en el local (efectivo, transferencia, tarjeta), para cerrar la cita | Estado de pago: pendiente, parcial, pagado, reembolsado; propinas opcionales | F2 |
| NA-41 | Como dueño quiero emitir la factura electrónica SRI al cliente desde la cita pagada, para no hacerlo en otro sistema | Toma los datos fiscales del cliente o usa "consumidor final"; integración con la plataforma de facturación | F2 |
| NA-42 | Como dueño quiero vender paquetes (5 sesiones) y membresías (clases ilimitadas al mes), para fidelizar | Se descuentan al reservar; aviso de vencimiento; saldo visible para el cliente | F3 |
| NA-43 | Como dueño quiero crear cupones y gift cards, para promociones | Código, monto o porcentaje, vigencia, servicios aplicables | F3 |

### Épica NA-H: Canales, integraciones y reportes

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-44 | Como dueño quiero compartir mi link de reservas, un QR y un botón para Instagram y WhatsApp, para captar clientes donde están | QR descargable en PNG/PDF; links directos a un servicio o profesional | MVP |
| NA-45 | Como dueño quiero incrustar el widget de reservas en mi web, para no sacar al cliente de mi sitio | Snippet de una línea; modo inline o botón flotante; plugin de WordPress | F2 |
| NA-46 | Como profesional quiero sincronizar en dos vías con Google Calendar u Outlook, para que mis eventos personales bloqueen la agenda | Los eventos externos bloquean slots sin mostrar el detalle; las citas aparecen en mi calendario | F2 |
| NA-47 | Como dueño quiero webhooks y API con token, para conectar mi CRM o contabilidad | Eventos: cita creada, actualizada, cancelada, pagada; firma HMAC; reintentos | F3 |
| NA-48 | Como dueño quiero reportes de ocupación, ingresos, no-shows, servicios más vendidos, clientes nuevos y recurrentes, y rendimiento por profesional, para decidir | Filtro por fechas, sede y profesional; exportar a CSV | F2 |
| NA-49 | Como dueño quiero calcular comisiones por profesional (porcentaje por servicio), para pagar a mi equipo | Reporte por periodo con detalle por cita | F3 |
| NA-50 | Como dueño quiero pedir una reseña tras la cita y mostrar las mejores en mi página, para generar confianza | Solo pueden reseñar quienes tuvieron una cita completada; el dueño puede responder, no borrar | F3 |

### Épica NA-I: Mi suscripción

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-51 | Como dueño quiero ver mi plan, el uso frente a los límites y las facturas, para controlar mi gasto | Barra de uso por límite; aviso al 80 % y al 100 % | MVP |
| NA-52 | Como dueño quiero subir o bajar de plan y cambiar mi tarjeta, sin hablar con nadie | Al subir se prorratea; al bajar, si excedo un límite se me dice qué desactivar | F2 |

## 5. Profesional (staff)

El profesional casi siempre usa el celular entre una cita y otra. Su vista tiene que ser mínima: mi agenda de hoy, el próximo cliente y un botón para cambiar el estado.

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| PR-01 | Como profesional quiero ver mi agenda de hoy y de la semana en el celular, para saber qué me toca | Vista móvil (PWA instalable); solo veo mis citas, salvo que tenga permiso para ver las del equipo | MVP |
| PR-02 | Como profesional quiero recibir un aviso cuando me asignan, mueven o cancelan una cita, para no llevarme sorpresas | Push o WhatsApp según mi preferencia; incluye cliente, servicio y hora | MVP |
| PR-03 | Como profesional quiero marcar una cita como "llegó", "en curso", "completada" o "no asistió" con un toque, para que la agenda refleje la realidad | El cambio se ve al instante en recepción | MVP |
| PR-04 | Como profesional quiero ver la ficha del cliente antes de atenderlo (historial, notas, respuestas del formulario, preferencias), para dar un mejor servicio | Solo los campos que mi rol puede ver | MVP |
| PR-05 | Como profesional quiero escribir notas de la sesión y adjuntar fotos (antes y después, receta, evolución), para la próxima visita | En verticales con fichas, las notas son privadas por defecto; las fotos requieren el consentimiento del cliente registrado | F2 |
| PR-06 | Como profesional quiero bloquear tiempo o pedir un día libre desde mi celular, para gestionar mi disponibilidad | Según configuración: se aplica directo o queda pendiente de aprobación del admin | F2 |
| PR-07 | Como profesional quiero agendar la cita de seguimiento al terminar ("vuelve en 3 semanas"), para no perder al cliente | Sugiere la fecha según el servicio; el cliente recibe la confirmación | F2 |
| PR-08 | Como profesional quiero conectar mi Google Calendar personal, para que mis compromisos bloqueen la agenda | Igual que NA-46, gestionado por cada profesional | F2 |
| PR-09 | Como profesional quiero ver mis ingresos y comisiones del periodo, para saber cuánto voy a cobrar | Solo si el owner lo habilita | F3 |
| PR-10 | Como profesional quiero iniciar la videollamada desde la cita, para atender teleconsultas | Botón "Unirse" activo desde 10 min antes | F2 |

## 6. Cliente final (quien reserva)

La meta para el cliente final: reservar en menos de 60 segundos desde el celular, sin crear cuenta. Todo lo demás (cuenta, historial, paquetes) es opcional.

### Épica CL-A: Encontrar y reservar

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| CL-01 | Como cliente quiero abrir el link del negocio y ver sus servicios con precio, duración y descripción, para elegir | Carga en menos de 2 s en 4G; agrupado por categoría; buscador si hay más de 10 servicios | MVP |
| CL-02 | Como cliente quiero elegir el profesional o "cualquiera", para atenderme con quien prefiero o lo antes posible | Foto y nombre del profesional; solo aparecen quienes hacen ese servicio | MVP |
| CL-03 | Como cliente quiero ver los días y horas disponibles en mi zona horaria, para elegir el que me queda | Los días sin cupo se ven deshabilitados; botón "primer horario disponible"; si estoy en otra zona horaria se avisa | MVP |
| CL-04 | Como cliente quiero reservar como invitado con nombre, teléfono (y email opcional), para no crear cuenta | Validación de teléfono con código de país (+593 por defecto); si el negocio lo exige, verificación por código de WhatsApp o SMS | MVP |
| CL-05 | Como cliente quiero responder las preguntas del negocio y subir archivos si me los piden, para llegar listo | Solo aparecen las preguntas del servicio elegido; se guarda el avance si salgo | MVP (preguntas) / F2 (archivos) |
| CL-06 | Como cliente quiero ver la política de cancelación y el depósito antes de confirmar, para saber a qué me comprometo | Casilla de aceptación cuando hay dinero de por medio | MVP |
| CL-07 | Como cliente quiero pagar el depósito o el total online, para asegurar mi cita | El horario queda retenido 10 min durante el pago; el comprobante va en la confirmación; si el pago falla, la cita no se crea | F2 |
| CL-08 | Como cliente quiero agregar add-ons y reservar varios servicios seguidos, para resolver todo en una visita | Calcula la duración total y busca horarios contiguos | F2 |
| CL-09 | Como cliente quiero reservar un cupo en una clase y ver cuántos quedan, para asegurar mi lugar | Si está llena, me ofrece la lista de espera | F2 |
| CL-10 | Como cliente quiero reservar para otra persona (mi hijo, mi mascota), para no usar sus datos de contacto | Campo "¿para quién es?" configurable por vertical; el contacto sigue siendo el mío | F2 |
| CL-11 | Como cliente quiero reservar en inglés o español, para entender todo | Idioma automático según el navegador, con selector manual | F2 |

### Épica CL-B: Después de reservar

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| CL-12 | Como cliente quiero recibir la confirmación por WhatsApp o email con dirección, mapa y botón "agregar a mi calendario", para no olvidarme | Archivo .ics y links a Google y Outlook; link de videollamada si es virtual | MVP |
| CL-13 | Como cliente quiero recibir recordatorios y poder confirmar o cancelar respondiendo, para avisar fácil | Una respuesta "1" confirma y "2" cancela (o botones de WhatsApp); se refleja en la agenda | MVP (link) / F2 (respuesta) |
| CL-14 | Como cliente quiero reprogramar o cancelar desde un link seguro, sin llamar, para resolver solo | Link firmado y único por cita; respeta la ventana de la política; fuera de ella muestra el contacto del negocio | MVP |
| CL-15 | Como cliente en lista de espera quiero que me avisen si se libera un horario, para tomarlo | Tengo X minutos para confirmar antes de que pase al siguiente | F2 |
| CL-16 | Como cliente quiero dejar una reseña después de mi cita, para compartir mi experiencia | Link en el mensaje de seguimiento; de 1 a 5 estrellas y comentario | F3 |

### Épica CL-C: Cuenta opcional y privacidad

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| CL-17 | Como cliente frecuente quiero entrar con un código por WhatsApp o email (sin contraseña), para ver mis citas | Sesión por negocio; veo próximas y pasadas | F2 |
| CL-18 | Como cliente frecuente quiero repetir mi última reserva con un toque, para no elegir todo de nuevo | Precarga servicio y profesional; solo elijo la hora | F2 |
| CL-19 | Como cliente quiero ver el saldo de mis paquetes o membresías, para saber cuántas sesiones me quedan | Visible en mi cuenta y en cada confirmación | F3 |
| CL-20 | Como cliente quiero decidir si recibo promociones y poder pedir que borren mis datos, para controlar mi información | Consentimiento separado para recordatorios (necesarios) y marketing (opcional); solicitud de borrado o exportación desde mi cuenta o por link | MVP (consentimiento) / F2 (autoservicio) |
| CL-21 | Como cliente con alguna discapacidad quiero que la página funcione con lector de pantalla y teclado, para reservar sin ayuda | WCAG 2.1 AA en el flujo de reserva | F2 |

## 7. Reglas de negocio y requisitos no funcionales

Estas reglas cruzan todas las historias. Las tres que más fallan en este tipo de producto son el cálculo de disponibilidad, la doble reserva y las zonas horarias. Conviene tenerlas con pruebas automáticas desde el día uno.

### Reglas de negocio

1. **Cálculo de slot.** Un horario se ofrece solo si cumple todo esto:
   - está dentro del horario de la sede y del profesional;
   - no choca con excepciones, bloqueos, citas existentes (contando sus buffers) ni eventos de calendarios externos;
   - los recursos que exige el servicio están libres;
   - respeta la anticipación mínima y máxima, y los topes por día o por cliente.
2. **Sin doble reserva.** La creación de una cita es atómica: se valida otra vez dentro de una transacción con bloqueo, o con una restricción de exclusión por rango de tiempo en PostgreSQL. Si dos clientes eligen el mismo slot, uno recibe "ese horario acaba de ocuparse" y alternativas cercanas.
3. **Retención temporal.** Mientras hay un pago o una aprobación pendiente, la cita existe en estado "retenida" con vencimiento; un job la libera al expirar.
4. **Tiempo.** Todo se guarda en UTC; se muestra en la zona horaria de la sede (panel) o del cliente (página pública). Las reglas de horario se guardan en hora local de la sede.
5. **Estados de la cita.** retenida → pendiente → confirmada → llegó → en curso → completada; desde cualquier estado previo: cancelada (por cliente o por negocio) o no asistió. Cada transición registra quién, cuándo y por qué, y dispara las notificaciones configuradas.
6. **Política vigente.** Una cita conserva la política que el cliente aceptó al reservar, aunque el negocio la cambie después.
7. **Límites del plan.** Se validan en el backend en cada operación. Al llegar al límite de reservas del mes, la página pública sigue aceptando reservas y avisa al dueño; nunca se le corta una reserva a un cliente final sin aviso previo (decisión a validar).

### Requisitos no funcionales

| Área | Requisito |
| --- | --- |
| Multi-tenancy | Toda tabla de negocio lleva tenant\_id; aislamiento con Row Level Security o un filtro obligatorio en la capa de datos; pruebas que intenten leer datos de otro tenant |
| Rendimiento | Cálculo de disponibilidad de un mes para un profesional en menos de 300 ms p95; página pública en menos de 2 s en 4G |
| Disponibilidad | 99.9 % mensual para la página pública y la API de reservas |
| Notificaciones | Envío por cola, con reintentos e idempotencia (nunca dos recordatorios iguales); registro de entrega por mensaje |
| Seguridad | 2FA opcional para negocios y obligatorio para super admin; links de gestión firmados y con vencimiento; rate limiting en endpoints públicos y OTP |
| Privacidad (LOPDP Ecuador) | Datos de salud tratados como sensibles: cifrado en reposo, acceso por rol, auditoría de lectura; consentimiento explícito; exportación y borrado a pedido; el negocio es responsable del tratamiento y la plataforma es encargada (contrato de encargo) |
| Auditoría | Log inmutable de cambios en citas, pagos, permisos y accesos de soporte |
| Extensibilidad | Configuración por tenant en esquema versionado; módulos con feature flags; campos personalizados en JSONB con su definición validada; eventos de dominio publicados para webhooks |
| Internacionalización | Textos en archivos de idioma; formatos de fecha, hora y moneda por locale |
| Accesibilidad | WCAG 2.1 AA en la página pública |
| Observabilidad | Logs estructurados con tenant\_id, métricas y trazas; alertas por errores de envío y de pagos |
| Respaldo | Backups diarios con prueba de restauración mensual; RPO 24 h, RTO 4 h |

## 8. Priorización por fases y preguntas abiertas

El MVP debe probar una sola cosa: que un negocio pequeño reciba reservas reales y que bajen sus no-shows gracias a los recordatorios por WhatsApp. Los pagos online, los recursos y las clases quedan para F2. Conviene lanzar el MVP con dos plantillas (barbería y consultorio) y con 5 a 10 negocios piloto en Guayaquil.

| Fase | Objetivo | Historias |
| --- | --- | --- |
| MVP | Primer negocio reservando solo | SA-01/02/03/05/07/08/14/15/17/18, SA-13 básico; NA-01 a 04, 06, 07 (asignación), 13 a 16, 18 a 23, 26, 32 básico, 33 a 35, 39 (ventana), 44, 51; PR-01 a 04; CL-01 a 06, 12, 13 (link), 14, 20 (consentimiento) |
| F2 | Cobrar y operar como negocio mediano | Pagos y depósitos, factura SRI, recursos, sedes, clases, lista de espera, recurrencia, aprobación manual, campos personalizados, fichas privadas, sincronización de calendarios, widget, reportes, cuenta del cliente, impersonación y auditoría, cobro automático de la suscripción |
| F3 | Fidelizar y abrir la plataforma | Paquetes y membresías, cupones y gift cards, reseñas, comisiones, API y webhooks públicos, dominio propio, anuncios de plataforma |

### Preguntas abiertas

- [ ] ¿Qué proveedor de WhatsApp Business API se usará (Meta directo, Twilio, 360dialog) y cuánto cuesta por mensaje? Eso define los créditos por plan.
- [ ] ¿Qué pasarela se integra primero para los negocios (Payphone, Kushki, Datafast, Deuna) y cuál para cobrar la suscripción?
- [ ] ¿Las fichas clínicas entran en F2 o se dejan fuera para no asumir el tratamiento de datos de salud desde el inicio?
- [ ] ¿Qué límites y precios tendrá cada plan (gratis, básico, pro)? ¿Se cobra por profesional o por negocio?
- [ ] ¿Qué pasa cuando un negocio del plan gratis llega a su límite de reservas: se aceptan y se avisa, o se bloquean? (regla 7)
- [ ] ¿Se necesita app nativa para profesionales, o basta con una PWA en el MVP?

## 9. Referencia: Koalendar en clínicas, spas y barberías

Revisamos las páginas que Koalendar dedica a cada uno de estos tres verticales. La idea es ver qué ofrece un competidor directo y marcar qué historias de este documento cubren cada función. Las funciones sin historia previa se cubren en la sección 9.4.

Leyenda del plan de Koalendar: **Free**, **Pro**, **Biz** (Business), **Prem** (Premium). "Pago" significa que la función está en cualquier plan pagado.

### 9.1 Barberías

| Función en Koalendar | Plan Koalendar | Nuestra historia |
| --- | --- | --- |
| Página de reservas 24/7 desde el celular, sin descargar app | Free | CL-01 |
| Links para la web, Instagram y Google Business Profile | Free | NA-44 |
| Logo y colores en la página de reservas | Free / Pro (personalización completa) | NA-04 |
| Página incrustable en la web del negocio | Free | NA-45 |
| Ventanas de reserva, anticipación mínima y reglas | Free | NA-16 |
| Servicios (corte, barba, paquetes de grooming) con su duración y precio | Free | NA-06 |
| Buffers antes y después de la cita (limpieza, preparación) | Free | NA-06 |
| Citas recurrentes para clientes fijos (semanal, quincenal) | Pago | NA-24 |
| Varias reservas a la vez (varias fechas en una operación) | Biz / Prem | CL-22 |
| Paquetes de sesiones prepagados | Biz / Prem | NA-42 |
| Lista de espera con aviso cuando se libera un cupo | Biz / Prem | NA-25, CL-15 |
| Sesiones grupales | Pro | NA-09 |
| Aprobación antes de confirmar | Pro | NA-17 |
| Reprogramar y cancelar por link | Free | CL-14 |
| Página de reservas por barbero, silla o servicio | Free | CL-02, NA-44 (links directos) |
| Round-robin con prioridad | Biz / Prem | NA-18 |
| Cita colectiva (varios anfitriones en la misma cita) | Biz / Prem | NA-57 |
| Sincronización con Google, Outlook e iCloud; bloquea lo ocupado | Free | NA-46, PR-08 |
| Preguntas por servicio (tipo de fade, largo de barba) | Pro: hasta 3; Biz/Prem: ilimitadas | NA-32 |
| Lógica condicional en las preguntas | Biz / Prem | NA-53 |
| Subir fotos de referencia del estilo | Pago | CL-05 |
| Links privados o con contraseña para clientes VIP | Pro | NA-54 |
| Recordatorios por email o SMS (hasta 3 emails + créditos de SMS) | Pro / Biz | NA-34 |
| Emails de seguimiento (pedir reseña, invitar a re-reservar) | Biz / Prem | NA-36, NA-50 |
| Aviso inmediato de nueva reserva al negocio | Free | NA-35 |
| Depósito o pago total con Stripe; tarjeta, Apple Pay, Google Pay, PayPal | Pro | NA-37, NA-38 |
| Cupones | Pro | NA-43 |
| Quitar la marca de Koalendar de páginas y emails | Biz / Prem | NA-04 |
| Redirigir al cliente a la web del negocio después de reservar | Pro | NA-55 |
| Más de 30 idiomas | Free | CL-11 |
| Apps para iPhone y Android | Free | PR-01 |
| Zapier y webhooks | Pro y superior | NA-47 |
| Links de Zoom, Meet y Teams en la reserva | Free | NA-12 |
| Plugins para WordPress, Wix, Squarespace y Shopify | Free | NA-45 |
| Google Analytics | Pago | NA-55 |
| Importar eventos desde Calendly con un clic | Free | NA-58 |

### 9.2 Clínicas y profesionales médicos

| Función en Koalendar | Plan Koalendar | Nuestra historia |
| --- | --- | --- |
| El paciente agenda, reprograma o cancela solo, 24/7 | Free | CL-01 a CL-04, CL-14 |
| Sincronización de calendarios para evitar doble reserva | Free | NA-46, regla 2 |
| Página incrustable en la web, el portal de pacientes o redes | Free | NA-45, NA-44 |
| Páginas de reserva protegidas con contraseña | Pro / Biz | NA-54 |
| Detección automática de zona horaria e idioma | Free | CL-03, CL-11 |
| Formularios de admisión previos a la cita | Pro / Biz | NA-32, CL-05 |
| Historial médico, datos del seguro y foto del carnet | Pro / Biz | NA-27, NA-32, CL-05 |
| Consentimientos firmados antes de la consulta | Pro / Biz | NA-32 (firma) |
| Subida segura de archivos | Biz | CL-05, requisito de seguridad |
| Recordatorios por email y SMS antes y después de la cita | Pro | NA-34, NA-36 |
| Recordatorio al paciente que no completó el formulario | Pro / Biz | NA-56 |
| Mensajes de seguimiento post-consulta | Biz | NA-36 |
| Teleconsulta: links de Zoom, Meet o Teams automáticos | Free | NA-12, PR-10 |
| Consultas presenciales y virtuales en el mismo sistema | Free | NA-12 |
| Preparación para HIPAA, BAA como add-on, comunicación cifrada | Add-on | Requisitos no funcionales (LOPDP, contrato de encargo, cifrado) |
| SOC 2 | Enterprise | Fuera de alcance por ahora (pregunta abierta para clientes grandes) |
| Agendas de varios doctores o sedes | Pago | NA-11, NA-14 |
| Asignar citas a un doctor, departamento o consultorio | Pago | NA-07, NA-10 |
| Round-robin y cita colectiva entre profesionales | Biz | NA-18, NA-57 |
| Calendarios compartidos de staff, consultorios y teleconsultas | Biz | NA-19 |
| Controles de admin para todo el equipo | Biz | NA-13 |
| Cobro online de copagos o consultas con Stripe | Pro | NA-37, NA-38 |
| Cupones | Pro / Biz | NA-43 |
| Zapier y webhooks hacia sistemas de historia clínica (EHR) | Pro y superior | NA-47 |
| Redirecciones, BCC y "enviar como" desde Gmail | Biz | NA-55 (redirección); el envío desde el dominio del negocio queda como pregunta abierta |
| Google Analytics y Meta Pixel | Biz | NA-55 |
| Apps móviles, extensión de Chrome, plugin de WordPress | Free | PR-01, NA-45 |

### 9.3 Spas

| Función en Koalendar | Plan Koalendar | Nuestra historia |
| --- | --- | --- |
| Reserva 24/7 aunque la recepción esté cerrada | Free | CL-01 |
| Páginas para masajes, faciales y paquetes de bienestar, con disponibilidad en tiempo real | Free | CL-01, CL-03 |
| El cliente elige terapeuta y hora y confirma al instante | Free | CL-02, CL-03 |
| Compartir por web, Instagram, Facebook y QR en recepción | Free | NA-44, NA-45 |
| Links precargados con el tratamiento o terapeuta habitual del cliente | Free | CL-18, NA-44 |
| Formularios de admisión y consentimiento personalizables | Pro | NA-27, NA-32 |
| Preguntas sobre alergias, preferencias y requisitos del tratamiento | Pro | NA-27, NA-32 |
| Archivos y notas recibidos antes de la sesión | Pago | CL-05 |
| Envío automático de instrucciones previas al tratamiento | Pago | NA-56 |
| Preguntas condicionales según respuestas anteriores | Biz / Prem | NA-53 |
| Disponibilidad por terapeuta y por cabina | Pago | NA-10, NA-14 |
| Asignar terapeuta o cabina a cada tratamiento | Pago | NA-07, NA-10 |
| Buffers entre citas para preparar la cabina | Free | NA-06 |
| Calendario visual de terapeutas y cabinas | Pago | NA-19 |
| Detección de conflictos de turnos; ajustes por terapeuta o servicio | Pago | NA-15, NA-16 |
| Seguimiento de carga de trabajo y uso de recursos | Pago | NA-48 |
| Confirmaciones y recordatorios con marca por email y SMS | Pro | NA-33, NA-34 |
| Política de cancelación y recordatorio del depósito dentro del mensaje | Pro | NA-33, NA-39 |
| Seguimiento automático después de la cita | Biz / Prem | NA-36 |
| Aprobar o rechazar la reserva antes de confirmar | Pro y superior | NA-17 |
| Depósito o pago total con Stripe; tarjeta, Apple Pay, Google Pay, PayPal | Pro y superior | NA-37, NA-38 |
| Cupones | Pro y superior | NA-43 |
| Paquetes de sesiones prepagados | Biz / Prem | NA-42, CL-19 |
| Lista de espera | Biz / Prem | NA-25, CL-15 |
| Citas recurrentes y varias reservas en una sola operación | Biz / Prem | NA-24, CL-22 |
| Round-robin con prioridad y citas colectivas | Pro y superior | NA-18, NA-57 |
| Asientos de equipo cobrados aparte | Biz (3 incluidos) / Prem (por asiento) | SA-07 (límites por plan) |

### 9.4 Historias que salen de la comparación

| ID | Historia | Criterios de aceptación | Fase |
| --- | --- | --- | --- |
| NA-53 | Como admin quiero que una pregunta del formulario aparezca solo según la respuesta a otra (por ejemplo, "¿tienes alergias?" → "¿cuáles?"), para pedir solo lo necesario | Reglas simples: si la pregunta X es igual a / contiene / es sí → mostrar Y; las preguntas ocultas no se validan como obligatorias | F2 |
| NA-54 | Como admin quiero marcar un servicio o una página como privada (solo con link) o protegida con contraseña, para atender a clientes VIP o pacientes referidos | Las páginas privadas no salen en la página pública ni en los buscadores; la contraseña se puede rotar | F2 |
| NA-55 | Como dueño quiero redirigir al cliente a una URL mía tras reservar y conectar Google Analytics o Meta Pixel, para medir mis campañas | Se configura por negocio o por servicio; los eventos "reserva iniciada" y "reserva confirmada" se envían al pixel; se respeta el consentimiento de cookies | F3 |
| NA-56 | Como admin quiero enviar instrucciones previas por servicio (ayuno, llegar sin maquillaje) y recordar al cliente que tiene el formulario pendiente, para que llegue preparado | Mensaje programado X horas antes, por servicio; el recordatorio de formulario se detiene al completarlo | F2 |
| NA-57 | Como admin quiero servicios que requieran a dos o más profesionales en la misma cita (por ejemplo, médico + asistente, masaje a cuatro manos), para agendarlos de una vez | El slot existe solo si todos los profesionales requeridos están libres; la cita aparece en la agenda de cada uno | F3 |
| NA-58 | Como dueño quiero importar mis servicios y citas futuras desde Calendly, Koalendar o Google Calendar, para cambiarme sin perder nada | Importación guiada con vista previa; las citas importadas no reenvían confirmaciones | F3 |
| CL-22 | Como cliente quiero reservar varias fechas en una sola operación (por ejemplo, 4 sesiones de fisioterapia), para no repetir el flujo | Selecciono varios slots y confirmo una vez; si uno se ocupa en el camino, se me avisa cuál y los demás se mantienen | F2 |

### 9.5 Dónde nos diferenciamos

En las páginas revisadas, Koalendar cobra solo con Stripe y PayPal, y envía recordatorios por email y SMS. Estas son oportunidades claras para el mercado ecuatoriano:

- **WhatsApp como canal principal** de confirmación, recordatorio y respuesta (NA-34, CL-13). En las páginas revisadas de Koalendar no aparece WhatsApp.
- **Pasarelas locales** (Payphone, Kushki, Datafast, Deuna) y registro de pagos en efectivo o por transferencia (NA-37, NA-40).
- **Factura electrónica SRI** desde la cita pagada y para la suscripción (NA-41, SA-10).
- **Feriados de Ecuador precargados**, zona horaria y moneda por defecto (NA-15, NA-03).
- **Cumplimiento con la LOPDP** en lugar de HIPAA, que es una norma de EE. UU. y no aplica en Ecuador.
- **Fichas privadas de sesión** con notas y fotos del profesional (NA-28, PR-05). La página médica de Koalendar envía datos a sistemas de historia clínica externos por webhooks; no trae fichas propias.

Algo para decidir en el modelo de precios (SA-07): Koalendar deja en el plan gratis las reservas ilimitadas, la sincronización de calendarios y la videollamada. Cobra por pagos, recordatorios personalizados, formularios, paquetes, lista de espera y equipos. Es una buena referencia para armar los planes.

## Fuentes

Revisadas el 6 de noviembre de 2026.

- [Koalendar para barberías](https://koalendar.com/scheduling-software-for/barber)
- [Koalendar para profesionales médicos](https://koalendar.com/scheduling-software-for/medical)
- [Koalendar para clínicas](https://koalendar.com/scheduling-software-for/clinics)
- [Koalendar para spas](https://koalendar.com/scheduling-software-for/spa)