# Spec Delta

## Purpose

Provides a high-conversion marketing landing page for the appointment booking SaaS, communicating value propositions across service verticals, feature capabilities, transparent pricing tiers, and direct onboarding touchpoints.

## ADDED Requirements

### Requirement: Hero Value Proposition and Call to Action
The landing page SHALL present a primary hero section that communicates the SaaS value proposition for multi-tenant appointment booking and allows prospective business owners to start for free without credit card.

#### Scenario: Hero section display
- **WHEN** a visitor loads the SaaS landing page
- **THEN** the system displays the headline, subheadline emphasizing quick launch under 10 minutes, a primary call-to-action button to register for free without credit card, and an illustrative preview of the public booking page.

#### Scenario: Start free CTA interaction
- **WHEN** a visitor clicks the primary "Empezar gratis" or "Get started free" call-to-action button
- **THEN** the system navigates the visitor to the registration flow.

### Requirement: Business Verticals and Templates Showcase
The landing page SHALL present an interactive showcase demonstrating how the SaaS adapts terminology, booking modes, and policies for specific business verticals including barberías, consultorios médicos, spas, and academias o clases.

#### Scenario: Switching business verticals
- **WHEN** a visitor selects a vertical tab (e.g. "Consultorio Médico" or "Barbería")
- **THEN** the preview dynamically updates to show tailored terminology ("Doctor"/"Paciente" vs "Barbero"/"Cliente"), booking mode rules, and example services.

### Requirement: Core Features and Value Highlights
The landing page SHALL showcase core platform capabilities derived from the product backlog, including real-time conflict-free availability, automated WhatsApp and email reminders, branded public links (`/b/<slug>`), and staff schedule management.

#### Scenario: Viewing core features
- **WHEN** a visitor scrolls to the features section
- **THEN** the system renders feature cards detailing 24/7 self-service scheduling, multi-channel notifications, team schedule orchestration, and business rules.

### Requirement: Pricing Tiers and Billing Toggle
The landing page SHALL present transparent pricing tiers comparing Free, Starter, Team, and Pro plans with an interactive toggle between monthly and annual billing periods.

#### Scenario: Monthly and annual billing toggle
- **WHEN** a visitor toggles between monthly and annual billing
- **THEN** the pricing cards recalculate displayed plan prices and highlight annual discount savings.

#### Scenario: Plan comparison detail
- **WHEN** a visitor inspects the pricing tiers
- **THEN** each plan card displays included staff seats, monthly booking limits or unlimited status, messaging credits, and platform fee percentages matching backlog specifications.

### Requirement: Frequently Asked Questions Accordion
The landing page SHALL include an expandable FAQ accordion addressing common onboarding, payment, notification, and operating questions.

#### Scenario: Expanding an FAQ item
- **WHEN** a visitor clicks on an FAQ question item
- **THEN** the item expands to reveal the detailed answer while maintaining accessible accordion keyboard navigation.

### Requirement: Navigation Header and Theme Switcher
The landing page SHALL provide a responsive navigation header with section anchor links, dark and light theme switching, and direct access to login and registration.

#### Scenario: Theme toggle from landing navigation
- **WHEN** a visitor toggles the theme button in the header
- **THEN** the landing page switches between light and dark modes applying semantic design tokens across all components.

#### Scenario: Mobile viewport navigation
- **WHEN** a visitor views the landing page on a mobile viewport
- **THEN** the header displays a mobile menu toggle that reveals navigation links and action buttons in a responsive drawer.
