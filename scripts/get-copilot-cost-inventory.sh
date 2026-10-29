#!/bin/zsh
# =============================================================================================
#  Copilot Cost Inventory - macOS collector (read-only)                              v1.0.0
#
#  Signs in as an administrator (device code) and runs only GET requests against the
#  Microsoft Graph Copilot Cost Management API (beta, /copilot/costManagement):
#    - tenant credit balance per billing method
#    - every spending policy with service settings, email alert thresholds, recipients and
#      assigned groups (with transitive user member counts)
#    - per-user balance diagnostics (consumption, limits, access decision per service)
#  Writes one JSON file (schema "copilot-cost-inventory/v1") for the Copilot Cost Inventory
#  viewer (index.html). Nothing is changed in the tenant.
#
#  No installs needed: uses only zsh, curl and osascript (JavaScript for Automation).
#
#  Usage:
#    zsh get-copilot-cost-inventory.sh [options]
#
#  Options:
#    --tenant <id|domain>      Tenant to sign in to (default: home tenant of the account)
#    --user-scope <scope>      policy-members (default) | all-users | none
#    --max-users <n>           Upper bound for user balance lookups (default 500)
#    --output <file.json>      Output file (default ./CopilotCostInventory-<tenant>-<time>.json)
#    --help
#
#  Delegated permissions (read-only): CopilotCostManagement.Read.All,
#  CopilotCostManagement-Policy.Read.All, CopilotCostManagement-Assignment.Read.All,
#  CopilotCostManagement-UserData.Read.All, GroupMember.Read.All, User.ReadBasic.All, User.Read
#  Automation: set CCI_ACCESS_TOKEN to an existing delegated Graph token to skip sign-in.
#  The first sign-in asks an admin to consent to these scopes for the Microsoft Graph Command
#  Line Tools app; that consent stays in the tenant after the run (see README to remove it).
#  The output file contains names, UPNs, groups, per-user spend and alert recipient addresses.
#  Treat it as confidential: do not share it publicly or commit it.
#
#  Powered by Copilot Coaching - https://copilot-coaching.de
# =============================================================================================
exec /usr/bin/osascript -l JavaScript - --cwd "$PWD" "$@" <<'JXA'
ObjC.import("Foundation");
ObjC.import("stdlib");

const VERSION = "1.1.0";
const CLIENT_ID = "14d82eec-204b-4c2f-b7e8-296a70dab67e"; // Microsoft Graph Command Line Tools
const GRAPH = "https://graph.microsoft.com/beta/";
const CM = "copilot/costManagement";
const SCOPES = [
  "User.Read", "User.ReadBasic.All", "GroupMember.Read.All",
  "CopilotCostManagement.Read.All", "CopilotCostManagement-Policy.Read.All",
  "CopilotCostManagement-Assignment.Read.All", "CopilotCostManagement-UserData.Read.All",
];

const app = Application.currentApplication();
app.includeStandardAdditions = true;

const C = { reset: "\x1b[0m", dim: "\x1b[2m", cyan: "\x1b[36m", magenta: "\x1b[35m", yellow: "\x1b[33m", green: "\x1b[32m", bold: "\x1b[1m", red: "\x1b[31m" };
function out(text) {
  $.NSFileHandle.fileHandleWithStandardError.writeData($(String(text)).dataUsingEncoding($.NSUTF8StringEncoding));
}
const say = (text) => out(text + "\n");
const step = (text) => say(`  ${C.cyan}> ${text}${C.reset}`);
const info = (text) => say(`    ${C.dim}${text}${C.reset}`);
const warn = (text) => say(`    ${C.yellow}! ${text}${C.reset}`);

const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
const sh = (cmd) => app.doShellScript(cmd, { alteringLineEndings: false });
function readFile(path) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  return s.isNil() ? "" : s.js;
}
function writeFile(path, text) {
  const ok = $(String(text)).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null);
  if (!ok) throw new Error(`Could not write ${path}`);
}
function getenv(name) {
  const v = $.NSProcessInfo.processInfo.environment.objectForKey(name);
  return v.isNil() ? "" : v.js;
}

function parseArgs(argv) {
  const o = { cwd: "", tenant: "", output: "", userScope: "PolicyMembers", maxUsers: 500, help: false };
  const scopes = { "policy-members": "PolicyMembers", policymembers: "PolicyMembers", "all-users": "AllUsers", allusers: "AllUsers", none: "None" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`); return argv[++i]; };
    if (a === "--cwd") o.cwd = next();
    else if (a === "--tenant") o.tenant = next();
    else if (a === "--output" || a === "-o") o.output = next();
    else if (a === "--user-scope") {
      const v = scopes[next().toLowerCase()];
      if (!v) throw new Error("--user-scope must be policy-members, all-users or none");
      o.userScope = v;
    } else if (a === "--max-users") {
      o.maxUsers = parseInt(next(), 10);
      if (!(o.maxUsers >= 0)) throw new Error("--max-users must be a number >= 0");
    } else if (a === "--help" || a === "-h") o.help = true;
    else throw new Error(`Unknown option ${a} (see --help)`);
  }
  return o;
}

function run(argv) {
  let tmp = "";
  try {
    const opt = parseArgs(argv);
    if (opt.help) {
      say("Usage: zsh get-copilot-cost-inventory.sh [--tenant <id|domain>] [--user-scope policy-members|all-users|none] [--max-users 500] [--output file.json]");
      return;
    }
    tmp = sh("mktemp -d -t copilot-cost-inventory").trim();
    collect(opt, tmp);
  } catch (e) {
    say(`\n${C.red}Error: ${e.message}${C.reset}`);
    if (tmp) sh(`rm -rf ${q(tmp)}`);
    $.exit(1);
  }
  if (tmp) sh(`rm -rf ${q(tmp)}`);
}

function collect(opt, tmp) {
  const started = Date.now();
  const calls = [];
  const errors = [];
  const warnings = [];
  const BODY = `${tmp}/body`, HDRS = `${tmp}/headers`, AUTH = `${tmp}/auth`, FORM = `${tmp}/form`;

  say("");
  say(`${C.magenta}${C.bold}Copilot Cost Inventory${C.reset}  ${C.dim}v${VERSION}  (read-only, macOS)${C.reset}`);
  say("");

  // ---- Sign-in (device code) -----------------------------------------------------------------
  let token = getenv("CCI_ACCESS_TOKEN");
  if (!token) token = deviceCodeLogin(opt.tenant || "organizations");
  writeFile(AUTH, `Authorization: Bearer ${token}\n`);
  sh(`chmod 600 ${q(AUTH)}`);

  function postForm(url, fields) {
    writeFile(FORM, Object.keys(fields).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(fields[k])}`).join("&"));
    const status = Number(sh(`/usr/bin/curl -sS --max-time 60 -o ${q(BODY)} -w '%{http_code}' --data @${q(FORM)} ${q(url)}`));
    let body = {};
    try { body = JSON.parse(readFile(BODY) || "{}"); } catch (e) { /* keep empty */ }
    return { status, body };
  }

  function deviceCodeLogin(tenant) {
    const base = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0`;
    const scope = SCOPES.map((s) => `https://graph.microsoft.com/${s}`).join(" ");
    const dc = postForm(`${base}/devicecode`, { client_id: CLIENT_ID, scope });
    if (dc.status !== 200) throw new Error(`Device code request failed: ${dc.body.error_description || dc.status}`);
    say(`  ${C.bold}Sign in as a tenant administrator${C.reset}`);
    say(`    1. Open   ${C.cyan}${dc.body.verification_uri}${C.reset}`);
    say(`    2. Enter  ${C.bold}${C.green}${dc.body.user_code}${C.reset}  ${C.dim}(copied to the clipboard)${C.reset}`);
    say(`    3. Approve the read-only permissions\n`);
    try { sh(`printf %s ${q(dc.body.user_code)} | pbcopy; open ${q(dc.body.verification_uri)}`); } catch (e) { /* headless */ }
    let interval = Number(dc.body.interval || 5);
    const deadline = Date.now() + Number(dc.body.expires_in || 900) * 1000;
    while (Date.now() < deadline) {
      delay(interval);
      const t = postForm(`${base}/token`, { grant_type: "urn:ietf:params:oauth:grant-type:device_code", client_id: CLIENT_ID, device_code: dc.body.device_code });
      if (t.status === 200 && t.body.access_token) {
        say(`  ${C.green}Signed in.${C.reset}\n`);
        return t.body.access_token;
      }
      const err = t.body.error;
      if (err === "authorization_pending") { out("."); continue; }
      if (err === "slow_down") { interval += 5; continue; }
      throw new Error(`Sign-in failed: ${t.body.error_description || err || t.status}`);
    }
    throw new Error("Sign-in timed out. Run the script again.");
  }

  // ---- Graph helpers -------------------------------------------------------------------------
  function graph(path) {
    const url = /^https:\/\//.test(path) ? path : GRAPH + path;
    for (let attempt = 1; ; attempt++) {
      const t0 = Date.now();
      let status = 0, body = null, headers = "";
      try {
        status = Number(sh(`/usr/bin/curl -sS --max-time 100 -o ${q(BODY)} -D ${q(HDRS)} -w '%{http_code}' -H @${q(AUTH)} -H 'Accept: application/json' ${q(url)}`));
        headers = readFile(HDRS);
        const text = readFile(BODY);
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = { error: { code: "clientError", message: String(e.message || e) } };
      }
      calls.push({ method: "GET", path: url.startsWith(GRAPH) ? url.slice(GRAPH.length) : url, status, ms: Date.now() - t0 });
      if ([0, 429, 502, 503, 504].includes(status) && attempt < 4) {
        const m = /^retry-after:\s*(\d+)/im.exec(headers);
        delay(m ? Math.min(60, Number(m[1])) : Math.pow(2, attempt));
        continue;
      }
      if (body && typeof body === "object") for (const k of Object.keys(body)) if (k.endsWith("@odata.context")) delete body[k];
      return { status, body };
    }
  }
  const ok = (r) => r.status >= 200 && r.status < 300;
  function errorInfo(r) {
    const e = (r.body && r.body.error) || {};
    return { status: r.status, code: e.code || null, innerCode: (e.innerError && e.innerError.code) || null, message: e.message || null };
  }
  function addError(path, r, context) {
    const e = Object.assign(errorInfo(r), { context, path });
    errors.push(e);
    warn(`${context} -> HTTP ${e.status} ${e.code || ""} ${e.innerCode || ""}`);
  }
  function getObject(path, context, tolerate = []) {
    const r = graph(path);
    if (ok(r)) return r.body;
    if (!tolerate.includes(r.status)) addError(path, r, context);
    return null;
  }
  function getCollection(path, context, tolerate = []) {
    const items = [];
    let next = path;
    while (next) {
      const r = graph(next);
      if (!ok(r)) { if (!tolerate.includes(r.status)) addError(next, r, context); break; }
      items.push(...((r.body && r.body.value) || []));
      next = r.body && r.body["@odata.nextLink"];
    }
    return items;
  }
  const userSummary = (u) => ({ id: u.id, displayName: u.displayName || null, userPrincipalName: u.userPrincipalName || null, userType: u.userType || null });

  const identityCache = {};
  function resolveIdentity(set) {
    const user = set && set.user, appl = set && set.application;
    if (user && user.id) {
      if (!identityCache[user.id]) {
        const u = getObject(`users/${user.id}?$select=displayName,userPrincipalName`, "Resolve policy author", [403, 404]) || {};
        identityCache[user.id] = { id: user.id, displayName: u.displayName || null, userPrincipalName: u.userPrincipalName || null };
      }
      return identityCache[user.id];
    }
    if (appl && appl.id) return { id: appl.id, displayName: appl.displayName || null, userPrincipalName: null, isApplication: true };
    return null;
  }

  // ---- Context -------------------------------------------------------------------------------
  step("Tenant and signed-in account");
  const me = getObject("me?$select=id,displayName,userPrincipalName", "Signed-in user");
  const org = getObject("organization?$select=id,displayName,verifiedDomains", "Tenant");
  const tenant = { id: null, displayName: null, defaultDomain: null, initialDomain: null };
  const o = org && org.value && org.value[0];
  if (o) {
    tenant.id = o.id;
    tenant.displayName = o.displayName;
    for (const d of o.verifiedDomains || []) {
      if (d.isDefault) tenant.defaultDomain = d.name;
      if (d.isInitial) tenant.initialDomain = d.name;
    }
  }
  info(`${tenant.displayName} (${tenant.defaultDomain}) as ${me && me.userPrincipalName}`);

  // ---- Tenant credit balance -----------------------------------------------------------------
  step("Tenant credit balance");
  const balance = getObject(`${CM}/getTenantCreditBalance`, "Tenant credit balance");
  if (balance) info(`${(balance.billingMethodBalances || []).length} billing method(s)`);

  // ---- Spending policies ---------------------------------------------------------------------
  step("Spending policies");
  const policyList = getCollection(`${CM}/spendingPolicies`, "List spending policies");
  info(`${policyList.length} policy(ies)`);

  const groupMembers = {}, userGroups = {}, userById = new Map(), policies = [];
  let hasAllUsersPolicy = false;
  for (const p of policyList) {
    const base = `${CM}/spendingPolicies/${p.id}`;
    info(`- ${p.displayName} [${p.status}]`);
    const isSelected = String(p["@odata.type"] || "").endsWith("selectedGroupsSpendingPolicy");
    if (!isSelected) hasAllUsersPolicy = true;

    const serviceSettings = getCollection(`${base}/serviceSettings`, `Service settings of '${p.displayName}'`);
    const alertSettings = getObject(`${base}/emailThresholdSettings`, `Alert settings of '${p.displayName}'`, [404]);
    const alertRecipients = getCollection(`${base}/emailThresholdSettings/recipients`, `Alert recipients of '${p.displayName}'`, [404])
      .map((r) => ({ id: r.id || null, displayName: r.displayName || null, userPrincipalName: r.userPrincipalName || null, mail: r.mail || null }));

    const assignedGroups = [];
    if (isSelected) {
      for (const g of getCollection(`${base}/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups`, `Assigned groups of '${p.displayName}'`)) {
        if (!groupMembers[g.id]) {
          const members = getCollection(`groups/${g.id}/transitiveMembers/microsoft.graph.user?$select=id,displayName,userPrincipalName,userType&$top=999`, `Members of group '${g.displayName}'`);
          for (const m of members) {
            if (!userById.has(m.id)) userById.set(m.id, userSummary(m));
            (userGroups[m.id] = userGroups[m.id] || []).includes(g.id) || userGroups[m.id].push(g.id);
          }
          groupMembers[g.id] = members;
        }
        assignedGroups.push({
          id: g.id, displayName: g.displayName || null, description: g.description || null, mail: g.mail || null,
          securityEnabled: g.securityEnabled === undefined ? null : g.securityEnabled, groupTypes: g.groupTypes || [],
          membershipRule: g.membershipRule || null, transitiveUserMembers: groupMembers[g.id].length,
        });
      }
    }
    policies.push(Object.assign({}, p, {
      createdByResolved: resolveIdentity(p.createdBy),
      lastModifiedByResolved: resolveIdentity(p.lastModifiedBy),
      serviceSettings, alertSettings, alertRecipients, assignedGroups,
    }));
  }

  // ---- Users in scope ------------------------------------------------------------------------
  if (opt.userScope === "AllUsers") {
    step("Directory users");
    for (const u of getCollection("users?$select=id,displayName,userPrincipalName,userType&$top=999", "List users")) {
      if (u.userType === "Guest") continue;
      if (!userById.has(u.id)) userById.set(u.id, userSummary(u));
    }
  }
  let scopeUsers = opt.userScope === "None" ? [] : [...userById.values()];
  if (scopeUsers.length > opt.maxUsers) {
    warnings.push(`User balances were limited to ${opt.maxUsers} of ${scopeUsers.length} users in scope (--max-users).`);
    scopeUsers = scopeUsers.slice(0, opt.maxUsers);
  }
  if (opt.userScope === "PolicyMembers" && hasAllUsersPolicy) {
    warnings.push("A tenant-wide (all users) policy exists. Run with --user-scope all-users to evaluate every user.");
  }

  // ---- User balances -------------------------------------------------------------------------
  const users = [];
  if (scopeUsers.length) {
    step(`User balances (${scopeUsers.length})`);
    scopeUsers.forEach((u, i) => {
      out(`\r    ${C.dim}${i + 1} / ${scopeUsers.length}  ${String(u.userPrincipalName || "").slice(0, 60).padEnd(60)}${C.reset}`);
      const r = graph(`${CM}/userBalances/${u.id}?$expand=serviceBalances`);
      users.push(Object.assign({}, u, { groupIds: userGroups[u.id] || [], balance: ok(r) ? r.body : null, error: ok(r) ? null : errorInfo(r) }));
    });
    out("\r" + " ".repeat(80) + "\r");
    const failed = users.filter((u) => u.error).length;
    info(`${users.length - failed} evaluated, ${failed} without balance`);
  }

  // ---- Write file ----------------------------------------------------------------------------
  let macos = "";
  try { macos = sh("sw_vers -productVersion").trim(); } catch (e) { /* ignore */ }
  const inventory = {
    schema: "copilot-cost-inventory/v1",
    generatedAt: new Date().toISOString(),
    generator: {
      name: "get-copilot-cost-inventory.sh", version: VERSION, platform: "macos",
      runtime: `osascript JavaScript (macOS ${macos})`, poweredBy: "Copilot Coaching (copilot-coaching.de)",
    },
    tenant,
    signedInUser: me ? { id: me.id, displayName: me.displayName || null, userPrincipalName: me.userPrincipalName || null } : null,
    options: { userScope: opt.userScope, maxUsers: opt.maxUsers },
    creditBalance: balance,
    policies, users, warnings, errors, calls,
    durationMs: Date.now() - started,
  };

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 13);
  const label = String(tenant.initialDomain || tenant.id || "tenant").replace(/\.onmicrosoft\.com$/, "").replace(/[^A-Za-z0-9-]/g, "-");
  let file = opt.output || `CopilotCostInventory-${label}-${stamp}.json`;
  if (!file.startsWith("/")) file = `${opt.cwd || sh("pwd").trim()}/${file}`;
  writeFile(file, JSON.stringify(inventory, null, 2));

  say("");
  say(`${C.green}Done in ${((Date.now() - started) / 1000).toFixed(1)} s: ${calls.length} GET calls, ${errors.length} error(s).${C.reset}`);
  for (const w of warnings) say(`${C.yellow}Note: ${w}${C.reset}`);
  say(`Inventory file: ${C.bold}${file}${C.reset}`);
  say(`${C.yellow}The file contains names, UPNs, groups, per-user spend and alert recipient addresses. Keep it confidential; do not share it publicly or commit it.${C.reset}`);
  say(`${C.dim}Import it in the Copilot Cost Inventory viewer (index.html). Powered by Copilot Coaching - copilot-coaching.de${C.reset}`);
}
JXA
