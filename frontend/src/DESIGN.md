---
name: Futuristic Industrial
colors:
  surface: '#15121b'
  surface-dim: '#15121b'
  surface-bright: '#3b3742'
  surface-container-lowest: '#0f0d15'
  surface-container-low: '#1d1a23'
  surface-container: '#211e27'
  surface-container-high: '#2c2832'
  surface-container-highest: '#37333d'
  on-surface: '#e7e0ed'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e7e0ed'
  inverse-on-surface: '#322f39'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb869'
  on-tertiary: '#482900'
  tertiary-container: '#ca801e'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#15121b'
  on-background: '#e7e0ed'
  surface-variant: '#37333d'
typography:
  display-numeric:
    fontFamily: Space Grotesk
    fontSize: 42px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Space Grotesk
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
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
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
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  edge_margin: 20px
---

## Brand & Style

The design system is engineered for the high-stakes environment of modern logistics, blending the precision of fintech interfaces with the rugged utility of industrial hardware. It evokes a sense of "Operational Intelligence"—the feeling that the user is commanding a high-performance machine rather than just managing a database.

The aesthetic utilizes a **Minimalist-Glassmorphic** hybrid. It relies on structural clarity and whitespace to ensure speed of use, while employing subtle glow effects and translucent layers to signal a forward-thinking, "heads-up display" (HUD) experience. The emotional response should be one of absolute control, technical superiority, and frictionless efficiency.

## Colors

The color palette is built on a foundation of high-contrast functionalism. 

In **Dark Mode**, the "Graphite Black" background provides a low-fatigue canvas that makes the "Electric Violet" primary actions pop with technical urgency. "Neon Teal" is reserved for successful scans and positive data trends, while "Soft Amber" provides high-visibility warnings without causing alarm fatigue.

In **Light Mode**, the palette shifts to a "Soft Off-White" to maintain clarity under bright warehouse lighting. The primary violet retains its saturation to ensure accessibility, while cards use subtle border-strokes rather than heavy shadows to maintain a clean, industrial look.

## Typography

This design system utilizes a dual-font strategy to balance character with readability. **Space Grotesk** is used for headlines and large numeric displays, providing a geometric, technical feel that mirrors industrial labeling. 

**Inter** handles all functional UI text and body copy. Its neutral, systematic construction ensures that complex SKU numbers and inventory lists remain legible at small sizes or during rapid movement. Large numeric highlights (Display-Numeric) are a signature element, used to pull the user's eye toward critical stock levels and quantities instantly.

## Layout & Spacing

The layout follows a strict **Fluid Grid** model optimized for one-handed mobile operation. A 4-column grid is standard, with a 20px safe-area margin to ensure touch targets are not lost at the edges of bezel-less displays.

Spacing is governed by a 4px base unit. Internal card padding is consistently set to 16px (md) to maintain a dense but breathable information hierarchy. Horizontal gutters between card elements are kept at 16px to maximize screen real estate for data columns.

## Elevation & Depth

Hierarchy is conveyed through **Tonal Layers** supplemented by light-based effects. 

In Dark Mode, elevation is not just about brightness but about "glow." Elevated cards feature a 1px inner stroke in a slightly lighter gray and a soft, extremely low-opacity violet outer diffusion (glow) to suggest they are powered-on modules. 

In Light Mode, elevation uses high-dispersion, low-opacity neutral shadows (0% black at 12px blur) to create a sense of floating layers. No heavy borders are used; depth is defined by the contrast between the card surface and the background.

## Shapes

The design system employs a **Rounded** shape language (Level 2). This 0.5rem (8px) base radius provides a modern, premium feel while retaining enough structural rigidity to feel "industrial." 

Interactive elements like primary buttons use the `rounded-lg` (16px) or `rounded-xl` (24px) tokens to make them feel more "pressable" and distinct from the more angular data containers.

## Components

- **Action Buttons:** Primary buttons are solid Electric Violet with white text. They should have a subtle "outer glow" in dark mode. Secondary buttons use a ghost style with a 1.5px border.
- **Inventory Cards:** Designed as the primary data vessel. They include a "Scan-Status Indicator" stripe on the left edge—Teal for verified, Amber for discrepancy.
- **Status Chips:** Small, pill-shaped indicators using high-saturation backgrounds with high-contrast text. Labels are always in `label-caps`.
- **Input Fields:** Designed to look like technical readouts. Use a dark-gray background in both modes with a bottom-only 2px focus border in Primary Violet.
- **Numeric Highlighters:** Specialized components for stock counts. They use the `display-numeric` type scale and are often paired with a "delta" indicator (up/down arrow) for stock movement.
- **Scanning HUD:** A unique component overlay that uses corner-bracket frames and a pulsing Teal line to simulate a hardware laser scanner interface.