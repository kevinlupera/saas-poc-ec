# Design

## Context

El proyecto es un monorepo pnpm con TypeScript que utiliza Nuxt 3 en `apps/web` y un Nuxt layer en `packages/ui` configurado con Tailwind CSS, Radix Vue y shadcn-vue.

Actualmente:
- `packages/ui/app/assets/css/tokens.css` define variables CSS estándar de shadcn (`--primary`, `--secondary`, etc.) pero carece de una exportación tipada estática para ser consumida fuera del navegador (como motores de plantillas de email HTML o librerías de estilos sin soporte de CSS variables dinámicas).
- En `packages/ui/app/components/ui/` solo está implementado el componente `button`.
- `apps/web/app/pages/index.vue` contiene únicamente un componente de prueba técnica de conectividad con la API.
- Las historias de usuario (`docs/historias-de-usuario.md` y `docs/historias-de-usuario-2.md`) y el backlog (`docs/backlog.md`) detallan la propuesta de valor del SaaS: agendamiento multi-tenant, plantillas por vertical (barberías, consultorios, spas, clases), planes (**Free**, **Starter**, **Team**, **Pro**), notificaciones por WhatsApp y reglas de reserva.

## Goals / Non-Goals

**Goals:**
- Diseñar una arquitectura de design tokens que funcione como fuente única de verdad para el Nuxt Layer (`@saas/ui`), la aplicación web (`apps/web`) y clientes estáticos (como emails transaccionales en HTML).
- Incorporar en `packages/ui` las primitivas de shadcn-vue requeridas para interfaces ricas de presentación: `Card`, `Badge`, `Accordion`, `Tabs`, `Separator`, `Avatar` y `Sheet`/`Dialog`.
- Diseñar la landing page en `apps/web` estructurada en secciones modulares: Navegación/Header con theme toggle, Hero con CTA, Selector de Verticales, Grid de Funcionalidades, Flujo de Pasos (Cómo funciona), Comparador de Precios (con toggle mensual/anual), Acordeón de FAQs y Footer corporativo.
- Garantizar accesibilidad semántica, modo claro/oscuro y total compatibilidad con las reglas de frontera del monorepo (`scripts/check-boundaries.mjs`).

**Non-Goals:**
- Implementación de lógica de backend o endpoints de reservas públicas (cubierto en `BE-25`).
- Flujo interactivo completo de reserva paso a paso del cliente `/b/<slug>` (cubierto en `FE-04`..`FE-08`).
- Pasarela de pago o suscripción con tarjeta (pertenece a F2 o flujo de billing posterior).

## Decisions

### 1. Arquitectura de Design Tokens (`packages/ui/tokens`)
- **Decisión**: Centralizar las definiciones de tokens de diseño en un módulo TypeScript dentro de `packages/ui` (`packages/ui/app/tokens/index.ts` o exportado en package) que contenga los valores base (paleta de colores primarios, neutros, semánticos, bordes y tipografía en formato HEX/RGB) y su mapeo semántico para temas claro y oscuro.
- **Implementación**:
  - Para la Web/Nuxt Layer: El archivo `tokens.css` se sincroniza/conecta con estas variables CSS consumidas por Tailwind.
  - Para Emails / Headless: Se exportan directamente constantes tipadas (`tokens.light.primary`, `tokens.dark.background`) que plantillas de email (ej. `@vue-email`, Nodemailer o MJML) pueden importar directamente sin depender de Tailwind ni de variables CSS del DOM.
- **Alternativa descartada**: Mantener solo `tokens.css` con variables CSS puras. Descartado porque clientes de correo (Outlook, Gmail) no soportan variables CSS nativas en inline styles.

### 2. División de Componentes: Primitivas vs Secciones Compuestas
- **Decisión**:
  - `packages/ui`: Únicamente componentes atómicos y primitivas de shadcn-vue (`Button`, `Card`, `Badge`, `Accordion`, `Tabs`, `Separator`, `Avatar`, `Sheet`).
  - `apps/web`: Componentes de dominio y composición de la landing page bajo `apps/web/app/components/landing/` (`LandingHero.vue`, `LandingVerticals.vue`, `LandingFeatures.vue`, `LandingPricing.vue`, `LandingFaq.vue`, `LandingNav.vue`, `LandingFooter.vue`).
- **Razón**: `packages/ui` se mantiene agnóstico al modelo de negocio de la landing, permitiendo que sus primitivas se reutilicen en el panel de administración (`FE-11..FE-24`), la consola (`FE-26..FE-29`) y la página de citas del cliente (`FE-04`).

### 3. Modelado de Datos de la Landing Page
- **Decisión**: Definir los datos estáticos de la landing en un archivo tipado `apps/web/app/data/landing.ts`:
  - **Verticales**: Barbería (1:1, terminología "Barbero/Corte"), Consultorio Médico (1:1, "Doctor/Paciente"), Spa & Belleza (1:1 con depósitos), Clases/Yoga (modalidad cupos grupales).
  - **Planes de Precios**:
    - Free ($0/mes): 1 empleado, hasta 20 citas/mes, página `/b/<slug>`, 2% comisión.
    - Starter ($15/mes): Citas ilimitadas, 1 empleado, 200 créditos WhatsApp/SMS, 1% comisión.
    - Team ($34/mes): Citas ilimitadas, 5 empleados ($7/empleado extra), 600 créditos, 0.5% comisión.
    - Pro ($69/mes): Citas ilimitadas, equipo ilimitado ($6/empleado extra), 1,200 créditos, 0% comisión.
  - **Toggle Anual**: Descuento visible equivalente a 2 meses gratis (≈ 17% a 20% descuento).

### 4. Soporte de Tema Claro / Oscuro
- **Decisión**: Implementar la gestión de tema mediante clase en el elemento `<html>` (`dark` / default) sincronizado con `localStorage` y preferencia del sistema, compatible con las clases de Tailwind y los tokens CSS de shadcn-vue.

## Risks / Trade-offs

- **[Riesgo] Divergencia entre tokens CSS y constantes para email**
  - *Mitigación*: Tipado estricto en TypeScript con validación cruzada; los valores HSL de `tokens.css` se documentan y derivan de la misma paleta HEX de tokens.
- **[Riesgo] Carga de scripts excesiva en la landing page**
  - *Mitigación*: Uso de primitivas ligeras de Radix Vue con renderizado SSR/estático nativo en Nuxt 3 para garantizar tiempos de carga menores a 1.5s en conexiones móviles.
- **[Riesgo] Incompatibilidad de clases Tailwind en componentes auto-importados**
  - *Mitigación*: `packages/ui/nuxt.config.ts` ya expone el hook `components:extend` para soportar tanto `Button` como `UiButton`, y Tailwind escanea las rutas de `packages/ui/app/`.
