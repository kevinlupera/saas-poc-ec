# Spec Delta

## Purpose

Proporciona páginas informativas accesibles desde la landing, distinguiendo los borradores legales del contenido definitivo y ofreciendo ayuda básica para acceder a la aplicación.

## ADDED Requirements

### Requirement: Public information routes
El frontend SHALL proporcionar `/terms`, `/privacy` y `/support` como páginas accesibles desde los enlaces existentes del footer y mediante navegación directa, sin excluirlas del prerender para ocultar errores.

#### Scenario: Footer navigation and direct access
- **WHEN** una persona abre cualquiera de las tres páginas desde la landing o recarga su URL
- **THEN** recibe la página correspondiente sin 404, con navegación de retorno al inicio.

### Requirement: Explicit legal draft status
Las páginas de términos y privacidad SHALL mostrar que son borradores pendientes de revisión, no solicitar aceptación contractual y no inventar contactos, responsables, compromisos legales o afirmaciones de cumplimiento.

#### Scenario: Legal draft displayed
- **WHEN** se visita `/terms` o `/privacy` en esta fase de desarrollo
- **THEN** el carácter de borrador no definitivo resulta visible y no se presenta el contenido como documentación legal aprobada.

### Requirement: Basic access support
La página de soporte SHALL ofrecer ayuda para login, registro, verificación y recuperación de acceso con enlaces internos válidos, sin publicar canales de contacto inventados.

#### Scenario: Access troubleshooting
- **WHEN** una persona consulta `/support`
- **THEN** puede navegar a los flujos de autenticación y conocer las limitaciones actuales de la integración sin que se le prometa un envío de email o acceso que el backend no haya confirmado.

### Requirement: Consistent accessible public pages
Las páginas informativas SHALL usar los temas y estilos del producto, funcionar desde 320 px sin desbordamiento horizontal y mantener enlaces accesibles con teclado.

#### Scenario: Mobile and theme support
- **WHEN** se visita una página informativa en una pantalla de 320 px o se cambia entre tema claro y oscuro
- **THEN** el contenido y la navegación permanecen legibles y utilizables.
