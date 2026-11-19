# Tasks

## 1. Design Tokens Architecture

- [x] 1.1 Implement typed design tokens module in `packages/ui/app/tokens/index.ts` defining base palettes, semantic light/dark colors (in HEX and HSL), typography, and radii, with static exports suitable for email templates. Verify with `pnpm --filter @saas/ui typecheck`.
- [x] 1.2 Update `packages/ui/app/assets/css/tokens.css` and `packages/ui/tailwind.config.ts` to ensure full parity with the semantic token definitions and dark theme overrides. Verify CSS variables load in Nuxt layer.

## 2. shadcn-vue UI Primitives in `@saas/ui`

- [x] 2.1 Implement `Card` primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) in `packages/ui/app/components/ui/card/`. Verify auto-import and rendering.
- [x] 2.2 Implement `Badge` primitive with default, secondary, outline, and destructive variants in `packages/ui/app/components/ui/badge/`. Verify variant classes match tokens.
- [x] 2.3 Implement `Accordion` primitives (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`) using Radix Vue in `packages/ui/app/components/ui/accordion/`. Verify collapsible behavior.
- [x] 2.4 Implement `Tabs` and `Separator` primitives in `packages/ui/app/components/ui/`. Verify tab switching and divider rendering.

## 3. Landing Page Data and Composable State

- [x] 3.1 Create `apps/web/app/data/landing.ts` with strongly-typed data structures for verticals (Barbería, Consultorio, Spa, Clases), features, pricing tiers (Free, Starter, Team, Pro with monthly/annual values), and FAQ items. Verify types compile.
- [x] 3.2 Create theme switcher composable `apps/web/app/composables/useTheme.ts` to manage light/dark class on `<html>` with persistence. Verify toggle modifies root class.

## 4. Landing Page Sections in `apps/web`

- [x] 4.1 Implement `LandingNav.vue` with logo, navigation links, theme toggle, and mobile responsive menu. Verify responsive behavior across viewport widths.
- [x] 4.2 Implement `LandingHero.vue` highlighting "Publica tu página de reservas en 10 minutos", primary CTA button to start free, and visual booking link preview `/b/<slug>`. Verify CTA interaction.
- [x] 4.3 Implement `LandingVerticals.vue` showcasing vertical templates with dynamic switching of terminology ("Barbero" vs "Doctor"), sample services, and booking rules. Verify tab selection updates content.
- [x] 4.4 Implement `LandingFeatures.vue` and `LandingHowItWorks.vue` presenting real-time availability, WhatsApp reminders, and the 3-step setup flow. Verify feature cards display semantic token styles.
- [x] 4.5 Implement `LandingPricing.vue` with monthly/annual billing toggle, plan limits (citas, profesionales, créditos WhatsApp, comisión), and plan selection CTAs. Verify price calculation on toggle.
- [x] 4.6 Implement `LandingFaq.vue` using Accordion, `LandingCta.vue` conversion banner, and `LandingFooter.vue` with legal links (`/terms`, `/privacy`, `/support`). Verify accordion expansion.

## 5. Integration and Verification

- [x] 5.1 Compose all landing sections in `apps/web/app/pages/index.vue` and configure SEO meta tags with `useSeoMeta`. Verify page renders completely in `apps/web`.
- [x] 5.2 Run monorepo validation via `pnpm check:boundaries` and `pnpm check`. Verify zero boundary violations and 100% clean typecheck.
