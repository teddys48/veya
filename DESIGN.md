---
name: Veya Music
description: Self-hosted NeoBrutalism web music player with instant search and tactile audio controls
colors:
  primary: "#ffe600"
  primary-hover: "#ffd600"
  primary-dark: "#ffd84d"
  primary-dark-hover: "#ffe477"
  accent-cyan: "#00e5ff"
  accent-pink: "#ff69b4"
  accent-green: "#a3e635"
  accent-orange: "#ff8400"
  neutral-bg: "#f5f3ef"
  neutral-fg: "#0f0f12"
  card-bg: "#ffffff"
  border: "#000000"
  shadow: "#000000"
  muted: "#374151"
  muted-bg: "#e5e7eb"
  dark-bg: "#171717"
  dark-fg: "#f5f5f0"
  dark-card: "#242424"
  dark-border: "#3d3d4e"
  dark-muted: "#a3a3a3"
  dark-muted-bg: "#2e2e2e"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-accent:
    backgroundColor: "{colors.accent-cyan}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.none}"
    padding: "2.4px 8px"
---

# Design System: Veya Music

## Overview

**Creative North Star: "The Tactile Tape Deck"**

Veya’s visual system is inspired by vintage modular synthesizers, physical cassette decks, and industrial audio consoles. Rather than pretending to be an ethereal, weightless digital layer, the interface is deliberately heavy, mechanical, and tactile. Every card, button, and slider acts like a piece of rack-mounted hardware—grounded by stark black architectural borders, zero-blur structural drop shadows, and razor-sharp rectangular silhouettes.

The aesthetic rejects soft corporate pastel gradients, floating translucent glassmorphism (frosted glass), diffuse blurred drop shadows, and pill-shaped rounded-full buttons. Interaction in Veya feels physical: buttons have tangible travel that physically depress on click, active navigation links latch into place with offset shadows, and technical readouts snap into crisp monospace tabular grids. High-voltage Electric Caution Yellow acts as the primary functional spark against an otherwise disciplined black, off-white, and dark-charcoal foundation.

**Key Characteristics:**
- **Zero-Blur Structural Depth**: Hard offset shadows (2px, 3px, 4px) with no blur provide structural elevation and simulate physical push-button depression.
- **Strictly Rectilinear Geometry**: 0px border radius across all cards, buttons, badges, and modals.
- **Heavy Architectural Framing**: High-contrast 2.5px to 3px solid borders delineate every functional boundary.
- **Mechanical Typography Pairing**: High-contrast Space Grotesk display headings paired with raw, functional monospace readouts for track metadata, durations, and system states.

## Colors

The palette is anchored by deep architectural ink and warm paper surfaces, punctuated by an electric high-voltage primary yellow and saturated synthesizer-inspired accents.

### Primary
- **Electric Caution Yellow** (`#ffe600` light / `#ffd84d` dark): High-visibility warning and action hue. Reserved exclusively for core audio controls (play/pause), active navigation selection, the brand identity badge, and scanner activation triggers.
- **Electric Caution Yellow Hover** (`#ffd600` light / `#ffe477` dark): Subtle saturation shift on hover states.

### Secondary
- **Cyber Cyan** (`#00e5ff` light / `#5bcefa` dark): Auxiliary action accent for secondary calls to action and secondary button variants.
- **Acid Pink** (`#ff69b4` light / `#ff6b9d` dark): Energetic highlight for favorites, genre tags, and special audio badges.
- **Radio Green** (`#a3e635` light / `#63d471` dark): Positive confirmation, active audio playback indicators, and success status indicators.
- **Signal Orange** (`#ff8400` light / `#ff914d` dark): Warning, alert states, and energetic genre tags.

### Neutral
- **Paper Light Canvas** (`#f5f3ef`): Warm, raw, unbleached paper background for light mode.
- **Card Surface White** (`#ffffff`): Pure crisp interior surface for cards and modals in light mode.
- **Onyx Dark Canvas** (`#171717`): Deep, non-reflective base canvas for dark mode.
- **Slate Surface Dark** (`#242424`): Elevated panel and card surface in dark mode.
- **Charcoal Border Dark** (`#3d3d4e`): Structural border tone providing sharp separation in dark mode.
- **Architectural Black** (`#000000`): Jet-black border and shadow color in light mode; shadow backing in dark mode.
- **Muted Slate Charcoal** (`#374151` light / `#a3a3a3` dark): WCAG AAA-compliant (8.9:1) secondary text for artist names, album info, and labels.
- **Muted Base Surface** (`#e5e7eb` light / `#2e2e2e` dark): Recessed background for header bars, table stripes, and inactive states.

### Named Rules
**The Physical Switch Rule.** Interactive elements must possess a thick border and hard offset shadow that physically depresses on click; primary yellow is reserved for active playback actions, active navigation states, and the primary brand mark. Secondary accents must never dilute primary audio actions.

## Typography

**Display Font:** Space Grotesk (fallback: `system-ui, -apple-system, sans-serif`)
**Body Font:** Space Grotesk (fallback: `system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

**Character:** Wide geometric apertures, tight tracking, and heavy weights evoke brutalist industrial signage and audio engineering panels, balanced by crisp tabular monospace technical readouts.

### Hierarchy
- **Display** (Weight 900, `2rem` / `32px`, line-height `1`, tracking `-0.05em`): Brand headers, page heroes, and expanded Now Playing titles.
- **Headline** (Weight 800, `1.5rem` / `24px`, line-height `1.2`, tracking `-0.025em`): Album titles, artist names on detail pages, and section headers.
- **Title** (Weight 700, `1.125rem` / `18px`, line-height `1.3`): Card titles, modal headers, and track titles in table rows.
- **Body** (Weight 500, `0.875rem` / `14px`, line-height `1.5`): General body text, descriptions, and artist metadata.
- **Label** (Weight 700, `0.75rem` / `12px`, letter-spacing `0.05em`, uppercase, monospace): Category chips, track durations, bitrates, audio formats, scanner statuses, and form input labels.

### Named Rules
**The Raw Readout Rule.** Track durations, bitrates, file extensions (`.flac`, `.mp3`), audio channels, scanner progress lines, and category badges must always render in uppercase monospace (`font-mono`) to guarantee tabular alignment and technical instrument feel.

## Layout

Veya uses a persistent viewport application layout designed for focused desktop and mobile audio control:
- **Desktop Architecture**: Fixed 64px width left `Sidebar` with sticky brand header and navigation links; sticky top 64px `Header` with search input and theme toggle; fluid scrollable main content area (`max-w-7xl mx-auto`); and a fixed 80px pinned bottom `PlayerBar`.
- **Mobile Architecture**: Collapsed desktop sidebar into a fixed 64px `MobileNav` bottom bar with touch-optimized icons, floating bottom `PlayerBar` docked above the mobile nav.
- **Spacing Rhythm**: Standard 8px baseline grid (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`). Grid items and table rows conform to strict proportional bounds.

## Elevation & Depth

Depth in Veya is exclusively physical and structural. Surfaces do not float above each other with fuzzy atmospheric halos; they extrude with hard vector drop shadows at a 90-degree bottom-right offset (`4px 4px 0px 0px`).

### Shadow Vocabulary
- **Container / Box** (`box-shadow: 4px 4px 0px 0px var(--shadow-color)`): Applied to `.neo-box` and `.neo-card` for resting surfaces.
- **Small Box / Badge** (`box-shadow: 2px 2px 0px 0px var(--shadow-color)`): Applied to `.neo-box-sm` and `.neo-badge` for chips and compact components.
- **Interactive Button Rest** (`box-shadow: 3px 3px 0px 0px var(--shadow-color)`): Default state of `.neo-btn`.
- **Interactive Button Hover** (`box-shadow: 5px 5px 0px 0px var(--shadow-color)`, `transform: translate(-2px, -2px)`): Lifted interactive state.
- **Interactive Button Active / Pressed** (`box-shadow: 1px 1px 0px 0px var(--shadow-color)`, `transform: translate(0px, 0px)`): Physical depression state when pressed.
- **Card Hover Elevation** (`box-shadow: 7px 7px 0px 0px var(--shadow-color)`, `transform: translate(-3px, -3px)`): Pronounced elevation lift on clickable album/artist cards.

### Named Rules
**The Hard Offset Rule.** Blurred shadows (`box-shadow` with blur-radius > `0px`) are strictly prohibited across all surfaces. Elevation is communicated solely through crisp vector offset shadows and coordinate translation.

## Shapes

- **Corner Language**: 100% rectilinear (`rounded-none` / `border-radius: 0px`). No rounded pills or circular cards.
- **Borders**: Continuous heavy borders delineate all boundaries:
  - Containers & Cards: `3px solid var(--border-color)`
  - Buttons & Inputs: `2.5px solid var(--border-color)`
  - Badges, Sliders & Small Elements: `2px solid var(--border-color)`
- **Silhouettes**: Bold, rectangular blocks that align cleanly into modular grids.

## Components

### Buttons
- **Shape**: Rectangular (`rounded-none`), `border: 2.5px solid var(--border-color)`, bold uppercase or title case font.
- **Primary**: Background `{colors.primary}`, text `#000000`, padding `8px 16px` (`md`).
- **Hover / Focus**: `transform: translate(-2px, -2px)` with shadow expanding to `5px 5px 0px 0px`. Focus displays no fuzzy outline; sharp contrast boundary remains intact.
- **Active State**: `transform: translate(0px, 0px)` with shadow collapsing to `1px 1px 0px 0px`.
- **Variants**:
  - `accent`: Cyber Cyan (`{colors.accent-cyan}`) for auxiliary actions.
  - `pink`: Acid Pink (`{colors.accent-pink}`) for celebratory or special actions.
  - `green`: Radio Green (`{colors.accent-green}`) for success/start actions.
  - `ghost`: Transparent/Card background (`{colors.card-bg}`) with standard border and text.
  - `outline`: Transparent background with heavy 2px border.
  - `danger`: Solid high-contrast red background with white text.

### Chips & Badges
- **Style**: `.neo-badge` with `border: 2px solid var(--border-color)`, `box-shadow: 2px 2px 0px 0px var(--shadow-color)`.
- **Typography**: `font-mono font-bold text-xs uppercase tracking-wider`.
- **Color Assignments**: Primary yellow default; variant badges in cyan, pink, green, and orange.

### Cards / Containers
- **Corner Style**: Square (`0px` radius).
- **Background**: `var(--card-bg)` (`#ffffff` light, `#242424` dark).
- **Shadow Strategy**: `4px 4px 0px 0px` resting; interactive cards (`.neo-card`) expand to `7px 7px` on hover with `-3px` translate.
- **Border**: `3px solid var(--border-color)`.
- **Internal Padding**: `p-4` (`16px`) default, `p-6` (`24px`) for large sections.

### Inputs / Fields
- **Style**: `.neo-input` with `border: 2.5px solid var(--border-color)`, `box-shadow: 3px 3px 0px 0px var(--shadow-color)`, `font-mono text-sm font-semibold`.
- **Focus**: `outline: none`, `transform: translate(-1px, -1px)`, shadow grows to `5px 5px 0px 0px var(--shadow-color)`.
- **Label**: Monospace uppercase bold label above input (`text-xs font-bold uppercase tracking-wider`).

### Navigation
- **Sidebar**: High-contrast black divider border (`border-r-3 border-black`).
- **NavLink**: Heavy 2px solid border. Active item receives Electric Yellow background, `#000000` text, `shadow-[3px_3px_0px_0px_#000]`, and slight horizontal nudge (`translate-x-1`). Inactive items have subtle hover shadow.
- **Brand Mark**: Prominent uppercase inverted radio icon with high-contrast text badge (`MUSIC PLAYER`).

### Signature Component: PlayerBar & Audio Dock
- **Architecture**: Persistent bottom shelf (`border-t-3 border-black bg-[var(--card-bg)]`) housing real-time scrubber slider, primary play/pause toggle with prominent physical shadow, volume slider, and track metadata display.
- **Scrubber Slider**: Custom high-contrast track with rectangular thumb and solid border.
- **Queue Drawer**: Slide-over panel featuring upcoming track order with non-destructive shuffle indicators and instant track jumping.

## Do's and Don'ts

### Do:
- **Do** use `rounded-none` (`border-radius: 0px`) for all buttons, cards, containers, inputs, and modals.
- **Do** preserve hard offset shadows (`box-shadow: Xpx Xpx 0px 0px var(--shadow-color)`) with zero blur on every elevated surface.
- **Do** render track durations, formats, bitrates, scanner outputs, and badges in uppercase monospace (`font-mono`).
- **Do** apply the physical depression state (`translate(0, 0)` with `1px` shadow) on `:active` button clicks.
- **Do** reserve Electric Caution Yellow (`#ffe600` / `#ffd84d`) for primary playback triggers, active navigation items, and high-priority actions.

### Don't:
- **Don't** use diffuse, blurred drop shadows (e.g. Tailwind `shadow-lg`, `shadow-md` with blur) anywhere in the application.
- **Don't** use rounded corners (`rounded-sm`, `rounded-md`, `rounded-full`) or pill-shaped buttons.
- **Don't** introduce translucent glassmorphism (`backdrop-blur`, semi-transparent frosted cards).
- **Don't** use soft pastel gradients or mesh gradients across cards or backgrounds.
- **Don't** lower text contrast below WCAG AAA on body and metadata text (`--muted` maintains 8.9:1 contrast).
