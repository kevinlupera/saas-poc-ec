# identity/user-auth Specification

## Purpose

Define los flujos de autenticación del frontend para usuarios del negocio mediante email y Google, y su integración con una API externa de identidad sin implementar ese backend.

## Requirements

### Requirement: Authentication navigation and direct access
El frontend SHALL proporcionar rutas navegables y accesibles directamente para login, registro, recuperación, restablecimiento y verificación de email. Los accesos de autenticación de la landing SHALL navegar a estas rutas en escritorio y móvil.

#### Scenario: Landing access links
- **WHEN** una persona pulsa iniciar sesión o empezar gratis desde la landing
- **THEN** se abre la pantalla de login o registro correspondiente, sin depender de anclas vacías.

#### Scenario: Direct route access
- **WHEN** se abre o recarga directamente una ruta de autenticación en el despliegue estático configurado
- **THEN** aparece la pantalla correspondiente sin un error 404 ni una petición de sesión durante la generación del sitio.

### Requirement: Accessible themed authentication forms
Las pantallas SHALL mantener el diseño y los temas del producto, funcionar desde 320 px sin desbordamiento horizontal y permitir completar formularios con teclado, etiquetas asociadas y errores anunciables. Las contraseñas SHALL permitir pegado, autocompletado apropiado y mostrar u ocultar su valor mediante un control accesible.

#### Scenario: Keyboard validation
- **WHEN** se envía un formulario incompleto usando el teclado
- **THEN** se muestran errores asociados a los campos, se enfoca el primer campo inválido y no se envía una solicitud.

#### Scenario: Mobile and dark theme
- **WHEN** se abre cualquier pantalla de autenticación en móvil o con el tema oscuro seleccionado
- **THEN** sus campos, mensajes, botones y estados de foco siguen siendo legibles y utilizables sin desplazamiento horizontal.

### Requirement: Email password sign-in
El frontend SHALL permitir iniciar sesión con email y contraseña mediante la API configurada. SHALL impedir envíos duplicados mientras una solicitud está pendiente y conservar la navegación hacia registro y recuperación.

#### Scenario: Successful credential sign-in
- **WHEN** la API acepta las credenciales y confirma una sesión
- **THEN** la aplicación muestra el retorno autenticado y obtiene la identidad desde la sesión de la API.

#### Scenario: Rejected credentials
- **WHEN** la API rechaza las credenciales
- **THEN** se muestra un error recuperable sin revelar si existe la cuenta y el formulario vuelve a estar disponible.

#### Scenario: Verification required
- **WHEN** la API identifica explícitamente que se requiere verificar el email
- **THEN** se ofrece continuar al flujo de verificación sin tratar otros errores de acceso como una verificación pendiente.

### Requirement: Email password registration
El frontend SHALL permitir solicitar una cuenta con nombre, email y contraseña, confirmando localmente que ambas contraseñas coinciden. SHALL distinguir la aceptación de la solicitud de la existencia de una sesión y permitir continuar a verificación cuando no se haya iniciado sesión.

#### Scenario: Invalid registration data
- **WHEN** el email no es válido, falta un campo obligatorio o las contraseñas no coinciden
- **THEN** no se envía la solicitud y se muestran los errores correspondientes.

#### Scenario: Registration accepted without session
- **WHEN** la API acepta el registro pero no confirma una sesión
- **THEN** se muestra la siguiente acción de verificación o acceso sin afirmar que la persona ya inició sesión ni revelar si el email existía.

#### Scenario: Registration with session
- **WHEN** la API acepta el registro y confirma una sesión
- **THEN** se navega al retorno autenticado sin solicitar datos del negocio ni crear un tenant desde el frontend.

### Requirement: Google authentication
El frontend SHALL ofrecer continuar con Google en login y registro usando el mismo flujo de identidad externo. SHALL gestionar el inicio de la redirección, el retorno y los errores, sin incluir secretos del proveedor ni asumir autenticación antes de confirmar la sesión.

#### Scenario: Start Google authentication
- **WHEN** se pulsa continuar con Google y la API devuelve una redirección de autorización válida
- **THEN** se inicia el flujo de Google con un destino de retorno controlado por la aplicación y no se envían contraseñas del formulario al proveedor.

#### Scenario: Google return with session
- **WHEN** finaliza Google y la aplicación recibe el retorno
- **THEN** consulta la sesión antes de mostrar el estado autenticado.

#### Scenario: Cancellation or provider failure
- **WHEN** Google o la API devuelve una cancelación o error de autenticación
- **THEN** se muestra un mensaje seguro con opción de reintentar o usar email, sin exponer parámetros internos ni dejar la pantalla bloqueada.

### Requirement: Password reset request privacy
El frontend SHALL permitir solicitar recuperación por email y mostrar una confirmación genérica tras la aceptación de la API. SHALL diferenciar fallos de red o del servicio de una solicitud aceptada sin revelar la existencia de una cuenta.

#### Scenario: Accepted recovery request
- **WHEN** la API acepta la recuperación para cualquier email con formato válido
- **THEN** se muestra un mensaje equivalente a «Si existe una cuenta, recibirás instrucciones», sin afirmar que se ha entregado un email.

#### Scenario: Recovery service unavailable
- **WHEN** la solicitud falla por un problema de red o indisponibilidad de la API
- **THEN** se informa del fallo y se permite reintentar, sin mostrar la confirmación de aceptación.

### Requirement: Password reset completion
El frontend SHALL permitir establecer y confirmar una nueva contraseña mediante el token del enlace de recuperación. SHALL rechazar formularios inválidos y ofrecer una nueva recuperación ante tokens ausentes, inválidos o vencidos, sin persistir ni registrar el token.

#### Scenario: Valid password reset
- **WHEN** la API acepta el token y la nueva contraseña
- **THEN** se muestra confirmación y un enlace para iniciar sesión, sin asumir que el restablecimiento abrió una sesión.

#### Scenario: Missing or rejected token
- **WHEN** no existe un token en el enlace o la API lo rechaza por inválido o vencido
- **THEN** no se comunica éxito y se ofrece solicitar otro enlace.

### Requirement: Email verification and resend
El frontend SHALL presentar instrucciones de verificación y permitir reenviar el email mediante la API. SHALL manejar enlaces inválidos o vencidos y evitar afirmar que un email está verificado únicamente por parámetros manipulables de la URL.

#### Scenario: Verification email accepted
- **WHEN** la API acepta el reenvío de verificación
- **THEN** se muestra una confirmación genérica de la solicitud y se permite continuar al login sin afirmar entrega del mensaje ni autenticación.

#### Scenario: Verification return
- **WHEN** se vuelve desde el enlace de verificación
- **THEN** se permite continuar al acceso; el estado de verificación o de sesión solo se considera confirmado si procede de la API.

#### Scenario: Invalid verification link
- **WHEN** el retorno indica un enlace inválido o vencido
- **THEN** se explica que hace falta otro enlace y se ofrece volver al reenvío.

### Requirement: Cookie session lifecycle
El frontend SHALL distinguir entre sesión cargando, autenticada, anónima y error de consulta. SHALL permitir cerrar una sesión y actualizar la identidad visible, sin usar almacenamiento del navegador para credenciales o tokens de sesión ni tratar la UI como autorización del backend.

#### Scenario: Session resolution on return
- **WHEN** se abre o recarga el retorno de autenticación
- **THEN** se muestra carga hasta resolver la consulta y solo una sesión válida permite mostrar datos de la identidad autenticada.

#### Scenario: Session lookup fails
- **WHEN** la API no responde a la consulta de sesión
- **THEN** se presenta un error con reintento, distinto de una respuesta válida sin sesión.

#### Scenario: Sign-out
- **WHEN** la API confirma el cierre de sesión
- **THEN** desaparecen los datos de la sesión anterior y se vuelve al login.

### Requirement: Safe redirects and error presentation
El frontend SHALL usar destinos de retorno propios y permitidos, presentar errores en español sin HTML ni detalles internos y no registrar credenciales ni tokens. SHALL mantener los fallos del servicio visibles y recuperables sin producir éxitos de autenticación simulados.

#### Scenario: Untrusted return destination
- **WHEN** una URL incluye un destino externo, relativo al protocolo o no permitido
- **THEN** se ignora ese destino y se utiliza el retorno seguro de la aplicación.

#### Scenario: Unrecognized API error
- **WHEN** la API devuelve un error no reconocido o texto interno
- **THEN** la interfaz muestra un mensaje genérico seguro, conserva la posibilidad de reintentar y no representa la operación como completada.

### Requirement: Frontend API integration boundary
El frontend SHALL dirigir las operaciones de identidad y sesión a una URL pública configurable, incluyendo las cookies necesarias. El alcance SHALL limitarse al frontend y documentar los prerrequisitos externos para completar el flujo real, sin servidores de autenticación simulados en producción ni secretos de Google en el bundle público.

#### Scenario: Environment-specific identity API
- **WHEN** se configura una URL de API distinta para otro ambiente
- **THEN** todas las operaciones de identidad usan esa configuración sin editar las pantallas.

#### Scenario: Backend absent
- **WHEN** se visitan las pantallas y se intenta una operación sin un backend de autenticación disponible
- **THEN** las pantallas permanecen utilizables y la operación muestra un error recuperable, sin crear identidades ficticias ni iniciar una sesión local.
