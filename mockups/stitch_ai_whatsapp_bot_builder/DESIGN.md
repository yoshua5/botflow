---
name: Proton Flow
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#424656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737687'
  outline-variant: '#c2c6d9'
  surface-tint: '#0053da'
  primary: '#004cca'
  on-primary: '#ffffff'
  primary-container: '#0062ff'
  on-primary-container: '#f3f3ff'
  inverse-primary: '#b4c5ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#4142ce'
  on-tertiary: '#ffffff'
  tertiary-container: '#5a5de8'
  on-tertiary-container: '#f5f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for a high-performance AI SaaS environment. The brand personality is **Intelligent, Efficient, and Approachable**. It balances the technical precision of artificial intelligence with a human-centric interface that reduces cognitive load.

The visual style is **Corporate / Modern Minimalism**. It prioritizes clarity through generous whitespace, a structured grid, and purposeful motion. The aesthetic avoids unnecessary decoration, using subtle depth and a refined color palette to guide the user through complex workflows. The goal is to evoke a sense of "calm power"—a platform that is sophisticated enough for developers but intuitive enough for business operators.

## Colors

The color strategy for this design system utilizes a high-contrast primary blue to establish authority and trust.

- **Primary (#0062FF):** Used for primary actions, active states, and brand recognition. It is a vibrant, "digital-first" blue.
- **Secondary (#F8FAFC):** A cool-toned light gray used for large surface areas to reduce eye strain and differentiate between content sections.
- **Accent (#6366F1):** An Indigo tint used sparingly for secondary calls-to-action (CTAs) and to highlight AI-driven features or "magic" moments.
- **Success (#10B981):** A bright green reserved strictly for "Active," "Connected," or "Completed" statuses.
- **Neutral (#0F172A):** A deep slate used for typography and high-contrast iconography to ensure maximum legibility.

## Typography

This design system uses a tri-font strategy to differentiate between intent and context:

1.  **Hanken Grotesk (Headlines):** A sharp, contemporary grotesque that provides a distinct "Tech SaaS" character to titles and marketing copy.
2.  **Inter (Body):** The workhorse for the interface. It is chosen for its exceptional readability in data-heavy dashboards and multi-line descriptions.
3.  **Geist (Labels/Code):** A technical, monospaced-adjacent font used for small labels, status indicators, and technical metadata, reinforcing the "Bot/AI" nature of the product.

All Spanish copy should maintain proper accentuation and character spacing, particularly for capital letters in labels.

## Layout & Spacing

The system follows a **Fixed-Fluid Hybrid Grid**. 
- **Desktop:** A 12-column grid with a maximum content width of 1440px. 24px gutters provide breathing room between data widgets.
- **Tablet:** An 8-column grid with 16px gutters.
- **Mobile:** A 4-column fluid grid.

Spacing follows an 8px linear scale. Use `md` (24px) for standard padding within cards and containers. Use `lg` (40px) to separate major vertical sections on the dashboard. Negative space is a functional element here; do not crowd components.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**.

1.  **Level 0 (Background):** Secondary color (#F8FAFC).
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border (#E2E8F0).
3.  **Level 2 (Hover/Active):** A soft, diffused shadow. Use a 12% opacity of the Neutral color with a 15px blur and 5px Y-offset.
4.  **Level 3 (Modals/Popovers):** A more pronounced shadow with a 20% opacity and 30px blur to create a clear "float" effect.

Avoid heavy black shadows. Shadows should feel like light being caught by a physical surface, slightly tinted by the background color.

## Shapes

The shape language is consistently **Rounded**. 

Standard components (buttons, inputs) use a 0.5rem (8px) radius. Larger containers, such as dashboard cards and bot-listing panels, use the `rounded-lg` (16px) or `rounded-xl` (24px) tokens to soften the technical nature of the UI.

Icons should feature rounded terminals and a 1.5px or 2px stroke weight to match the typography's visual weight.

## Components

- **Buttons:** Primary buttons use a solid Primary Blue background with white text. Secondary buttons use a transparent background with a 1px border of the Primary Blue.
- **Input Fields:** Use a 1px Slate-200 border. On focus, the border transitions to Primary Blue with a 3px soft outer glow (Focus Ring).
- **Cards:** White background, 1px border (#E2E8F0), and 24px internal padding. Title text should always be in Hanken Grotesk.
- **Chips/Badges:** Use Geist for the font. Status chips (Active/Inactive) should use low-opacity background fills of the status color (e.g., 10% Green) with high-contrast text.
- **Lists:** Clean rows with 16px vertical padding, separated by a 1px divider. Use "Chevron" icons to indicate drill-down actions.
- **Bot Listings:** Specialized cards that include a "Pulse" icon in the Success color to indicate a bot is currently running.