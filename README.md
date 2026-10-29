# Copilot Cost Inventory

[![Deploy to GitHub Pages](https://github.com/DanielRohregger/copilot-cost-inventory-api/actions/workflows/pages.yml/badge.svg)](https://github.com/DanielRohregger/copilot-cost-inventory-api/actions/workflows/pages.yml)

**Live viewer:** https://danielrohregger.github.io/copilot-cost-inventory-api/ · **Demo:** https://danielrohregger.github.io/copilot-cost-inventory-api/?demo

One-time, offline inventory of a tenant's Microsoft 365 Copilot costs, based on the [Copilot Cost Management API](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/admin-settings/cost-management/overview) (Microsoft Graph **beta**, `/copilot/costManagement`).

1. **Collector script**: an admin runs it once. It sends only `GET` requests and writes a single JSON file.
2. **Viewer** ([`index.html`](index.html)): a self-contained page that imports the JSON in the browser. It shows credit balances, spending policies, per-user consumption and API diagnostics. No server or live connection is needed, and nothing is uploaded. Both scripts are embedded as downloads.

Open it on [GitHub Pages](https://danielrohregger.github.io/copilot-cost-inventory-api/), or open `index.html` from disk. Add `?demo` to the URL, or click *Try demo data*, to load a synthetic Contoso tenant.

> [!WARNING]
> **The inventory file is sensitive.** It contains real display names, UPNs, group names and descriptions, per-user Copilot spend, and the email addresses of alert recipients. Treat it like any other confidential tenant report: do not post it publicly, attach it to tickets or chats outside your organization, or commit it to a repository. This repository ignores `CopilotCostInventory-*.json` in `.gitignore`; keep the default file name or add your own pattern. Delete the file when you no longer need it.

## Collect

| Platform | Script | Requirements |
| --- | --- | --- |
| Windows | [`scripts/Get-CopilotCostInventory.ps1`](scripts/Get-CopilotCostInventory.ps1) | Windows PowerShell 5.1 or PowerShell 7, plus the `Microsoft.Graph.Authentication` module (2.0.0 or later). If the module is missing, the script asks before installing it for the current user (no `-AllowClobber`); if you decline, it prints the install command and exits. Also runs on macOS/Linux with `pwsh`. |
| macOS | [`scripts/get-copilot-cost-inventory.sh`](scripts/get-copilot-cost-inventory.sh) | Nothing to install: uses zsh, `osascript` (JavaScript for Automation) and `curl`. |

```powershell
# Windows (browser sign-in; add -UseDeviceCode on machines without a browser)
cd $HOME\Downloads
powershell -ExecutionPolicy Bypass -File .\Get-CopilotCostInventory.ps1
.\Get-CopilotCostInventory.ps1 -TenantId contoso.onmicrosoft.com -UserScope AllUsers -MaxUsers 2000
```

```bash
# macOS (device-code sign-in: the page opens and the code is copied to the clipboard)
cd ~/Downloads
zsh get-copilot-cost-inventory.sh
zsh get-copilot-cost-inventory.sh --tenant contoso.onmicrosoft.com --user-scope all-users --max-users 2000
```

| PowerShell | macOS | Default | Meaning |
| --- | --- | --- | --- |
| `-TenantId` | `--tenant` | home tenant | Tenant ID or domain |
| `-UserScope PolicyMembers\|AllUsers\|None` | `--user-scope policy-members\|all-users\|none` | policy members | Which users get a balance diagnostic. The default is the transitive members of every group assigned to a policy. |
| `-MaxUsers` | `--max-users` | 500 | Upper bound for per-user requests (one request per user) |
| `-OutputPath` | `--output` | `CopilotCostInventory-<tenant>-<timestamp>.json` | Target file |
| `-UseDeviceCode` | (always) | | Device-code sign-in |
| `-AccessToken` or `CCI_ACCESS_TOKEN` env var | `CCI_ACCESS_TOKEN` env var | | Use an existing delegated Graph token instead of signing in |

Notes:
- If running a downloaded script fails, run `Unblock-File .\Get-CopilotCostInventory.ps1` (Windows Mark-of-the-Web). Calling the macOS script through `zsh` avoids Gatekeeper quarantine.
- If Conditional Access blocks the device code flow, use the PowerShell script, which uses browser sign-in (on macOS via `pwsh`).
- To pass a token, prefer the `CCI_ACCESS_TOKEN` environment variable over `-AccessToken`. A token typed on the command line ends up in your shell history.

## Permissions

Both scripts sign in with the first-party *Microsoft Graph Command Line Tools* client, so no app registration is needed. They request these delegated, read-only scopes:

`CopilotCostManagement.Read.All`, `CopilotCostManagement-Policy.Read.All`, `CopilotCostManagement-Assignment.Read.All`, `CopilotCostManagement-UserData.Read.All`, `GroupMember.Read.All`, `User.ReadBasic.All`, `User.Read`

An admin must grant consent the first time. The signed-in account needs a role that can read Copilot cost management data, for example Global Reader, Billing Administrator or AI Administrator.

### Admin consent stays in the tenant

When an admin ticks **Consent on behalf of your organization**, Entra stores a delegated permission grant for *Microsoft Graph Command Line Tools* (app ID `14d82eec-204b-4c2f-b7e8-296a70dab67e`). The scripts sign out at the end, but **the grant is not removed**. Any user who signs in to that app later (for example with Microsoft Graph PowerShell) can request these scopes without a new consent prompt. They still only get data that their own roles allow.

To remove the grant afterwards, use one of these options:

- **Entra admin center**: *Enterprise applications* › *Microsoft Graph Command Line Tools* › *Permissions*, then revoke the `CopilotCostManagement*` permissions. The same app is used by Microsoft Graph PowerShell, so only remove scopes nobody else relies on.
- **PowerShell**: removes only the four Copilot cost scopes and keeps the rest of the grant:

```powershell
Connect-MgGraph -Scopes DelegatedPermissionGrant.ReadWrite.All, Application.Read.All
$sp = (Invoke-MgGraphRequest GET "v1.0/servicePrincipals(appId='14d82eec-204b-4c2f-b7e8-296a70dab67e')?`$select=id").id
$remove = 'CopilotCostManagement.Read.All', 'CopilotCostManagement-Policy.Read.All',
          'CopilotCostManagement-Assignment.Read.All', 'CopilotCostManagement-UserData.Read.All'
foreach ($g in (Invoke-MgGraphRequest GET "v1.0/oauth2PermissionGrants?`$filter=clientId eq '$sp'").value) {
    $keep = @($g.scope -split ' ' | Where-Object { $_ -and $_ -notin $remove }) -join ' '
    if ($keep -eq $g.scope.Trim()) { continue }
    if ($keep) { Invoke-MgGraphRequest PATCH "v1.0/oauth2PermissionGrants/$($g.id)" -Body @{ scope = $keep } }
    else { Invoke-MgGraphRequest DELETE "v1.0/oauth2PermissionGrants/$($g.id)" }
}
Disconnect-MgGraph
```

## Calls

All requests are `GET` and go to Graph beta:

- `copilot/costManagement/getTenantCreditBalance`
- `copilot/costManagement/spendingPolicies`, plus for each policy:
  - `serviceSettings`
  - `emailThresholdSettings` and `emailThresholdSettings/recipients`
  - `microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups`
- `copilot/costManagement/userBalances/{id}?$expand=serviceBalances` for each user in scope
- Directory lookups:
  - `me` and `organization`
  - `users/{id}` to resolve policy authors
  - `groups/{id}/transitiveMembers/microsoft.graph.user` for assigned groups
  - `users` (only with the all-users scope)

Throttling (429/503) is retried using `Retry-After`. A `404` on optional sub-resources (alert settings) is tolerated and recorded.

## File format

The output is UTF-8 JSON with `"schema": "copilot-cost-inventory/v1"`. Both scripts produce the same structure:

| Field | Content |
| --- | --- |
| `generatedAt`, `generator`, `options` | Run metadata (script, version, platform, runtime, user scope) |
| `tenant`, `signedInUser` | Organization name, domains, tenant ID, the admin who ran it |
| `creditBalance.billingMethodBalances[]` | Purchased, consumed and remaining quantity per billing method (`prepaidCredits`, `payAsYouGo`) |
| `policies[]` | Raw policy, plus `serviceSettings`, `alertSettings`, `alertRecipients`, `assignedGroups` (with `transitiveUserMembers`), and resolved creator/modifier |
| `users[]` | User identity, `groupIds`, `balance` (per-service consumption, limits, access decision) or `error` |
| `warnings[]`, `errors[]`, `calls[]`, `durationMs` | Diagnostics: every call with its method, path, status and duration |

The file contains user names and UPNs, so handle it like other tenant reports.

## Viewer

- Import by drag and drop or file picker. Parsing happens locally (`FileReader`).
- Shows the tenant overview in a Microsoft Fluent 2 admin layout: five KPI tiles, a credit balance donut with billing-method split, consumption by service (donut and table), a per-user limit usage histogram, consumption by policy, top consumers split by service, an expandable spending policy table (services, alerts, recipients, groups), a searchable and filterable user table with per-service detail, and diagnostics (call log and raw JSON). Light and dark mode follow the system setting.
- The header switch shows amounts as **Credits, US $ or €**. 1 Copilot Credit = US$0.01 (pay-as-you-go list price) and €0.92 per US$1 (generic average rate). These are indicative values only; adjust `PRICING` in `src/core.js`.
- Exports: users as CSV (credits, USD and EUR columns), the JSON file, and print/PDF.

## Repository layout

| Path | Content |
| --- | --- |
| `index.html` | Generated, self-contained viewer (served by GitHub Pages) |
| `scripts/` | Collector scripts (PowerShell and macOS zsh) |
| `src/` | Viewer sources: template, styles and JavaScript |
| `assets/` | Service logos, inlined at build time |
| `build.mjs` | Build script that produces `index.html` |
| `PRODUCT.md`, `DESIGN.md` | Product and design notes |
| `.github/workflows/pages.yml` | Rebuilds and deploys the viewer to GitHub Pages on every push to `main` |

## Build

`index.html` is generated, so edit the sources and rebuild:

```bash
node build.mjs
```

`build.mjs` (Node, no dependencies) does the following:
- Inlines `src/styles.css` and `src/{core,demo,render,main}.js` into `src/template.html`.
- Inlines `assets/*.png` as data URIs, both in HTML attributes and in CSS `url()`.
- Embeds both scripts as base64 with their size and SHA-256.

Scripts must stay ASCII-only, because Windows PowerShell 5.1 reads BOM-less files as ANSI. The build enforces this.

Commit the regenerated `index.html` together with your source changes. The Pages workflow rebuilds it on every push to `main` and fails if the committed file is out of date.

## License

[MIT](LICENSE)

Microsoft, Copilot, SharePoint, OneDrive, Azure and their logos are trademarks of the Microsoft group of companies. They are used only to identify the services shown; this project is not affiliated with or endorsed by Microsoft.

Powered by [Copilot Coaching](https://copilot-coaching.de).
