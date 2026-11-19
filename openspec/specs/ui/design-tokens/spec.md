# ui/design-tokens Specification

## Purpose
Defines a framework-agnostic semantic design token system in `@saas/tokens`, consumed by the `@saas/ui` layer, the web application, and downstream consumers such as transactional emails, PDFs and external templates.

## Requirements

### Requirement: Theme-Aware Semantic Design Tokens
The design token system SHALL define semantic color and surface tokens supporting light and dark themes using standard CSS custom properties for web runtime.

#### Scenario: Light and dark theme variable resolution
- **WHEN** the document root class is toggled between default and `.dark`
- **THEN** semantic tokens (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`) resolve to their respective mode color values.

### Requirement: Cross-Consumer Token Portability for Emails
The design token system SHALL expose static color and typography token definitions that can be consumed directly by email builders or non-CSS-variable renderers without relying on runtime Tailwind or CSS cascade.

#### Scenario: Token consumption in email or non-browser contexts
- **WHEN** an external consumer or transactional email template imports the token module
- **THEN** it receives direct color definitions in hex or rgb format without requiring CSS custom property parsing.

### Requirement: Framework-Agnostic Token Package
The design token system SHALL live in `packages/tokens`, exposing typed values via `@saas/tokens` and plain CSS custom properties via `@saas/tokens/css`, without Vue, Nuxt, Nitro or Tailwind dependencies.

#### Scenario: Independent token consumption
- **WHEN** a non-Nuxt consumer imports the token module or its CSS export
- **THEN** it can use the tokens without loading the UI layer or processing Tailwind directives.

#### Scenario: CSS and TypeScript parity
- **WHEN** token definitions change
- **THEN** the CSS can be regenerated from the TypeScript definitions and automated checks detect stale CSS.

### Requirement: shadcn-vue Primitive Integration
Components distributed by `packages/ui` SHALL consume semantic tokens through standard Tailwind utilities and shadcn-vue conventions.

#### Scenario: Component rendering with semantic tokens
- **WHEN** a UI component (such as Button, Card, Badge, or Accordion) renders on a page
- **THEN** it derives its background, text, border, and focus states from the configured semantic design tokens.
