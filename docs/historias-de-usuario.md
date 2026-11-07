# Historias de usuario: SaaS de agendamiento de citas

**Referente:** Riservafy (https://riservafy.com/ y https://riservafy.com/b/test/)
**Fuente:** scraping con Scrapling (landing en navegador con `--network-idle`; página de reserva pública). Solo contenido público.
**Alcance:** lo observado en el referente, más los supuestos marcados como `[Supuesto]`.

## Roles

- **Dueño del negocio (Admin):** crea la cuenta, configura el negocio y ve reportes.
- **Profesional / Staff:** miembro del equipo con su propia agenda y disponibilidad.
- **Cliente final:** reserva desde la página pública del negocio.

## Épica 1: Onboarding y cuenta

**HU-01. Registro gratuito**
Como dueño de negocio, quiero registrarme sin tarjeta de crédito, para probar el producto sin compromiso.
- Dado que entro a "Get started free", cuando completo el registro, entonces tengo acceso al plan Free.
- No se solicita tarjeta de crédito en el registro.

**HU-02. Inicio de sesión**
Como usuario registrado, quiero iniciar sesión, para acceder a mi espacio de trabajo.
- Acceso desde "Log in".

**HU-03. Configuración guiada inicial**
Como dueño, quiero añadir negocio, servicios, equipo y horarios en pasos, para tener mi agenda lista pronto.
- Pasos observados: "Make it yours" (negocio, servicios, equipo, horarios).

## Épica 2: Configuración del negocio

**HU-04. Datos del negocio**
Como dueño, quiero registrar nombre, dirección, teléfono, email y horario, para que los clientes me encuentren y contacten.
- Se muestran en la página pública: dirección, mapa, indicaciones, email, teléfono y horario.
- Incluye tipo de negocio (p. ej. Barbershop, Salon, Spa, Clinic, Fitness).

**HU-05. Catálogo de servicios**
Como dueño, quiero crear servicios con nombre, duración y precio, para que el cliente elija.
- Ejemplo observado: "cut", 30 min, precio gratuito/$0.00.
- Un servicio puede tener precio cero.

**HU-06. Gestión del equipo**
Como dueño, quiero invitar profesionales al equipo, para repartir citas.
- Observado: "invite your team".
- Cada profesional aparece en la pestaña "Team" de la reserva.

**HU-07. Horarios de trabajo**
Como dueño, quiero definir horarios de trabajo generales y por profesional, para que solo se ofrezcan huecos válidos.
- Observado: horario del negocio "Monday - Friday 8:00 am - 5:00 pm".
- Observado: disponibilidad de cada empleado en el calendario.

**HU-08. Enlace de reserva propio**
Como dueño, quiero un enlace público de reservas para compartir, para que los clientes reserven desde cualquier lugar.
- Observado: "Your booking link, ready to share" y "Share your link".
- La URL tiene formato `/b/<slug-del-negocio>`.
- Personalizable con la marca del negocio ("Your brand at every step").

## Épica 3: Calendario y agenda

**HU-09. Vista de calendario diaria y semanal**
Como dueño o profesional, quiero ver mi día o semana de un vistazo, para organizar citas.
- Observado: vista semanal con citas y disponibilidad de empleados.

**HU-10. Vista de agenda por profesional**
Como dueño, quiero filtrar la agenda por profesional, para ver la carga de cada uno.
- `[Supuesto]` filtro por profesional.

**HU-11. Vista móvil**
Como profesional, quiero consultar mi agenda desde el móvil, para tenerla conmigo.
- Observado: apps en App Store y Google Play con calendario, citas, equipo e insights.

**HU-12. Listado de citas**
Como dueño, quiero ver citas próximas, pasadas y canceladas con los datos del cliente, para tener control.
- Observado: "Keep upcoming, past, and cancelled bookings in view".

## Épica 4: Reserva del cliente (página pública)

**HU-13. Ver información del negocio**
Como cliente, quiero ver dirección, horario, teléfono y mapa del negocio, para saber dónde y cuándo ir.
- Observado: "Contact Information" con enlace a Google Maps e indicaciones.
- Muestra el estado actual ("Today · 8:00 am–5:00 pm").

**HU-14. Elegir servicio**
Como cliente, quiero elegir un servicio con su duración y precio, para saber qué reservo.
- Observado: "Choose a service... 30 min... Book".

**HU-15. Elegir profesional**
Como cliente, quiero elegir a un profesional del equipo, para reservar con quien prefiera.
- Observado: "Team" en la página de reserva.
- `[Supuesto]` opción "cualquier profesional".

**HU-16. Elegir fecha y hora**
Como cliente, quiero ver solo los huecos disponibles, para no elegir un horario ocupado.
- Observado: "views available appointment dates and times".

**HU-17. Resumen de la reserva**
Como cliente, quiero ver un resumen con servicio, duración, precio y profesional antes de confirmar, para validar mi cita.
- Observado: "The booking summary keeps their service, duration, and price together".

**HU-18. Confirmar la cita**
Como cliente, quiero confirmar la reserva con un clic, para asegurar mi hueco.
- Al confirmar, la cita aparece en la agenda del negocio.
- Botón "Book appointment".

**HU-19. Aviso de consentimiento de cookies**
Como cliente, quiero aceptar o rechazar cookies analíticas, para decidir mi privacidad.
- Observado: banner "Accept" / "Reject" en la página de reserva.
- Las cookies analíticas son opcionales.

## Épica 5: Gestión de citas

**HU-20. Crear cita manual**
Como dueño o profesional, quiero crear una cita para un cliente que llamó o llegó, para no perder reservas fuera de línea.
- `[Supuesto]` no observado en el referente.

**HU-21. Cancelar o reprogramar cita**
Como dueño, quiero cancelar o mover una cita, para gestionar cambios.
- Observado: estado "cancelled" en el historial.
- `[Supuesto]` reprogramación.

**HU-22. Ficha del cliente**
Como dueño, quiero ver los datos y el historial del cliente en la cita, para atenderlo mejor.
- Observado: "customer details you need".

## Épica 6: Reportes

**HU-23. Reportes de citas e ingresos**
Como dueño, quiero ver citas e ingresos en reportes, para entender el negocio.
- Observado: "Follow appointments and revenue with reports".

## Épica 7: Planes y facturación (SaaS)

**HU-24. Plan Free**
Como dueño de un negocio unipersonal, quiero usar un plan gratuito, para empezar sin pagar.
- Sin tarjeta de crédito.
- 1 empleado activo, hasta 20 citas/mes, página pública de reserva, calendario, servicios, citas y eventos, branding y reglas de reserva, cobros de clientes y reporte de pagos.
- Sin SMS. Sin Marketplace ni empleados adicionales.
- Comisión de plataforma: 2% por pago exitoso, tope $5.00 por transacción.

**HU-25. Ver y comparar planes**
Como dueño, quiero ver los planes con precio mensual y anual, para elegir el que me conviene.
- Planes: Free, Starter ($15/mes), Team ($34/mes), Pro ($69/mes).
- Facturación mensual o anual (anual se cobra una vez al año).
- Criterios de aceptación: cada plan muestra empleados incluidos, créditos SMS, citas ilimitadas (desde Starter), comisión y costo por empleado extra.

**HU-26. Suscribirse a un plan de pago**
Como dueño, quiero pasar de Free a Starter, Team o Pro, para desbloquear citas ilimitadas y más empleados.
- Desde cada plan, botón "Choose <plan>" lleva a registro/alta.
- `[Supuesto]` flujo de cobro de la suscripción no observado.

**HU-26b. Empleados adicionales con cobro por asiento**
Como dueño de Team o Pro, quiero agregar empleados activos extra, para crecer pagando solo por los activos.
- Team: $7 por empleado extra/mes. Pro: $6 por empleado extra/mes.
- Solo se cobran empleados activos.

**HU-26c. Créditos SMS**
Como dueño de un plan de pago, quiero enviar SMS a mis clientes con créditos mensuales, para confirmar y recordar citas.
- Créditos por plan: Starter 200, Team 600, Pro 1,200.
- Créditos no se acumulan; se renuevan cada mes, incluso en anual.
- Mensajes largos o con Unicode consumen más de un crédito.
- Free no tiene SMS. Opcional: packs mensuales o uso bajo demanda con tope de gasto.

**HU-26d. Comisión por pago de cliente**
Como dueño, quiero saber cuánto descuenta la plataforma de cada cobro, para calcular mi payout.
- Comisión por plan: Free 2%, Starter 1%, Team 0.5%, Pro 0%; tope $5.00 por transacción.
- Stripe se descuenta aparte. Ambas se descuentan del payout; el cliente paga solo el monto de la reserva o producto.

**HU-26e. Marketplace de productos (Team y Pro)**
Como dueño de Team o Pro, quiero vender productos para recoger en tienda, para ampliar ingresos.
- Gestión de pedidos de recogida.
- Pro: sin comisión de plataforma en Marketplace.

## Épica 8: Requisitos transversales

**HU-27. Cumplimiento y legales**
Como usuario, quiero ver términos y política de privacidad, para conocer mis derechos.
- Observado: `/terms` y `/privacy`.

**HU-28. Soporte**
Como usuario, quiero acceder a soporte, para resolver dudas.
- Observado: `/support`.

**HU-29. Aislamiento entre negocios (multi-tenant)**
Como negocio, quiero que mis datos y agenda estén separados de otros negocios, para proteger mi información.
- `[Supuesto]` requisito SaaS implícito.

**HU-30. Notificaciones**
Como cliente y dueño, quiero recibir confirmaciones y recordatorios de cita, para no faltar.
- `[Supuesto]` no observado en el referente.

## Pendientes de verificación

- Flujo de registro y configuración real (detrás de login).
- Flujo real de cobro de suscripción y packs SMS (no mostrado en `/pricing`).
- Reprogramación, notificaciones y pagos: no observados en el contenido público.
