---
name: Copilot Cost Inventory
description: Microsoft Fluent 2 admin console for auditing Microsoft 365 Copilot credit spend from a local inventory file.
colors:
  brand: "#5c2a63"
  brand-hover: "#4e2354"
  brand-pressed: "#3d1b42"
  brand-tint: "#f5eef6"
  brand-fg: "#4e2354"
  brand-stroke: "#dbc6de"
  link: "#5c2a63"
  good: "#107c10"
  good-bg: "#f1faf1"
  warn: "#bc4b09"
  warn-bg: "#fff9f5"
  bad: "#c50f1f"
  bad-bg: "#fdf3f4"
  gold-bg: "#fbf4dc"
  gold-fg: "#6f5600"
  viz-1: "#5c2a63"
  viz-2: "#2aa0a4"
  viz-3: "#ca5010"
  viz-4: "#e3008c"
  viz-5: "#57811b"
  viz-6: "#ae8c00"
  viz-7: "#3a96dd"
  viz-8: "#9373c0"
  viz-rest: "#d2b7d6"
  canvas: "#f4f3f1"
  nav: "#ebe9e6"
  card: "#ffffff"
  subtle: "#efedea"
  track: "#ebe8e4"
  stroke: "#e2dfda"
  stroke-strong: "#d3cfc9"
  stroke-subtle: "#efedea"
  stroke-accessible: "#66625c"
  tooltip-bg: "#242424"
  tooltip-fg: "#ffffff"
  fg-1: "#242424"
  fg-2: "#424242"
  fg-3: "#616161"
typography:
  hero:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "36px"
  kpi-value:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "36px"
  section-title:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  card-title:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Segoe UI Variable Text, Segoe UI, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas, monospace"
    fontSize: "13px"
    lineHeight: "20px"
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.fg-1}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px 20px 20px"
  kpi-tile:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  icon-tile:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand}"
    rounded: "{rounded.md}"
    size: "32px"
  logo-tile:
    backgroundColor: "{colors.subtle}"
    rounded: "{rounded.md}"
    size: "32px"
  tag:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-fg}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "20px"
  nav-item-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.fg-1}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Copilot Cost Inventory

## Overview

**Creative North Star: "The Fluent Admin Console".** The inventory reads like a page in the Microsoft 365 admin center: a plum suite header, a collapsible left navigation rail, white cards on a warm off-white canvas, and dense tables. Admins already trust that idiom, so the tool feels native the moment a file is imported, while the plum accent and warm neutrals keep it from looking like a stock Microsoft page. Expression lives in precise details (icon tiles, a sliding nav indicator, charts that draw in once) and never in decoration.

The system is built for showing complicated data all at once. One scrolling page carries five KPIs, two chart rows, the policy table, the users table and diagnostics, with no ornament between them. Light and dark mode both follow `prefers-color-scheme`, and every token has a dark counterpart in `src/styles.css`.

**Key characteristics**

- Fluent 2 web structure with a custom palette: warm neutrals, one plum brand color (`#5c2a63`), semantic green, orange and red.
- System fonts only, with hierarchy from size and weight.
- Elevation through soft two-layer shadows instead of borders on cards.
- Motion is functional: data marks grow into place with a deceleration curve, then stay still.

## Colors

### Primary

- **Plum** (`brand`, `#5c2a63`): the suite header, primary buttons, the active nav indicator, the meter fill, the first chart series, focus underlines on inputs. In dark mode it shifts to a light orchid (`#cf9bd6`) for text and marks, while filled buttons use a mid plum (`#7a3a83`) so white text keeps 4.5:1 or better.
- **Brand Tint and Stroke** (`brand-tint`, `brand-stroke`): the info message bar, the "Recommended" tag, brand icon tiles, the selected table row and the recommended script card outline.

### Secondary

- **Visualization palette** (`viz-1` to `viz-8`): the per-service colors in donuts, stacked bars and legends, assigned in a fixed order so a service keeps its color across every chart. Plum, teal, burnt orange, magenta, green, gold, sky blue and lavender. Adjacent series alternate warm and cool so neighboring segments never blur together. `viz-rest` is the pale plum used for "remaining" segments.
- **Gold tile** (`gold-bg`, `gold-fg`): the icon tile of the "Consumed by evaluated users" KPI and JSON booleans.

### Tertiary

- **Semantic status** (`good`, `warn`, `bad` with their `-bg` fills): status glyphs, message bars, limit and error counts. Status is always icon plus text, never color alone.

### Neutral

- **Canvas, Nav and Card** (`canvas`, `nav`, `card`): three warm surface steps, with the `#f4f3f1` canvas behind cards, the slightly darker nav rail and white cards. Neutrals carry a faint warm cast to sit well beside plum; never mix in cool grays.
- **Foreground ramp** (`fg-1`, `fg-2`, `fg-3`): primary text, secondary labels and table headers, tertiary metadata. `fg-3` is the lightest text allowed on white.
- **Strokes** (`stroke-subtle`, `stroke`, `stroke-strong`, `stroke-accessible`): row dividers, card and bar rules, control borders and table header rules, and the bottom border of inputs.

### Named Rules

**The One Plum Rule.** Plum marks the suite header, the primary action, the current location and the first data series. Nothing else is plum, so the eye can find "where am I" and "what do I press" instantly.

**The Icon Plus Word Rule.** Every status shows a glyph and a word ("Limit exhausted", "Disabled"). A red dot alone is never a status.

**The True Logo Rule.** Microsoft product logos (Copilot in the header, Copilot Cowork, SharePoint, OneDrive, agents, Azure Subscriptions on the Pay-as-you-go KPI) appear in full color, bare or on a neutral `subtle` tile, and are never tinted, recolored or cropped. A disabled service shows its logo in grayscale at 45% opacity. Services without a logo (Work IQ, Code, unknown IDs) use a stroke glyph tinted with the service color.

## Typography

**Body font:** the system UI stack, led by Segoe UI Variable Text on Windows with San Francisco and Roboto as fallbacks.
**Mono font:** ui-monospace with Cascadia Mono first, used for commands, hashes, API paths and raw JSON.

**Character:** neutral and native. A single family keeps the tool feeling like part of the operating system; hierarchy comes from Fluent's type ramp.

### Hierarchy

- **Hero** (600, 32px/40px): landing headline only.
- **Page title** (600, 28px/36px): tenant name above the dashboard.
- **KPI value** (600, 28px/36px, tabular numerals; 22px/28px on mobile): the five headline numbers.
- **KPI caption** (600, 13px/18px, `fg-2`): the title beside each KPI icon tile.
- **Section title** (600, 20px/28px): landing and panel sections.
- **Card title** (600, 16px/22px): chart and table card headers, always paired with a 20px icon.
- **Body** (400, 14px/20px): table cells, descriptions, message bars.
- **Label** (600, 12px/16px): table headers, legend values, chart sub-heads.

### Named Rules

**The Tabular Numbers Rule.** Every number that can sit above another number uses tabular figures, so columns of credits line up by digit.

**The No Eyebrow Rule.** No uppercase tracked labels above headings. A card title plus an icon is enough.

## Layout

- **Shell:** a sticky 48px suite header with the 24px Copilot logo beside the product name, then a 232px left nav rail (60px when collapsed) and a content column (max 1680px) with 32px gutters (16px on mobile).
- **Dashboard rhythm:** a sticky command bar (unit switch, export, print), the page header (breadcrumbs, tenant name, meta), message bars, the KPI row, two chart rows, then full-width tables. Cards and KPIs sit 12px apart (8px between KPIs on mobile).
- **Chart rows:** a two-column row (balance, services) above a three-column row (histogram, policy bars, top consumers).
- **Breakpoints:** at 1360px or less, the KPIs go from 5 to 3 columns and the three-column row becomes two columns. At 1024px or less, the nav rail becomes a horizontal pivot bar and the two-column row stacks. At 760px or less, everything is one column and the KPIs use two columns.
- **Container queries:** chart cards reflow on their own width, not the viewport, so a card squeezed in a grid stacks its donut above its legend.
- **Wide tables** scroll horizontally inside their card and never widen the page.

**The All-At-Once Rule.** Prefer a denser grid over a longer page. A new metric joins an existing card or row before it earns a new section.

## Elevation & Depth

The surfaces are layered rather than flat: cards float on the canvas with Fluent's two-layer shadows, and borders are reserved for tables and controls.

### Shadow Vocabulary

- **Shadow 2** (`0 0 2px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.14)`): the active nav item and the unit switch thumb.
- **Shadow 4** (`0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.14)`): every card and KPI tile.
- **Shadow 16** (`0 0 2px rgba(0,0,0,.12), 0 8px 16px rgba(0,0,0,.14)`): transient surfaces such as the toast, the skip link and nav tooltips.
- **Shadow 64** (`0 0 8px rgba(0,0,0,.12), 0 32px 64px rgba(0,0,0,.14)`): the full-window drop overlay.

Dark mode doubles the shadow alpha because the surfaces are already dark.

### Named Rules

**The Shadow Not Border Rule.** Cards get a shadow and no border. Tables, inputs and message bars get a 1px stroke and no shadow.

## Shapes

- **Gently rounded controls** (4px): buttons, inputs, tags, message bars, nav items.
- **Soft cards** (8px): cards, KPI tiles, script cards.
- **Icon tiles** (6px, 32px square): the tinted glyph squares on KPIs and panel heads. Logo tiles use the neutral `subtle` fill instead of a tint.
- **Chart marks:** meters round their ends by 3px and stacked bars by 4px; histogram columns round only their top corners (4px); legend swatches are 10px squares with a 2px radius.
- **Fully rounded shapes** are reserved for avatars, count pills and the dropzone icon.

## Components

### Buttons

- **Primary:** plum fill with white 14px semibold text, 32px tall (40px for the landing call to action), 4px radius. Hover and pressed states step to darker plums.
- **Secondary:** white fill, 1px `stroke-strong` border, `fg-1` text. Hover fills with the subtle gray and darkens the border.
- **Subtle:** transparent, regular weight, with a brand-colored icon; used in the command bar ("Export users CSV", "Print"). On mobile the label collapses to the icon.
- **Focus:** a 2px outline with 2px offset in the foreground color, on every control.

### Chips

- **Tag:** a 20px tall label with a 4px radius, brand tint fill, 1px brand stroke and 12px semibold brand text, used for "Demo data" and "Recommended for this device".
- **Status:** an inline icon plus label (`good`, `warn`, `bad`, `skip`, `info`, `block`), with no fill.

### Cards / Containers

- **Card:** white, 8px radius, Shadow 4, 16px/20px padding. The header row has an icon, a 16px title and, optionally, a right-aligned `fg-3` caption naming the data source ("Evaluated users", "getTenantCreditBalance").
- **KPI tile:** an icon tile (the Pay-as-you-go KPI shows the Azure Subscriptions logo, because that spend is billed to an Azure subscription) and a two-line caption, a 28px value with the credit glyph, a `fg-2` sub-line and an optional meter or status list.
- **Message bar:** a 1px stroke box with a tinted fill per intent (info, success, warning, error), an icon on the left, and an optional action button on the right that wraps below the text on mobile.

### Inputs / Fields

- **Search and select:** 32px tall, 4px radius, a 1px `stroke-strong` border with a darker `stroke-accessible` bottom border. On focus the bottom edge turns into a 2px brand underline, following the Fluent input idiom.
- **Unit switch:** a three-segment control (Credits, US $, Euro). A white thumb with Shadow 2 slides under the selected segment.

### Navigation

- **Left rail:** warm `nav` surface, 14px items with 20px icons. The active item gets a white fill, semibold text, a brand-colored icon and a 3px brand indicator bar that slides between items (transform only).
- **Collapse toggle:** a hamburger button at the top of the rail collapses it to a 60px icon-only strip and back. Icons keep their exact position in both states, labels stay in the accessibility tree (visually hidden), and the choice persists in `localStorage` (`cci-nav`). The switch is a 180ms View Transitions crossfade; the grid column itself never animates, and reduced motion swaps instantly.
- **Tooltips:** in the collapsed rail every item shows its label in a dark tooltip (light in dark mode) to the right, after a 300ms hover delay or immediately on keyboard focus. The toggle always shows "Collapse navigation" or "Expand navigation".
- **Pivot (1024px or less):** the same links in a horizontal scrolling bar with a sliding underline indicator. The collapse toggle is hidden here.
- **Scroll spy** keeps the active item in sync with the section in view.

### Charts

- **Donut:** a 132px SVG ring with a thick stroke and an 18px semibold total or percentage in the center; segments use the viz palette.
- **Meter and stacked bar:** a 6px meter and an 8px stacked bar (12px for the tall variant) on the `track` gray, with segment fills and a 1px card-colored gap between segments.
- **Histogram:** columns with value labels above and band labels below.
- **Ranked bars:** a name, a sub-line and a value per row, with a stacked bar split by service below.
- **Reveal motion:** marks draw in once when the card enters the viewport (donut dasharray, bar `scaleX` and `scaleY`), staggered 60–90ms per mark with `cubic-bezier(0.1, 0.9, 0.2, 1)`. All motion is disabled under `prefers-reduced-motion`.

### Data tables

- 12px semibold `fg-2` headers over a `stroke-strong` rule; 14px rows with `stroke-subtle` dividers and 10px cell padding.
- Numeric columns align right and use tabular figures.
- Expandable rows have a chevron that rotates 90° and turns plum when open; the detail panel sits on a warm off-white with a definition grid.

## Do's and Don'ts

### Do:

- **Do** keep the shell recognizably Microsoft 365 admin in structure: a plum header, a collapsible rail and white cards on the warm canvas.
- **Do** add a 20px icon to every card title and nav item.
- **Do** give every new service the next unused viz color and keep it the same in every chart.
- **Do** map a new service to its Microsoft product logo in `SERVICE_LOGOS` (`src/core.js`) when one exists; otherwise give it an `s-<serviceId>` glyph in the sprite.
- **Do** animate only `transform`, `opacity` and SVG dash properties, with the deceleration curve.
- **Do** check every new color pair in both light and dark mode at 4.5:1 or better.

### Don't:

- **Don't** add gradients, glass blur, glow or decorative illustrations.
- **Don't** use colored side borders thicker than 1px to mark cards or rows.
- **Don't** add uppercase tracked eyebrow labels above headings.
- **Don't** use a descendant `svg` selector inside containers that show money values, because the credit glyph is an inline SVG. Use child selectors instead.
- **Don't** introduce a webfont; the system stack is part of the native feel.
