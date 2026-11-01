/* ---------- model ---------- */
const BUCKETS = [
  { key: "b0", label: "&lt;25%", tone: "" }, { key: "b1", label: "25&ndash;49%", tone: "" }, { key: "b2", label: "50&ndash;79%", tone: "" },
  { key: "b3", label: "80&ndash;99%", tone: "warn" }, { key: "limit", label: "At limit", tone: "bad" },
  { key: "nolimit", label: "No limit", tone: "muted" }, { key: "nodata", label: "No data", tone: "muted" },
];
function analyze(d) {
  const policies = Array.isArray(d.policies) ? d.policies : [];
  const pById = Object.fromEntries(policies.map((p) => [p.id, p]));
  const groupNames = {};
  policies.forEach((p) => (p.assignedGroups || []).forEach((g) => (groupNames[g.id] = g.displayName || g.id)));
  const users = (Array.isArray(d.users) ? d.users : []).map((u) => {
    const sb = (u.balance && Array.isArray(u.balance.serviceBalances) && u.balance.serviceBalances) || [];
    const total = sb.reduce((s, x) => s + num(x.consumedQuantity), 0);
    const blocked = sb.filter((x) => x.isConsumptionAllowed === false);
    const status = u.error ? "error" : !sb.length ? "none" : !blocked.length ? "allowed" : blocked.length === sb.length ? "blocked" : "partial";
    const policyIds = [...new Set(sb.map((x) => x.spendingPolicyId).filter(Boolean))];
    const rem = sb.map((x) => x.remainingQuantity).filter(Boolean);
    const remaining = rem.length && rem.every(isUnlimited) ? rem[0] : rem.filter((q) => !isUnlimited(q)).sort((a, b) => num(a.value) - num(b.value))[0] || null;
    const byPol = {};
    sb.forEach((x) => { const k = x.spendingPolicyId || "-"; (byPol[k] = byPol[k] || { used: 0, limit: qv(x.configuredPerUserLimit) }).used += num(x.consumedQuantity); });
    let limitPct = null, perUserLimit = null;
    Object.values(byPol).forEach((p) => { if (p.limit) { const r = p.used / p.limit; if (limitPct == null || r > limitPct) { limitPct = r; perUserLimit = p.limit; } } });
    const exhausted = sb.some((x) => x.accessDecisionReason === "limitExhausted");
    const bucket = status === "error" || status === "none" ? "nodata" : perUserLimit == null ? "nolimit" : exhausted || limitPct >= 1 ? "limit"
      : limitPct < 0.25 ? "b0" : limitPct < 0.5 ? "b1" : limitPct < 0.8 ? "b2" : "b3";
    return Object.assign({}, u, { sb, total, blocked, status, policyIds, remaining, limitPct, perUserLimit, exhausted, bucket });
  });
  const svcTotals = {};
  policies.forEach((p) => (p.serviceSettings || []).forEach((s) => (svcTotals[s.serviceId] = svcTotals[s.serviceId] || 0)));
  users.forEach((u) => u.sb.forEach((x) => (svcTotals[x.serviceId] = (svcTotals[x.serviceId] || 0) + num(x.consumedQuantity))));
  const services = Object.keys(svcTotals).sort((a, b) => svcTotals[b] - svcTotals[a]);
  const svcColor = Object.fromEntries(services.map((s, i) => [s, SERVICE_COLORS[i % SERVICE_COLORS.length]]));
  const polTotals = {}, polUsers = {};
  users.forEach((u) => u.sb.forEach((x) => {
    if (!x.spendingPolicyId) return;
    polTotals[x.spendingPolicyId] = (polTotals[x.spendingPolicyId] || 0) + num(x.consumedQuantity);
    (polUsers[x.spendingPolicyId] = polUsers[x.spendingPolicyId] || new Set()).add(u.id);
  }));
  const buckets = Object.fromEntries(BUCKETS.map((b) => [b.key, 0]));
  users.forEach((u) => buckets[u.bucket]++);
  const bm = (d.creditBalance && Array.isArray(d.creditBalance.billingMethodBalances) && d.creditBalance.billingMethodBalances) || [];
  const totalUserUse = users.reduce((s, u) => s + u.total, 0);
  return { policies, pById, groupNames, users, svcTotals, services, svcColor, polTotals, polUsers, buckets, bm, totalUserUse };
}
function policyView(p) {
  const m = state.model, used = m.polTotals[p.id] || 0, limit = qv(p.periodLimit);
  const a = p.alertSettings;
  const thresholds = a && Array.isArray(a.thresholds) ? a.thresholds : [];
  const isPct = (t) => /percentage/i.test(t["@odata.type"] || "");
  const ticks = a && a.isEnabled && limit ? thresholds.map((t) => (isPct(t) ? num(t.value) / 100 : num(t.value) / limit)) : [];
  const thresholdText = thresholds.map((t) => (isPct(t) ? `${nf(num(t.value))}%` : money(t.value))).join(", ");
  return { used, limit, share: limit ? used / limit : null, ticks, thresholdText, users: m.polUsers[p.id] ? m.polUsers[p.id].size : 0 };
}
const billingText = (p) => String(p.billingMethods || "").split(",").map((b) => b.trim()).filter(Boolean).map((b) => `<span class="nw">${esc(BILLING_LABELS[b] || splitCamel(b))}</span>`).join(" + ") || "&ndash;";

/* ---------- dashboard ---------- */
function kpi(icon, tone, label, value, sub, extra = "") {
  const glyph = icon.startsWith("lg-") ? logo(icon.slice(3)) : ic(icon);
  return `<div class="kpi"><div class="kh"><span class="ktile ${tone}">${glyph}</span><h3>${label}</h3></div><div class="kv">${value}</div><div class="ks">${sub}</div>${extra}</div>`;
}
function renderDashboard() {
  const d = state.data, m = state.model;
  const t = d.tenant || {}, g = d.generator || {}, me = d.signedInUser || {};
  const demo = g.platform === "demo";
  const prepaid = m.bm.find((b) => num(b.purchasedQuantity) > 0) || m.bm.find((b) => b.billingMethod === "prepaidCredits");
  const payg = m.bm.find((b) => b.billingMethod === "payAsYouGo");
  const enabled = m.policies.filter((p) => p.status === "enabled").length;
  const withAlerts = m.policies.filter((p) => p.alertSettings && p.alertSettings.isEnabled).length;
  const cnt = (s) => m.users.filter((u) => u.status === s).length;
  const atLimit = m.buckets.limit, errs = cnt("error"), limited = cnt("blocked") + cnt("partial"), consuming = m.users.filter((u) => u.total > 0).length;
  const attention = m.users.filter((u) => u.status !== "allowed" || u.bucket === "limit").length;
  const top = m.services[0] && m.svcTotals[m.services[0]] > 0 ? m.services[0] : null;
  const errors = Array.isArray(d.errors) ? d.errors : [];

  const prepaidShare = prepaid && num(prepaid.purchasedQuantity) > 0 ? num(prepaid.remainingQuantity) / num(prepaid.purchasedQuantity) : null;
  const html = `
  <section id="overview" class="page-head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#" data-action="home">Home</a>${ic("i-chevron")}<span aria-current="page">Copilot costs</span></nav>
    <div class="title-row"><h1>${esc(t.displayName || "Unknown tenant")}</h1>${demo ? `<span class="tag">Demo data</span>` : ""}</div>
    <ul class="meta">
      <li title="${esc(d.generatedAt)}">${ic("i-clock")}Snapshot ${esc(ago(d.generatedAt))} &middot; ${fmtDate(d.generatedAt)}</li>
      ${t.defaultDomain ? `<li>${ic("i-grid")}${esc(t.defaultDomain)}</li>` : ""}
      <li>${ic("i-person")}Run by ${esc(me.userPrincipalName || me.displayName || "unknown")}</li>
      <li>${ic("i-file")}${esc(state.fileName || "inventory.json")}</li>
    </ul>
  </section>
  ${demo ? `<div class="msg info">${ic("i-info")}<div><b>Synthetic demo tenant.</b> All names and figures are generated for illustration. Import your own inventory file to audit your tenant.</div><button class="btn" data-action="pick">Import file</button></div>` : ""}
  ${errors.length ? `<div class="msg warning">${ic("i-warn")}<div><b>${errors.length} collector error(s).</b> Some figures may be incomplete. Details are listed under Diagnostics.</div><a class="btn" href="#diagnostics">View diagnostics</a></div>` : ""}

  <section class="kpis reveal" aria-label="Key figures">
    ${kpi("i-wallet", "t-brand", "Prepaid credits remaining",
      prepaid && prepaid.remainingQuantity != null ? money(prepaid.remainingQuantity, "count") : "&ndash;",
      prepaid && prepaid.purchasedQuantity != null ? `${pctText(prepaidShare)} of ${money(prepaid.purchasedQuantity)} purchased` : "No prepaid credits",
      prepaidShare != null ? meter(prepaidShare, { tone: prepaidShare < 0.2 ? "warn" : "brand" }) : "")}
    ${kpi("lg-azure-subscription", "t-logo", "Pay-as-you-go consumed", payg ? money(payg.consumedQuantity, "count") : "&ndash;",
      payg ? `${moneyAlt(payg.consumedQuantity)} &middot; billed via Azure` : "Pay-as-you-go not used")}
    ${kpi("i-flash", "t-gold", "Consumed by evaluated users", money(m.totalUserUse, "count"),
      top ? `Top service ${esc(svcName(top))} &middot; ${pctText(m.svcTotals[top] / (m.totalUserUse || 1))}` : "No consumption recorded")}
    ${kpi("i-policy", "t-green", "Spending policies", count(m.policies.length),
      `${enabled} enabled &middot; ${withAlerts} with alerts on`)}
    ${kpi("i-people", attention ? "t-red" : "t-green", "Users needing attention", count(attention),
      `of ${nf(m.users.length)} evaluated`,
      `<div class="kchips">${statusTag(atLimit ? "bad" : "skip", `${atLimit} at limit`)}${limited - atLimit > 0 ? statusTag("warn", `${limited - atLimit} blocked`) : ""}${statusTag(errs ? "bad" : "skip", `${errs} error${errs === 1 ? "" : "s"}`)}</div>`)}
  </section>

  <div class="viz-grid two">
    <section class="card reveal" id="balance">${renderBalance()}</section>
    <section class="card reveal">${renderServices()}</section>
  </div>
  <div class="viz-grid three">
    <section class="card reveal">${renderBuckets()}</section>
    <section class="card reveal">${renderPolicyBars()}</section>
    <section class="card reveal">${renderTopUsers()}</section>
  </div>

  <section class="card reveal" id="policies">
    <header class="ch"><h2>${ic("i-policy")}Spending policies <span class="count-pill">${m.policies.length}</span></h2><span class="hint">Select a row for groups, recipients and history</span></header>
    ${m.policies.length ? `<div class="tbl-wrap"><table class="list">
      <thead><tr><th class="xcol"></th><th>Policy</th><th>Status</th><th>Billing</th><th class="num">Per-user limit</th><th class="wide">Period limit usage</th><th>Services</th><th>Alerts</th><th class="num">Users</th></tr></thead>
      <tbody>${m.policies.map(renderPolicyRow).join("")}</tbody></table></div>` : `<div class="empty">${ic("i-policy")}No spending policies found in this file.</div>`}
  </section>

  <section class="card" id="users">
    <header class="ch"><h2>${ic("i-people")}Users <span class="count-pill">${m.users.length}</span></h2><span class="hint">Per-user balance diagnostics; select a row for the per-service breakdown</span></header>
    <div class="toolbar">
      <label class="search">${ic("i-search")}<input id="uq" type="search" placeholder="Search name or UPN" aria-label="Search users"></label>
      <div class="pills" role="group" aria-label="Quick filter">
        <button class="pill" data-action="ufilter" data-v="">All <b>${m.users.length}</b></button>
        <button class="pill" data-action="ufilter" data-v="consuming">Consuming <b>${consuming}</b></button>
        <button class="pill" data-action="ufilter" data-v="limited">Limited <b>${limited}</b></button>
        <button class="pill" data-action="ufilter" data-v="error">Errors <b>${errs}</b></button>
      </div>
      <select id="ustatus" aria-label="Filter by status">
        <option value="">All statuses</option><option value="consuming" selected>Consumption &gt; 0</option><option value="allowed">Allowed</option><option value="limited">Blocked / limited</option><option value="error">Errors</option><option value="none">No balance</option>
      </select>
      <select id="upolicy" aria-label="Filter by policy"><option value="">All policies</option>${m.policies.map((p) => `<option value="${esc(p.id)}">${esc(p.displayName)}</option>`).join("")}</select>
      <select id="usort" aria-label="Sort"><option value="use">Highest consumption</option><option value="pct">Highest limit usage</option><option value="name">Name A-Z</option><option value="rem">Lowest remaining</option></select>
      <span class="spacer"></span>
      <span class="muted small" id="ucount" aria-live="polite"></span>
    </div>
    <div class="tbl-wrap"><table class="list">
      <thead><tr><th class="xcol"></th><th>User</th><th>Policy</th><th>Services</th><th class="num">Consumed</th><th class="wide">Per-user limit</th><th class="num">Remaining</th><th>Access</th></tr></thead>
      <tbody id="ubody"></tbody>
    </table></div>
    <div class="more" id="umore"></div>
  </section>

  <section class="card reveal" id="diagnostics">${renderDiagnostics()}</section>`;

  $("#dash").innerHTML = html;
  $("#suiteTenant").textContent = t.displayName || "";
  renderUsers();
  for (const id of ["uq", "ustatus", "upolicy", "usort"]) $("#" + id).addEventListener("input", () => { state.userLimit = 200; renderUsers(); });
  observeReveals($("#dash"));
}

function renderBalance() {
  const m = state.model;
  const head = `<header class="ch"><h2>${ic("i-wallet")}Credit balance</h2><span class="hint">getTenantCreditBalance</span></header>`;
  if (!m.bm.length) return head + `<div class="empty">${ic("i-wallet")}No credit balance in this file.</div>`;
  const pre = m.bm.find((b) => num(b.purchasedQuantity) > 0);
  const colors = ["var(--v1)", "var(--v2)", "var(--v3)", "var(--v4)"];
  const asOf = (m.bm.find((b) => b.dataStatus && b.dataStatus.lastModifiedDateTime) || {}).dataStatus;
  const ring = pre ? donut([
    { v: num(pre.consumedQuantity), c: "var(--brand)", label: `Consumed: ${nf(num(pre.consumedQuantity))} credits` },
    { v: Math.max(0, num(pre.remainingQuantity)), c: "var(--viz-rest)", label: `Remaining: ${nf(num(pre.remainingQuantity))} credits` },
  ], pctText(num(pre.remainingQuantity) / num(pre.purchasedQuantity)), "prepaid left", `Prepaid credits: ${pctText(num(pre.remainingQuantity) / num(pre.purchasedQuantity))} remaining`) : "";
  const rows = [];
  if (pre) {
    rows.push(`<div><dt><i class="sw" style="--c:var(--brand)"></i>Prepaid consumed</dt><dd>${money(pre.consumedQuantity)}</dd></div>`);
    rows.push(`<div><dt><i class="sw" style="--c:var(--viz-rest)"></i>Prepaid remaining</dt><dd>${money(pre.remainingQuantity)}</dd></div>`);
    rows.push(`<div><dt>Purchased</dt><dd>${money(pre.purchasedQuantity)}</dd></div>`);
  }
  m.bm.filter((b) => b !== pre).forEach((b) => rows.push(`<div><dt>${esc(BILLING_LABELS[b.billingMethod] || splitCamel(b.billingMethod))} consumed</dt><dd>${money(b.consumedQuantity)}</dd></div>`));
  const used = m.bm.filter((b) => num(b.consumedQuantity) > 0);
  const totalUsed = used.reduce((s, b) => s + num(b.consumedQuantity), 0);
  const mix = used.length > 1 ? `<div class="mix">
      <div class="mix-head"><span>Consumption by billing method</span></div>
      ${stackBar(used.map((b, i) => ({ v: num(b.consumedQuantity), c: colors[i % colors.length], label: `${BILLING_LABELS[b.billingMethod] || b.billingMethod}: ${nf(num(b.consumedQuantity))} credits` })), 1, { cls: "tall" })}
      <ul class="legend">${used.map((b, i) => `<li><i class="sw" style="--c:${colors[i % colors.length]}"></i>${esc(BILLING_LABELS[b.billingMethod] || splitCamel(b.billingMethod))}<b>${pctText(num(b.consumedQuantity) / totalUsed)}</b></li>`).join("")}</ul>
    </div>` : "";
  return `${head}<div class="balance">${ring}<dl class="kvl">${rows.join("")}</dl></div>${mix}
    <p class="fine">As of ${fmtDate(asOf && asOf.lastModifiedDateTime)}. Currency view: 1 credit = $${PRICING.usdPerCredit.toFixed(2)} pay-as-you-go list price. Exchange rates for EUR, NZD and AUD are from ${esc(PRICING.ratesDate)} via <a href="${esc(PRICING.ratesSource)}" target="_blank" rel="noopener">Frankfurter</a>. Indicative only.</p>`;
}

function renderServices() {
  const m = state.model;
  const head = `<header class="ch"><h2>${ic("i-pie")}Consumption by service</h2><span class="hint">Evaluated users</span></header>`;
  const total = m.services.reduce((s, x) => s + m.svcTotals[x], 0);
  if (!m.services.length) return head + `<div class="empty">${ic("i-pie")}No services found.</div>`;
  const ring = donut(m.services.map((s) => ({ v: m.svcTotals[s], c: m.svcColor[s], label: `${svcName(s)}: ${nf(m.svcTotals[s])} credits` })), money(total), "total", "Consumption by service");
  return `${head}<div class="svc">${ring}
    <table class="legend-tbl"><thead><tr><th>Service</th><th class="num">Consumed</th><th class="num">Share</th></tr></thead><tbody>
    ${m.services.map((s) => `<tr><td><span class="svc-name"><i class="sw" style="--c:${m.svcColor[s]}"></i>${svcIcon(s)}${esc(svcName(s))}</span></td><td class="num">${money(m.svcTotals[s])}</td><td class="num muted">${total ? pctText(m.svcTotals[s] / total) : "&ndash;"}</td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderBuckets() {
  const m = state.model;
  const head = `<header class="ch"><h2>${ic("i-columns")}Per-user limit usage</h2><span class="hint">Users per band</span></header>`;
  if (!m.users.length) return head + `<div class="empty">${ic("i-people")}No users in this file.</div>`;
  const cols = BUCKETS.filter((b, i) => i < 5 || m.buckets[b.key] > 0).map((b) => ({ v: m.buckets[b.key], label: b.label, tone: b.tone, title: `${m.buckets[b.key]} user(s): ${b.label.replace(/&lt;/, "<").replace(/&ndash;/, "-")}` }));
  const withLimit = m.users.filter((u) => u.perUserLimit != null && u.bucket !== "nodata").length;
  return `${head}${columns(cols, "Users by share of their per-user limit consumed")}
    <p class="fine">Share of each user's per-user limit already consumed, for ${nf(withLimit)} user(s) with a limit. Highest share counts when a user is in several policies.</p>`;
}

function renderPolicyBars() {
  const m = state.model;
  const head = `<header class="ch"><h2>${ic("i-bars")}Consumption by policy</h2><span class="hint">Evaluated users</span></header>`;
  if (!m.policies.length) return head + `<div class="empty">${ic("i-policy")}No spending policies found.</div>`;
  const list = m.policies.map((p) => Object.assign({ p }, policyView(p))).sort((a, b) => b.used - a.used);
  const max = Math.max(1, ...list.map((x) => x.used));
  return `${head}<div class="hrows">${list.map((x, i) => `
    <div class="hrow">
      <span class="hl"><b>${esc(x.p.displayName)}</b><small>${x.p.status !== "enabled" ? splitCamel(x.p.status) : x.limit ? `${pctText(x.share)} of period limit` : "No period limit"} &middot; ${x.users} user(s)</small></span>
      ${stackBar([{ v: x.used || 0, c: x.p.status === "enabled" ? "var(--brand)" : "var(--muted)", label: `${nf(x.used)} credits` }], x.used / max, { i })}
      <span class="hv">${money(x.used)}</span>
    </div>`).join("")}</div>`;
}

function renderTopUsers() {
  const m = state.model;
  const head = `<header class="ch"><h2>${ic("i-person")}Top consumers</h2><span class="hint">Split by service</span></header>`;
  const top = m.users.filter((u) => u.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);
  if (!top.length) return head + `<div class="empty">${ic("i-people")}No user consumption recorded yet.</div>`;
  const max = top[0].total;
  return `${head}<div class="hrows">${top.map((u, i) => `
    <div class="hrow">
      <span class="hl person">${avatar(u.displayName || u.userPrincipalName)}<span><b>${esc(u.displayName || u.userPrincipalName)}</b><small>${esc(u.userPrincipalName)}</small></span></span>
      ${stackBar(u.sb.map((x) => ({ v: num(x.consumedQuantity), c: m.svcColor[x.serviceId], label: `${svcName(x.serviceId)}: ${nf(num(x.consumedQuantity), 2)} credits` })), u.total / max, { i })}
      <span class="hv">${money(u.total)}</span>
    </div>`).join("")}</div>
    <ul class="legend">${m.services.map((s) => `<li><i class="sw" style="--c:${m.svcColor[s]}"></i>${esc(svcName(s))}</li>`).join("")}</ul>`;
}

/* ---------- policies table ---------- */
function renderPolicyRow(p) {
  const m = state.model, v = policyView(p);
  const isGroups = /selectedGroups/i.test(p["@odata.type"] || "");
  const groups = (p.assignedGroups || []).map((g) => g.displayName || g.id);
  const a = p.alertSettings;
  const usage = v.limit
    ? `<div class="mcell">${meter(v.share, { ticks: v.ticks })}<span class="small"><b>${pctText(v.share)}</b> <span class="muted">${money(v.used)} of ${money(v.limit)}</span></span></div>`
    : `<div class="mcell"><span class="unl">No period limit</span><span class="small muted">${money(v.used)} used</span></div>`;
  return `<tr class="prow xrow" data-id="${esc(p.id)}" tabindex="0" aria-expanded="false">
    <td class="xcol">${ic("i-chevron", "chev")}</td>
    <td class="lead-cell"><b>${esc(p.displayName)}</b><small>${isGroups ? esc(groups.join(", ") || "No groups") : "All users"}</small></td>
    <td>${policyStatus(p.status)}</td>
    <td class="small">${billingText(p)}</td>
    <td class="num">${qty(p.perUserLimit)}</td>
    <td class="wide">${usage}</td>
    <td><span class="svc-icons">${(p.serviceSettings || []).map((s) => `<span class="si ${s.state === "enabled" ? "" : "off"}" style="--c:${m.svcColor[s.serviceId] || "var(--muted)"}" title="${esc(svcName(s.serviceId))}: ${esc(s.state)}">${svcIcon(s.serviceId)}</span>`).join("") || "&ndash;"}</span></td>
    <td>${a ? `<span class="alert ${a.isEnabled ? "on" : ""}" title="${a.isEnabled ? "Email alerts on" : "Email alerts off"}">${ic("i-bell")}${a.isEnabled ? v.thresholdText || "On" : "Off"}</span>` : `<span class="muted small">None</span>`}</td>
    <td class="num">${nf(v.users)}</td>
  </tr>`;
}
function policyDetail(p) {
  const m = state.model, a = p.alertSettings, author = p.createdByResolved || {}, editor = p.lastModifiedByResolved || {};
  return `<div class="inner pgrid">
    <div><h4>${ic("i-people")}Assigned groups</h4>${(p.assignedGroups || []).map((g) => `<div class="li"><span>${esc(g.displayName || g.id)}${g.membershipRule ? ` <span class="muted small">(dynamic)</span>` : ""}</span><span class="muted">${nf(num(g.transitiveUserMembers))} user(s)</span></div>`).join("") || `<div class="muted small">${/selectedGroups/i.test(p["@odata.type"] || "") ? "No groups assigned." : "Applies to all users."}</div>`}</div>
    <div><h4>${ic("i-flash")}Services</h4>${(p.serviceSettings || []).map((s) => `<div class="li"><span class="svc-name"><i class="sw" style="--c:${m.svcColor[s.serviceId] || "var(--muted)"}"></i>${esc(svcName(s.serviceId))}</span>${statusTag(s.state === "enabled" ? "good" : "skip", splitCamel(s.state))}</div>`).join("") || `<div class="muted small">None</div>`}</div>
    <div><h4>${ic("i-bell")}Email alerts</h4>${a ? `<div class="li"><span>${a.isEnabled ? statusTag("good", "Enabled") : statusTag("skip", "Disabled")}</span><span>${policyView(p).thresholdText || "&ndash;"}</span></div>
      ${(p.alertRecipients || []).map((r) => `<div class="li"><span class="person sm">${avatar(r.displayName || r.mail)}<span><b>${esc(r.displayName || r.id)}</b><small>${esc(r.mail || r.userPrincipalName || "")}</small></span></span></div>`).join("") || `<div class="muted small">No recipients.</div>`}` : `<div class="muted small">No email alert configured.</div>`}</div>
    <div><h4>${ic("i-clock")}History</h4>
      <div class="li"><span class="muted">Created</span><span>${fmtDate(p.createdDateTime, false)}${author.displayName ? ` &middot; ${esc(author.displayName)}` : ""}</span></div>
      <div class="li"><span class="muted">Modified</span><span>${fmtDate(p.lastModifiedDateTime, false)}${editor.displayName ? ` &middot; ${esc(editor.displayName)}` : ""}</span></div>
      <div class="li"><span class="muted">Period limit</span><span>${qty(p.periodLimit)}</span></div>
      <div class="mono small muted id">${esc(p.id)}</div></div>
  </div>`;
}

/* ---------- users table ---------- */
function filteredUsers() {
  const m = state.model;
  const q = ($("#uq").value || "").trim().toLowerCase(), st = $("#ustatus").value, pol = $("#upolicy").value, sort = $("#usort").value;
  let list = m.users.filter((u) =>
    (!q || `${u.displayName} ${u.userPrincipalName}`.toLowerCase().includes(q)) &&
    (!st || (st === "consuming" ? u.total > 0 : st === "limited" ? u.status === "blocked" || u.status === "partial" : u.status === st)) &&
    (!pol || u.policyIds.includes(pol)));
  const remVal = (u) => (u.remaining && !isUnlimited(u.remaining) ? num(u.remaining.value) : Infinity);
  if (sort === "name") list.sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));
  else if (sort === "rem") list.sort((a, b) => remVal(a) - remVal(b));
  else if (sort === "pct") list.sort((a, b) => (b.limitPct == null ? -1 : b.limitPct) - (a.limitPct == null ? -1 : a.limitPct));
  else list.sort((a, b) => b.total - a.total);
  return list;
}
function accessStatus(u) {
  if (u.status === "allowed") return statusTag("good", "Allowed");
  if (u.status === "error") return statusTag("bad", `HTTP ${u.error.status || "?"} ${u.error.innerCode || u.error.code || ""}`.trim());
  if (u.status === "none") return statusTag("skip", "No balance");
  const reason = u.blocked[0] && u.blocked[0].accessDecisionReason;
  if (u.status === "partial") return statusTag("warn", "Partially blocked");
  return statusTag(reason === "notEntitled" ? "warn" : "block", splitCamel(reason || "blocked"));
}
function renderUsers() {
  const m = state.model, list = filteredUsers();
  const max = Math.max(...m.users.map((u) => u.total), 0);
  const shown = list.slice(0, state.userLimit);
  const st = $("#ustatus").value;
  $$(".pill[data-action=ufilter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === st)));
  $("#ucount").textContent = `${list.length} of ${m.users.length} user(s)`;
  $("#ubody").innerHTML = shown.length ? shown.map((u) => `
    <tr class="urow xrow" data-id="${esc(u.id)}" tabindex="0" aria-expanded="false">
      <td class="xcol">${ic("i-chevron", "chev")}</td>
      <td class="lead-cell"><span class="person">${avatar(u.displayName || u.userPrincipalName)}<span><b>${esc(u.displayName || "-")}</b><small>${esc(u.userPrincipalName || u.id)}</small></span></span></td>
      <td class="small">${u.policyIds.map((id) => esc((m.pById[id] || {}).displayName || id)).join("<br>") || (u.groupIds || []).map((g) => esc(m.groupNames[g] || g)).join("<br>") || "&ndash;"}</td>
      <td><span class="mini">${stackBar(u.sb.map((x) => ({ v: num(x.consumedQuantity), c: m.svcColor[x.serviceId], label: `${svcName(x.serviceId)}: ${nf(num(x.consumedQuantity), 2)} credits` })), max ? u.total / max : 0)}</span></td>
      <td class="num">${money(u.total)}</td>
      <td class="wide">${u.perUserLimit != null && u.status !== "error" ? `<div class="mcell">${meter(u.exhausted ? Math.max(1, u.limitPct) : u.limitPct)}<span class="small"><b>${pctText(u.limitPct)}</b> <span class="muted">of ${money(u.perUserLimit)}</span></span></div>` : u.status === "error" ? `<span class="muted small">&ndash;</span>` : `<span class="unl">No limit</span>`}</td>
      <td class="num">${u.remaining ? qty(u.remaining) : "&ndash;"}</td>
      <td>${accessStatus(u)}</td>
    </tr>`).join("") : `<tr><td colspan="8"><div class="empty">${ic("i-search")}No users match the filter.</div></td></tr>`;
  $("#umore").innerHTML = list.length > shown.length ? `<button class="btn" data-action="more">Show ${Math.min(200, list.length - shown.length)} more</button>` : "";
}
function userDetail(u) {
  const m = state.model, b = u.balance || {}, sel = b.selectionDataStatus || {};
  const rows = u.sb.map((x) => `<tr>
    <td><span class="svc-name"><i class="sw" style="--c:${m.svcColor[x.serviceId]}"></i>${svcIcon(x.serviceId)}${esc(svcName(x.serviceId))}</span></td>
    <td class="small">${esc((m.pById[x.spendingPolicyId] || {}).displayName || x.spendingPolicyId || "-")}</td>
    <td class="num">${money(x.consumedQuantity)}</td><td class="num">${qty(x.configuredPeriodLimit)}</td><td class="num">${qty(x.configuredPerUserLimit)}</td>
    <td class="num">${qty(x.effectiveCapacityQuantity)}</td><td class="num">${qty(x.remainingQuantity)}</td>
    <td>${x.isConsumptionAllowed ? statusTag("good", "Allowed") : statusTag(x.accessDecisionReason === "notEntitled" ? "warn" : "block", splitCamel(x.accessDecisionReason || "blocked"))}</td>
    <td class="small muted">${fmtDate(x.dataStatus && x.dataStatus.lastModifiedDateTime)}</td></tr>`).join("");
  return `<div class="inner stack">
    ${u.error ? `<div class="msg error">${ic("i-error")}<div><b>HTTP ${esc(u.error.status)} ${esc(u.error.code || "")} ${esc(u.error.innerCode || "")}</b><br>${esc(u.error.message || "")}</div></div>` : ""}
    ${rows ? `<div class="tbl-wrap"><table class="sub-tbl"><thead><tr><th>Service</th><th>Policy</th><th class="num">Consumed</th><th class="num">Period limit</th><th class="num">Per-user limit</th><th class="num">Capacity</th><th class="num">Remaining</th><th>Access</th><th>As of</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}
    ${(b.unevaluatedServices || []).length ? `<div class="msg info">${ic("i-info")}<div>Not evaluated: ${b.unevaluatedServices.map((s) => `<code>${esc(typeof s === "string" ? s : `${s.serviceId} (${splitCamel(s.reason)})`)}</code>`).join(", ")}</div></div>` : ""}
    <div class="small muted">Groups: ${(u.groupIds || []).map((g) => esc(m.groupNames[g] || g)).join(", ") || "&ndash;"} &middot; User type: ${esc(u.userType || "-")} &middot; Evaluated ${fmtDate(sel.evaluatedDateTime)} &middot; Usage as of ${fmtDate(sel.usageAsOfDateTime)} &middot; <span class="mono">${esc(u.id)}</span></div>
  </div>`;
}
function toggleRow(tr) {
  if (tr.classList.contains("arow")) { toggleApiRow(tr); return; }
  const next = tr.nextElementSibling;
  if (next && next.classList.contains("xdetail")) { next.remove(); tr.classList.remove("open"); tr.setAttribute("aria-expanded", "false"); return; }
  const isUser = tr.classList.contains("urow");
  const item = isUser ? state.model.users.find((x) => x.id === tr.dataset.id) : state.model.pById[tr.dataset.id];
  if (!item) return;
  tr.classList.add("open");
  tr.setAttribute("aria-expanded", "true");
  tr.insertAdjacentHTML("afterend", `<tr class="xdetail"><td colspan="${tr.children.length}">${isUser ? userDetail(item) : policyDetail(item)}</td></tr>`);
}

/* ---------- diagnostics ---------- */
function endpointGroup(path) {
  const p = String(path || "");
  if (/userBalances/.test(p)) return "User balances";
  if (/spendingPolicies\/[^/]+\//.test(p)) return "Policy details";
  if (/spendingPolicies/.test(p)) return "Policy list";
  if (/^groups\//.test(p)) return "Group members";
  if (/getTenantCreditBalance/.test(p)) return "Credit balance";
  return "Tenant and sign-in";
}
function renderDiagnostics() {
  const d = state.data, g = d.generator || {}, o = d.options || {};
  const calls = Array.isArray(d.calls) ? d.calls : [], errors = Array.isArray(d.errors) ? d.errors : [], warnings = Array.isArray(d.warnings) ? d.warnings : [];
  const ok = calls.filter((c) => c.status >= 200 && c.status < 300).length;
  const nf404 = calls.filter((c) => c.status === 404).length;
  const throttled = calls.filter((c) => c.status === 429 || c.status >= 500).length;
  const other = calls.length - ok - nf404 - throttled;
  const ms = calls.map((c) => num(c.ms)).sort((a, b) => a - b);
  const q = (p) => (ms.length ? ms[Math.min(ms.length - 1, Math.floor(p * ms.length))] : 0);
  const groups = {};
  calls.forEach((c) => (groups[endpointGroup(c.path)] = (groups[endpointGroup(c.path)] || 0) + 1));
  const gl = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const gmax = Math.max(1, ...gl.map((x) => x[1]));
  const statusParts = [
    { v: ok, c: "var(--good)", label: `2xx: ${ok}`, name: "Success (2xx)" },
    { v: nf404, c: "var(--muted)", label: `404: ${nf404}`, name: "Not found (404, tolerated)" },
    { v: throttled, c: "var(--bad)", label: `429/5xx: ${throttled}`, name: "Throttled or server error" },
    { v: other, c: "var(--warn)", label: `Other: ${other}`, name: "Other client error" },
  ].filter((x) => x.v > 0);
  return `<header class="ch"><h2>${ic("i-pulse")}Diagnostics</h2><span class="hint">Collector run, warnings, errors and every API call</span></header>
  <div class="stats">
    <div><small>API calls</small><b>${count(calls.length)}</b></div>
    <div><small>Non-2xx</small><b class="${calls.length - ok ? "warn-t" : ""}">${count(calls.length - ok)}</b></div>
    <div><small>Duration</small><b>${nf(num(d.durationMs) / 1000, 1)} s</b></div>
    <div><small>Median / p95 latency</small><b>${nf(q(0.5))} / ${nf(q(0.95))} ms</b></div>
    <div><small>User scope</small><b class="txt">${esc(o.userScope || "-")}</b></div>
  </div>
  <div class="diag-grid">
    <div><h3>Responses by status</h3>${stackBar(statusParts, 1, { cls: "tall" })}
      <ul class="legend col">${statusParts.map((x) => `<li><i class="sw" style="--c:${x.c}"></i>${x.name}<b>${nf(x.v)}</b></li>`).join("")}</ul></div>
    <div><h3>Calls by endpoint</h3><div class="hrows compact">${gl.map(([k, v], i) => `<div class="hrow"><span class="hl">${esc(k)}</span>${stackBar([{ v, c: "var(--brand)", label: `${v} call(s)` }], v / gmax, { i })}<span class="hv">${nf(v)}</span></div>`).join("")}</div></div>
    <dl class="kvl run"><div><dt>Collector</dt><dd>${esc(g.name || "-")} ${g.version ? "v" + esc(g.version) : ""}</dd></div><div><dt>Platform</dt><dd>${esc(g.platform || "-")}</dd></div><div><dt>Runtime</dt><dd>${esc(g.runtime || "-")}</dd></div><div><dt>Max users</dt><dd>${esc(o.maxUsers == null ? "-" : o.maxUsers)}</dd></div><div><dt>Tenant ID</dt><dd class="mono small">${esc((d.tenant || {}).id || "-")}</dd></div></dl>
  </div>
  <div class="stack">
    ${warnings.map((w) => `<div class="msg warning">${ic("i-warn")}<div>${esc(w)}</div></div>`).join("")}
    ${errors.length ? `<div class="tbl-wrap"><table class="list"><thead><tr><th>Context</th><th>Status</th><th>Code</th><th>Message</th></tr></thead><tbody>${errors.map((e) => `<tr><td>${esc(e.context)}<div class="mono small muted">${esc(e.path)}</div></td><td>${statusTag("bad", e.status)}</td><td class="mono small">${esc(e.code || "")} ${esc(e.innerCode || "")}</td><td class="small">${esc(e.message || "")}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="msg success">${ic("i-ok")}<div>No collector errors. ${calls.length} read-only call(s) completed.</div></div>`}
    <details class="box" data-lazy="calls"><summary>${ic("i-chevron", "chev")}API call log <span class="count-pill">${calls.length}</span></summary><div class="content"></div></details>
    <details class="box" data-lazy="json"><summary>${ic("i-chevron", "chev")}Raw JSON</summary><div class="content"></div></details>
  </div>`;
}
function fillLazy(det) {
  const c = $(".content", det);
  if (c.dataset.done) return;
  c.dataset.done = "1";
  if (det.dataset.lazy === "calls") {
    const calls = state.data.calls || [];
    const kind = (s) => (s >= 200 && s < 300 ? "good" : s === 404 ? "skip" : "bad");
    c.innerHTML = `<div class="tbl-wrap"><table class="list dense"><thead><tr><th class="num">#</th><th>Method</th><th>Path (Graph beta)</th><th>Status</th><th class="num">ms</th></tr></thead><tbody>${calls.map((x, i) => `<tr><td class="num muted">${i + 1}</td><td class="mono">${esc(x.method)}</td><td class="mono path">${esc(x.path)}</td><td>${statusTag(kind(x.status), x.status)}</td><td class="num">${nf(num(x.ms))}</td></tr>`).join("")}</tbody></table></div>`;
  } else {
    c.innerHTML = `<pre class="json">${highlightJson(JSON.stringify(state.data, null, 2))}</pre>`;
  }
}

/* ---------- exports ---------- */
function exportCsv() {
  const m = state.model;
  const cell = (v) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const q = (x) => (!x ? "" : isUnlimited(x) ? "unlimited" : x.value);
  const head = ["displayName", "userPrincipalName", "userType", "groups", "status", "serviceId", "policy", "consumedCredits", "consumedUSD", "consumedEUR", "consumedNZD", "consumedAUD", "periodLimit", "perUserLimit", "effectiveCapacity", "remaining", "isConsumptionAllowed", "accessDecisionReason", "asOf", "error"];
  const rows = [];
  for (const u of filteredUsers()) {
    const base = [u.displayName, u.userPrincipalName, u.userType, (u.groupIds || []).map((g) => m.groupNames[g] || g).join(" | "), u.status];
    const err = u.error ? `${u.error.status} ${u.error.code || ""} ${u.error.innerCode || ""}`.trim() : "";
    if (!u.sb.length) { rows.push([...base, "", "", "", "", "", "", "", "", "", "", "", "", "", "", err]); continue; }
    for (const x of u.sb) {
      const c = num(x.consumedQuantity), usd = c * PRICING.usdPerCredit;
      rows.push([...base, x.serviceId, (m.pById[x.spendingPolicyId] || {}).displayName || x.spendingPolicyId, c, usd.toFixed(4), (usd * PRICING.rates.eur).toFixed(4), (usd * PRICING.rates.nzd).toFixed(4), (usd * PRICING.rates.aud).toFixed(4),
        q(x.configuredPeriodLimit), q(x.configuredPerUserLimit), q(x.effectiveCapacityQuantity), q(x.remainingQuantity), x.isConsumptionAllowed, x.accessDecisionReason, x.dataStatus && x.dataStatus.lastModifiedDateTime, err]);
    }
  }
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  download(`${fileStem()}-users.csv`, csv, "text/csv;charset=utf-8");
  toast(`Exported ${rows.length} row(s)`);
}
function fileStem() {
  const t = state.data.tenant || {};
  return "CopilotCostInventory-" + String(t.initialDomain || t.id || "tenant").replace(/\.onmicrosoft\.com$/, "").replace(/[^A-Za-z0-9-]/g, "-");
}
