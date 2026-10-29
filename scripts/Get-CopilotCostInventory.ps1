<#
.SYNOPSIS
    Read-only Microsoft 365 Copilot cost inventory for one tenant.

.DESCRIPTION
    Signs in as an administrator and runs only GET requests against the Microsoft Graph
    Copilot Cost Management API (beta, /copilot/costManagement):

      - tenant credit balance per billing method
      - every spending policy with its service settings, email alert thresholds,
        alert recipients and assigned groups (with transitive user member counts)
      - per-user balance diagnostics (consumption, limits, access decision per service)

    The result is written to one JSON file (schema "copilot-cost-inventory/v1") that the
    Copilot Cost Inventory viewer (index.html) imports offline. Nothing is changed in the tenant.

    Works with Windows PowerShell 5.1 and PowerShell 7 (Windows, macOS, Linux).
    Requires the Microsoft.Graph.Authentication module (installed for the current user if missing).

.PARAMETER TenantId
    Tenant ID or domain, e.g. contoso.onmicrosoft.com. Defaults to the home tenant of the account.

.PARAMETER OutputPath
    Target JSON file. Defaults to .\CopilotCostInventory-<tenant>-<timestamp>.json

.PARAMETER UserScope
    Which users get a balance diagnostic:
      PolicyMembers (default) - transitive user members of all groups assigned to a policy
      AllUsers                - every member user in the directory
      None                    - skip user balances

.PARAMETER MaxUsers
    Upper bound for user balance lookups (one request per user). Default 500.

.PARAMETER UseDeviceCode
    Sign in with a device code instead of the interactive browser.

.PARAMETER AccessToken
    Use an existing delegated Graph access token instead of signing in (automation).
    Defaults to the CCI_ACCESS_TOKEN environment variable. Prefer the environment variable:
    a token typed on the command line ends up in the shell history.

.EXAMPLE
    .\Get-CopilotCostInventory.ps1

.EXAMPLE
    .\Get-CopilotCostInventory.ps1 -TenantId contoso.onmicrosoft.com -UserScope AllUsers -MaxUsers 2000

.NOTES
    Delegated permissions (read-only): CopilotCostManagement.Read.All,
    CopilotCostManagement-Policy.Read.All, CopilotCostManagement-Assignment.Read.All,
    CopilotCostManagement-UserData.Read.All, GroupMember.Read.All, User.ReadBasic.All, User.Read.
    Roles: e.g. Global Reader, Billing Administrator, AI Administrator.
    The first sign-in asks an admin to consent to these scopes for the Microsoft Graph Command
    Line Tools app; that consent stays in the tenant after the run (see README to remove it).
    The output file contains names, UPNs, group names, per-user spend and alert recipient
    addresses. Treat it as confidential: do not share it publicly or commit it.
    Powered by Copilot Coaching - https://copilot-coaching.de
#>
[CmdletBinding()]
param(
    [string]$TenantId,
    [string]$OutputPath,
    [ValidateSet('PolicyMembers', 'AllUsers', 'None')]
    [string]$UserScope = 'PolicyMembers',
    [ValidateRange(0, 100000)]
    [int]$MaxUsers = 500,
    [switch]$UseDeviceCode,
    [string]$AccessToken = $env:CCI_ACCESS_TOKEN
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$ScriptVersion = '1.1.0'
$GraphBase = 'https://graph.microsoft.com/beta/'
$CM = 'copilot/costManagement'
$Scopes = @(
    'User.Read',
    'User.ReadBasic.All',
    'GroupMember.Read.All',
    'CopilotCostManagement.Read.All',
    'CopilotCostManagement-Policy.Read.All',
    'CopilotCostManagement-Assignment.Read.All',
    'CopilotCostManagement-UserData.Read.All'
)

$Calls = New-Object System.Collections.Generic.List[object]
$Errors = New-Object System.Collections.Generic.List[object]
$Warnings = New-Object System.Collections.Generic.List[string]
$Started = Get-Date

function Write-Step([string]$Text) { Write-Host "  > $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "    $Text" -ForegroundColor DarkGray }

# ---- Module + sign-in ----------------------------------------------------------------------
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph.Authentication | Where-Object { $_.Version -ge [version]'2.0.0' })) {
    $installCmd = 'Install-Module Microsoft.Graph.Authentication -Scope CurrentUser -MinimumVersion 2.0.0'
    Write-Host 'This script needs the PowerShell module Microsoft.Graph.Authentication (2.0.0 or later).' -ForegroundColor Yellow
    $answer = ''
    try { $answer = Read-Host 'Install it now from the PowerShell Gallery for the current user? [y/N]' } catch { $answer = '' }
    if ($answer -notmatch '^(y|yes|j|ja)$') {
        Write-Host 'Not installed. Install it yourself and run the script again:' -ForegroundColor Yellow
        Write-Host "  $installCmd"
        exit 1
    }
    if ($PSVersionTable.PSVersion.Major -lt 6) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    }
    Install-Module Microsoft.Graph.Authentication -Scope CurrentUser -MinimumVersion 2.0.0 -Repository PSGallery -Force
}
Import-Module Microsoft.Graph.Authentication -MinimumVersion 2.0.0

Write-Host ''
Write-Host 'Copilot Cost Inventory' -ForegroundColor Magenta -NoNewline
Write-Host "  v$ScriptVersion  (read-only)" -ForegroundColor DarkGray
Write-Host ''

if ($AccessToken) {
    Connect-MgGraph -AccessToken (ConvertTo-SecureString $AccessToken -AsPlainText -Force) -NoWelcome | Out-Null
}
else {
    $connect = @{ Scopes = $Scopes; NoWelcome = $true; ContextScope = 'Process' }
    if ($TenantId) { $connect.TenantId = $TenantId }
    if ($UseDeviceCode) { $connect.UseDeviceCode = $true }
    Connect-MgGraph @connect | Out-Null
}

# ---- Graph helpers -------------------------------------------------------------------------
function Get-Prop($Object, [string]$Name) {
    if ($null -ne $Object -and $Object.PSObject.Properties[$Name]) { return $Object.$Name }
    return $null
}

function Remove-ODataContext($Object) {
    if ($null -eq $Object -or $Object -isnot [System.Management.Automation.PSCustomObject]) { return $Object }
    foreach ($name in @($Object.PSObject.Properties | Where-Object { $_.Name -like '*@odata.context' } | ForEach-Object { $_.Name })) {
        $Object.PSObject.Properties.Remove($name)
    }
    return $Object
}

function Invoke-Graph {
    # Returns @{ Status; Body } and never throws for HTTP errors. Retries 429/5xx with Retry-After.
    param([string]$Path)
    if ($Path -match '^https://') { $uri = $Path } else { $uri = $GraphBase + $Path }
    $attempt = 0
    while ($true) {
        $attempt++
        $status = 0
        $headers = $null
        $timer = [Diagnostics.Stopwatch]::StartNew()
        try {
            $body = Invoke-MgGraphRequest -Method GET -Uri $uri -OutputType PSObject -SkipHttpErrorCheck `
                -StatusCodeVariable status -ResponseHeadersVariable headers
        }
        catch {
            $body = [pscustomobject]@{ error = [pscustomobject]@{ code = 'clientError'; message = $_.Exception.Message } }
            $status = 0
        }
        $timer.Stop()
        $relative = $uri
        if ($uri.StartsWith($GraphBase)) { $relative = $uri.Substring($GraphBase.Length) }
        $Calls.Add([ordered]@{ method = 'GET'; path = $relative; status = [int]$status; ms = [int]$timer.ElapsedMilliseconds })
        $retryable = ($status -eq 429 -or $status -eq 502 -or $status -eq 503 -or $status -eq 504 -or $status -eq 0)
        if ($retryable -and $attempt -lt 4) {
            $wait = [Math]::Pow(2, $attempt)
            if ($headers -and $headers['Retry-After']) {
                $parsed = 0
                if ([int]::TryParse([string](@($headers['Retry-After'])[0]), [ref]$parsed)) { $wait = [Math]::Min(60, $parsed) }
            }
            Start-Sleep -Seconds $wait
            continue
        }
        return @{ Status = [int]$status; Body = (Remove-ODataContext $body) }
    }
}

function New-ErrorInfo($Response) {
    $err = Get-Prop $Response.Body 'error'
    $inner = Get-Prop $err 'innerError'
    return [ordered]@{ status = $Response.Status; code = (Get-Prop $err 'code'); innerCode = (Get-Prop $inner 'code'); message = (Get-Prop $err 'message') }
}

function Add-GraphError([string]$Path, $Response, [string]$Context) {
    $info = New-ErrorInfo $Response
    $info['context'] = $Context
    $info['path'] = $Path
    $Errors.Add($info)
    Write-Host "    ! $Context -> HTTP $($info.status) $($info.code) $($info.innerCode)" -ForegroundColor Yellow
}

function Get-GraphObject([string]$Path, [string]$Context, [int[]]$Tolerate = @()) {
    $r = Invoke-Graph $Path
    if ($r.Status -ge 200 -and $r.Status -lt 300) { return $r.Body }
    if ($Tolerate -notcontains $r.Status) { Add-GraphError $Path $r $Context }
    return $null
}

function Get-GraphCollection([string]$Path, [string]$Context, [int[]]$Tolerate = @()) {
    # Follows @odata.nextLink. Returns a List (empty on error).
    $items = New-Object System.Collections.Generic.List[object]
    $next = $Path
    while ($next) {
        $r = Invoke-Graph $next
        if ($r.Status -lt 200 -or $r.Status -ge 300) {
            if ($Tolerate -notcontains $r.Status) { Add-GraphError $next $r $Context }
            break
        }
        foreach ($v in @(Get-Prop $r.Body 'value')) { if ($null -ne $v) { $items.Add($v) } }
        $next = Get-Prop $r.Body '@odata.nextLink'
    }
    return , $items
}

function New-UserSummary($User) {
    return [ordered]@{ id = $User.id; displayName = (Get-Prop $User 'displayName'); userPrincipalName = (Get-Prop $User 'userPrincipalName'); userType = (Get-Prop $User 'userType') }
}

$IdentityCache = @{}
function Resolve-Identity($IdentitySet) {
    # createdBy/lastModifiedBy come back with displayName = null, so resolve each user once.
    $user = Get-Prop $IdentitySet 'user'
    $app = Get-Prop $IdentitySet 'application'
    $userId = Get-Prop $user 'id'
    if ($userId) {
        if (-not $IdentityCache.ContainsKey($userId)) {
            $u = Get-GraphObject "users/$($userId)?`$select=displayName,userPrincipalName" 'Resolve policy author' @(403, 404)
            $IdentityCache[$userId] = [ordered]@{ id = $userId; displayName = (Get-Prop $u 'displayName'); userPrincipalName = (Get-Prop $u 'userPrincipalName') }
        }
        return $IdentityCache[$userId]
    }
    $appId = Get-Prop $app 'id'
    if ($appId) { return [ordered]@{ id = $appId; displayName = (Get-Prop $app 'displayName'); userPrincipalName = $null; isApplication = $true } }
    return $null
}

# ---- Context -------------------------------------------------------------------------------
Write-Step 'Tenant and signed-in account'
$me = Get-GraphObject 'me?$select=id,displayName,userPrincipalName' 'Signed-in user'
$org = Get-GraphObject 'organization?$select=id,displayName,verifiedDomains' 'Tenant'
$tenant = [ordered]@{ id = $null; displayName = $null; defaultDomain = $null; initialDomain = $null }
$orgs = @(Get-Prop $org 'value')
if ($orgs.Count -gt 0 -and $orgs[0]) {
    $tenant.id = $orgs[0].id
    $tenant.displayName = $orgs[0].displayName
    foreach ($d in @($orgs[0].verifiedDomains)) {
        if ($d.isDefault) { $tenant.defaultDomain = $d.name }
        if ($d.isInitial) { $tenant.initialDomain = $d.name }
    }
}
if (-not $tenant.id) {
    $ctx = Get-MgContext
    if ($ctx) { $tenant.id = $ctx.TenantId }
}
Write-Ok "$($tenant.displayName) ($($tenant.defaultDomain)) as $(Get-Prop $me 'userPrincipalName')"

# ---- Tenant credit balance ------------------------------------------------------------------
Write-Step 'Tenant credit balance'
$balance = Get-GraphObject "$CM/getTenantCreditBalance" 'Tenant credit balance'
if ($balance) { Write-Ok "$(@(Get-Prop $balance 'billingMethodBalances').Count) billing method(s)" }

# ---- Spending policies ---------------------------------------------------------------------
Write-Step 'Spending policies'
$policyList = Get-GraphCollection "$CM/spendingPolicies" 'List spending policies'
Write-Ok "$($policyList.Count) policy(ies)"

$groupMembers = @{}          # groupId -> List of users
$userGroups = @{}            # userId  -> List of groupIds
$userById = [ordered]@{}     # userId  -> user summary
$policies = New-Object System.Collections.Generic.List[object]
$hasAllUsersPolicy = $false

foreach ($p in $policyList) {
    $base = "$CM/spendingPolicies/$($p.id)"
    $name = Get-Prop $p 'displayName'
    Write-Ok "- $name [$(Get-Prop $p 'status')]"
    $isSelected = ([string](Get-Prop $p '@odata.type')) -like '*selectedGroupsSpendingPolicy'
    if (-not $isSelected) { $hasAllUsersPolicy = $true }

    $settings = Get-GraphCollection "$base/serviceSettings" "Service settings of '$name'"
    $alerts = Get-GraphObject "$base/emailThresholdSettings" "Alert settings of '$name'" @(404)
    $recipients = New-Object System.Collections.Generic.List[object]
    foreach ($rcp in (Get-GraphCollection "$base/emailThresholdSettings/recipients" "Alert recipients of '$name'" @(404))) {
        $recipients.Add([ordered]@{ id = (Get-Prop $rcp 'id'); displayName = (Get-Prop $rcp 'displayName'); userPrincipalName = (Get-Prop $rcp 'userPrincipalName'); mail = (Get-Prop $rcp 'mail') })
    }

    $groups = New-Object System.Collections.Generic.List[object]
    if ($isSelected) {
        foreach ($g in (Get-GraphCollection "$base/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups" "Assigned groups of '$name'")) {
            if (-not $groupMembers.ContainsKey($g.id)) {
                $members = Get-GraphCollection "groups/$($g.id)/transitiveMembers/microsoft.graph.user?`$select=id,displayName,userPrincipalName,userType&`$top=999" "Members of group '$(Get-Prop $g 'displayName')'"
                foreach ($m in $members) {
                    if (-not $userById.Contains($m.id)) { $userById[$m.id] = New-UserSummary $m }
                    if (-not $userGroups.ContainsKey($m.id)) { $userGroups[$m.id] = New-Object System.Collections.Generic.List[string] }
                    if (-not $userGroups[$m.id].Contains($g.id)) { $userGroups[$m.id].Add($g.id) }
                }
                $groupMembers[$g.id] = $members
            }
            $groups.Add([ordered]@{
                    id                    = $g.id
                    displayName           = (Get-Prop $g 'displayName')
                    description           = (Get-Prop $g 'description')
                    mail                  = (Get-Prop $g 'mail')
                    securityEnabled       = (Get-Prop $g 'securityEnabled')
                    groupTypes            = @(Get-Prop $g 'groupTypes')
                    membershipRule        = (Get-Prop $g 'membershipRule')
                    transitiveUserMembers = $groupMembers[$g.id].Count
                })
        }
    }

    $policy = [ordered]@{}
    foreach ($prop in $p.PSObject.Properties) { $policy[$prop.Name] = $prop.Value }
    $policy['createdByResolved'] = Resolve-Identity (Get-Prop $p 'createdBy')
    $policy['lastModifiedByResolved'] = Resolve-Identity (Get-Prop $p 'lastModifiedBy')
    $policy['serviceSettings'] = $settings
    $policy['alertSettings'] = $alerts
    $policy['alertRecipients'] = $recipients
    $policy['assignedGroups'] = $groups
    $policies.Add($policy)
}

# ---- Users in scope ------------------------------------------------------------------------
if ($UserScope -eq 'AllUsers') {
    Write-Step 'Directory users'
    foreach ($u in (Get-GraphCollection 'users?$select=id,displayName,userPrincipalName,userType&$top=999' 'List users')) {
        if ((Get-Prop $u 'userType') -eq 'Guest') { continue }
        if (-not $userById.Contains($u.id)) { $userById[$u.id] = New-UserSummary $u }
    }
}
$scopeUsers = New-Object System.Collections.Generic.List[object]
if ($UserScope -ne 'None') {
    foreach ($id in $userById.Keys) {
        if ($scopeUsers.Count -ge $MaxUsers) { break }
        $scopeUsers.Add($userById[$id])
    }
    if ($userById.Count -gt $MaxUsers) {
        $Warnings.Add("User balances were limited to $MaxUsers of $($userById.Count) users in scope (-MaxUsers).")
    }
}
if ($UserScope -eq 'PolicyMembers' -and $hasAllUsersPolicy) {
    $Warnings.Add('A tenant-wide (all users) policy exists. Run with -UserScope AllUsers to evaluate every user.')
}

# ---- User balances -------------------------------------------------------------------------
$users = New-Object System.Collections.Generic.List[object]
if ($scopeUsers.Count -gt 0) {
    Write-Step "User balances ($($scopeUsers.Count))"
    $n = 0
    foreach ($u in $scopeUsers) {
        $n++
        Write-Progress -Activity 'Copilot user balances' -Status "$n / $($scopeUsers.Count): $($u.userPrincipalName)" -PercentComplete ([int](100 * $n / $scopeUsers.Count))
        $r = Invoke-Graph "$CM/userBalances/$($u.id)?`$expand=serviceBalances"
        $entry = [ordered]@{
            id                = $u.id
            displayName       = $u.displayName
            userPrincipalName = $u.userPrincipalName
            userType          = $u.userType
            groupIds          = @()
            balance           = $null
            error             = $null
        }
        if ($userGroups.ContainsKey($u.id)) { $entry.groupIds = $userGroups[$u.id].ToArray() }
        if ($r.Status -ge 200 -and $r.Status -lt 300) { $entry.balance = $r.Body } else { $entry.error = New-ErrorInfo $r }
        $users.Add($entry)
    }
    Write-Progress -Activity 'Copilot user balances' -Completed
    $failed = @($users | Where-Object { $_.error }).Count
    Write-Ok "$($users.Count - $failed) evaluated, $failed without balance"
}

# ---- Write file ----------------------------------------------------------------------------
$platform = 'windows'
if ($PSVersionTable.PSVersion.Major -ge 6) {
    if ($IsMacOS) { $platform = 'macos' } elseif ($IsLinux) { $platform = 'linux' }
}
$signedIn = $null
if ($me) { $signedIn = [ordered]@{ id = $me.id; displayName = (Get-Prop $me 'displayName'); userPrincipalName = (Get-Prop $me 'userPrincipalName') } }

$inventory = [ordered]@{
    schema        = 'copilot-cost-inventory/v1'
    generatedAt   = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    generator     = [ordered]@{
        name      = 'Get-CopilotCostInventory.ps1'
        version   = $ScriptVersion
        platform  = $platform
        runtime   = "PowerShell $($PSVersionTable.PSVersion) ($($PSVersionTable.PSEdition))"
        poweredBy = 'Copilot Coaching (copilot-coaching.de)'
    }
    tenant        = $tenant
    signedInUser  = $signedIn
    options       = [ordered]@{ userScope = $UserScope; maxUsers = $MaxUsers }
    creditBalance = $balance
    policies      = $policies
    users         = $users
    warnings      = $Warnings
    errors        = $Errors
    calls         = $Calls
    durationMs    = [int]((Get-Date) - $Started).TotalMilliseconds
}

if (-not $OutputPath) {
    $label = $tenant.initialDomain
    if (-not $label) { $label = $tenant.id }
    if (-not $label) { $label = 'tenant' }
    $label = ($label -replace '\.onmicrosoft\.com$', '') -replace '[^A-Za-z0-9-]', '-'
    $OutputPath = Join-Path (Get-Location).Path ('CopilotCostInventory-{0}-{1}.json' -f $label, (Get-Date -Format 'yyyyMMdd-HHmm'))
}
elseif (-not [IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path (Get-Location).Path $OutputPath
}
$json = $inventory | ConvertTo-Json -Depth 32
[IO.File]::WriteAllText($OutputPath, $json, (New-Object System.Text.UTF8Encoding($false)))

if (-not $AccessToken) { Disconnect-MgGraph | Out-Null }

Write-Host ''
Write-Host "Done in $([Math]::Round(((Get-Date) - $Started).TotalSeconds, 1)) s: $($Calls.Count) GET calls, $($Errors.Count) error(s)." -ForegroundColor Green
foreach ($w in $Warnings) { Write-Host "Note: $w" -ForegroundColor Yellow }
Write-Host 'Inventory file: ' -NoNewline
Write-Host $OutputPath -ForegroundColor White
Write-Host 'The file contains names, UPNs, groups, per-user spend and alert recipient addresses. Keep it confidential; do not share it publicly or commit it.' -ForegroundColor Yellow
Write-Host 'Import it in the Copilot Cost Inventory viewer (index.html). Powered by Copilot Coaching - copilot-coaching.de' -ForegroundColor DarkGray
