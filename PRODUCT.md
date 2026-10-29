# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Microsoft 365 administrators in any organization who want a self-service audit of their tenant's Copilot credit spend. They hold a role that can read Copilot cost management data (Global Reader, Billing Administrator, AI Administrator), run a script once, and need answers without installing a product or sending data anywhere.

## Product Purpose

Copilot Cost Inventory is a free community project published on GitHub Pages. A read-only collector script (Windows PowerShell or macOS zsh) writes one JSON snapshot of the tenant through the Microsoft Graph beta Copilot Cost Management API. A single self-contained HTML page imports that file in the browser and shows credit balances, spending policies, per-user balances, and the diagnostics of every API call.

Success: an admin lands on the page, understands within seconds that nothing is uploaded, downloads and runs the script, imports the file, and can answer "how much did we spend, under which policy, and who is affected", with each number traceable to an API call.

## Positioning

- Nothing leaves the machine: the viewer is a static file that parses the JSON locally, and the collector only sends `GET` requests.
- Every figure is traceable to a raw Graph call (diagnostics, API log, raw JSON).
- Free, open, and auditable: the scripts are embedded with SHA-256 checksums and a source preview.

## Operating Context

- Admins reach the page from GitHub Pages or open `index.html` from disk; `?demo` loads a synthetic tenant.
- Typically run once per audit, on a laptop or external monitor, sometimes shared on screen with finance or IT colleagues, exported to CSV, or printed.
- The inventory file is confidential tenant data (names, UPNs, spend, recipient emails).

## Capabilities and Constraints

- Amounts are Copilot Credits; the viewer can show credits, US$ (1 credit = $0.01 list price) or EUR (generic 0.92 rate).
- The viewer must stay a single offline HTML file: no external fonts, scripts, or CDN requests. Inlined scripts are ASCII-only and assembled by `build.mjs`; `index.html` is generated.
- API terminology is kept: spending policy, period limit, per-user limit, billing method (prepaid credits, pay-as-you-go), service (`cowork`, `workIQ`, `sharePointCopilot`, `oneDriveCopilot`), alert thresholds, recipients, assigned groups.
- Keep it simple: one page, no accounts, no build step for users.

## Brand Commitments

- Name: "Copilot Cost Inventory".
- Visibly a community project by Copilot Coaching (copilot-coaching.de); the credit is more prominent than a small footer line.
- Microsoft product logos (`assets/logo-*.png`, `assets/graph.png`) identify the data source and the services: Copilot in the header and as favicon, Copilot Cowork, SharePoint, OneDrive, agents, Azure Subscriptions for pay-as-you-go, and Microsoft Graph. They are not the product's own brand.
- Category-standard professional admin dashboard in the Microsoft Fluent 2 idiom (Microsoft 365 admin center, Entra, Azure portal are the quality bar). No themed worlds, no decorative effects. Dense enough to show the whole tenant at once, livened with Fluent-style icons, several honest chart types (no invented time series), and restrained motion.

## Evidence on Hand

- Synthetic Contoso demo tenant (`src/demo.js`), labeled as demo data.
- Real collector scripts with SHA-256 checksums shown in the viewer.
- No users, testimonials, download counts, benchmarks, or pricing beyond the published Copilot Credit list price. Do not invent any.

## Product Principles

1. Truth over decoration: every number on screen maps to an API field or a stated conversion.
2. Privacy by construction: local-only processing is shown, not buried in a footnote.
3. Explain the API's real behaviour, including errors and gaps.
4. Simple enough to trust at first glance: one page, one script, one file.

## Accessibility & Inclusion

WCAG 2.2 AA, keyboard operation of all controls, respect for `prefers-reduced-motion`, readable print output.
