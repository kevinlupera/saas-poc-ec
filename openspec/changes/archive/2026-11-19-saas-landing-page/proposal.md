# Proposal

## Why

El SaaS de agendamiento de citas cuenta con la base técnica monorepo (`apps/web` con Nuxt 3 y `packages/ui` como Nuxt layer con Tailwind y shadcn-vue), pero carece de una landing page comercial orientada a conversión. La página inicial actual (`apps/web/app/pages/index.vue`) es solo un placeholder de prueba técnica.

Para captar negocios (barberías, consultorios médicos, spas, estudios de clases y consultores) según las historias de usuario (`HU-01`, `HU-24`, `HU-25`), se requiere una landing page atractiva, responsiva y orientada a producto, con un sistema de design tokens reutilizable que pueda compartirse entre el frontend (`@saas/ui`), la web (`apps/web`) y futuros canales como plantillas de email.

## What Changes

- **Arquitectura de Design Tokens Compartibles (`ui/design-tokens`)**:
  - Estructuración de tokens de diseño semánticos (colores base, superficies, tipografía, bordes, radios y estados interactivos) para ser consumidos por Tailwind CSS en `packages/ui` y exportables como valores constantes (hex/rgb) para emails y otros consumidores que no procesan CSS variables en tiempo de ejecución.
  - Soporte robusto de temas claro y oscuro (`:root` y `.dark`).
- **Primitivas UI requeridas en `@saas/ui`**:
  - Incorporación en el Nuxt layer de los componentes shadcn-vue necesarios para la landing: `Card`, `Badge`, `Accordion`, `Switch` / `Tabs`, `Avatar`, `Separator` y `Sheet`/`Dialog` (para menú móvil).
- **Landing Page SaaS en `apps/web` (`marketing/landing-page`)**:
  - **Header / Navegación**: Logotipo, enlaces a secciones clave (Funcionalidades, Plantillas, Precios, FAQ), selector de tema (dark/light) y CTAs de acceso ("Iniciar sesión" / "Empezar gratis").
  - **Hero Section**: Propuesta de valor principal ("Publica tu página de reservas en 10 minutos"), llamado a la acción primario sin tarjeta de crédito (`HU-01`), vista previa visual de la página de reservas `/b/<slug>`.
  - **Showcase de Plantillas por Vertical**: Demostración interactiva de cómo el SaaS se adapta a Barberías, Consultorios, Spas y Clases (terminología y flujos adaptados).
  - **Sección de Funcionalidades**: Beneficios técnicos del backlog (disponibilidad en tiempo real sin solapamientos, recordatorios por WhatsApp y Email, link propio `/b/<slug>`, gestión de equipo y horarios).
  - **Cómo Funciona**: Pasos de onboarding (1. Elige tu vertical, 2. Configura servicios y horarios, 3. Comparte tu link).
  - **Sección de Precios (`HU-24`, `HU-25`)**: Selector mensual/anual con cálculo de descuento, comparativa de planes (**Free** $0, **Starter** $15/mes, **Team** $34/mes, **Pro** $69/mes) destacando límites de profesionales, citas, recordatorios y comisiones.
  - **Preguntas Frecuentes (FAQ)**: Acordeón interactivo respondiendo dudas frecuentes del backlog (cancelaciones, WhatsApp, límites del plan gratis, migración).
  - **Banner de Conversión (Final CTA)** y **Footer Corporativo**: Enlaces a soporte (`HU-28`), términos y privacidad (`HU-27`).

## Capabilities

### New Capabilities

- `marketing/landing-page`: Página de inicio comercial y de producto para el SaaS de citas en `apps/web`, que presenta la propuesta de valor, verticales, funcionalidades, comparador de planes y conversión de usuarios.
- `ui/design-tokens`: Sistema unificado de design tokens semánticos compatible con shadcn-vue en `packages/ui` y exportable para clientes externos como plantillas de email.

### Modified Capabilities

<!-- None: no previous capability specs exist in the repository yet. -->

## Impact

- **Código afectado**:
  - `packages/ui`: Exportación de tokens, ampliación de componentes UI de shadcn-vue (`Card`, `Badge`, `Accordion`, `Tabs`/`Switch`, `Avatar`, `Separator`, etc.).
  - `apps/web`: Reemplazo del placeholder en `app/pages/index.vue`, componentes de landing page bajo `app/components/landing/`, metadatos SEO y navegación responsiva.
- **Dependencias**:
  - Dependencias de Radix Vue / lucide-vue-next ya existentes en `packages/ui`. Posible adición de utilidades de animación o íconos adicionales si fuera necesario.
- **Riesgo**:
  - Nulo para backend y MCP. Solo afecta frontend (`apps/web` y `packages/ui`). Cumple estrictamente con las reglas de frontera del monorepo (`scripts/check-boundaries.mjs`).
