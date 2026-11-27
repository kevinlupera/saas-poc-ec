# Spec Delta

## ADDED Requirements

### Requirement: Sign-in during an agent authorization
Cuando la API redirige al login durante una autorización OAuth de un agente, el frontend SHALL mostrar la misma pantalla de login de la web, con email y contraseña y con Google si está habilitado, conservando la solicitud firmada. Tras iniciar sesión SHALL continuar la autorización en la API y no ir al retorno normal de la aplicación.

#### Scenario: Email sign-in continues the authorization
- **WHEN** una persona con email verificado llega al login desde una autorización de agente e inicia sesión con email y contraseña
- **THEN** el navegador sigue la URL de continuación que devuelve la API y llega a la pantalla de consentimiento sin volver a iniciar sesión.

#### Scenario: Consent already given
- **WHEN** una persona que ya autorizó a ese agente para el negocio activo inicia sesión desde una nueva autorización
- **THEN** el navegador sigue la URL que devuelve la API y vuelve directamente a la aplicación del agente con el código, sin mostrar el consentimiento otra vez.

#### Scenario: Google sign-in continues the authorization
- **WHEN** una persona llega al login desde una autorización de agente y continúa con Google
- **THEN** al volver de Google la API retoma esa misma autorización y la persona llega a la pantalla de consentimiento.

#### Scenario: Unverified email during an authorization
- **WHEN** una cuenta sin email verificado intenta iniciar sesión desde una autorización de agente
- **THEN** no se crea sesión ni se muestra el consentimiento, se ofrece verificar el email y la autorización puede reiniciarse desde el agente después.

#### Scenario: Tampered authorization request
- **WHEN** la solicitud firmada de la autorización se altera o ha vencido
- **THEN** la API la rechaza y el frontend muestra un error seguro sin emitir consentimiento.

#### Scenario: Normal login unaffected
- **WHEN** se inicia sesión desde la web sin una autorización de agente en curso
- **THEN** el flujo termina en el retorno normal de la aplicación, igual que antes.

### Requirement: Agent consent screen
El frontend SHALL mostrar una pantalla de consentimiento en español, con el mismo diseño y tema que las pantallas de autenticación, que nombre la aplicación solicitante y los permisos pedidos y permita aceptar o rechazar. SHALL enviar la decisión a la API con la solicitud firmada y seguir la redirección que esta devuelva.

#### Scenario: Accept access
- **WHEN** la persona acepta el acceso del agente
- **THEN** la API registra el consentimiento para el negocio activo y el navegador vuelve a la aplicación del agente con el código de autorización.

#### Scenario: Unverified client
- **WHEN** la aplicación solicitante no se identifica con un documento de metadatos https (CIMD), por ejemplo un cliente registrado dinámicamente
- **THEN** la pantalla la marca como "No verificado", advierte que no se pudo comprobar quién la publica y muestra el dominio al que volverá el navegador

#### Scenario: Deny access
- **WHEN** la persona rechaza el acceso
- **THEN** no se emite ningún código y el navegador vuelve a la aplicación del agente con un error de acceso denegado.
