/* ---------- API reference ---------- */
const DOCS_BASE = "https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/admin-settings/cost-management/";
const DOCS_OVERVIEW = DOCS_BASE + "overview";
const GRAPH_BASE = "https://graph.microsoft.com/beta";
const P = {
  read: "CopilotCostManagement.Read.All", policyR: "CopilotCostManagement-Policy.Read.All", policyW: "CopilotCostManagement-Policy.ReadWrite.All",
  assignR: "CopilotCostManagement-Assignment.Read.All", assignW: "CopilotCostManagement-Assignment.ReadWrite.All", user: "CopilotCostManagement-UserData.Read.All",
};
const POLICY = "/copilot/costManagement/spendingPolicies/{id}";
// Operation list of the official overview; collector marks the calls the collector scripts make.
const API_GROUPS = [
  { title: "Tenant credit balance", icon: "i-wallet", ops: [
    { key: "tenantBalance", name: "Get tenant credit balance", method: "GET", path: "/copilot/costManagement/getTenantCreditBalance", doc: "costmanagementroot-gettenantcreditbalance", perm: P.read, desc: "Get the tenant-wide credit balance snapshot, one row per billing method. Also supports the application permission.", collector: true },
  ] },
  { title: "Spending policies", icon: "i-policy", ops: [
    { key: "listPolicies", name: "List spendingPolicies", method: "GET", path: "/copilot/costManagement/spendingPolicies", doc: "spendingpolicy-list", perm: P.policyR, desc: "Get a list of spending policies. Supports $filter, $orderby, $count, $top and $select.", collector: true },
    { key: "createPolicy", name: "Create spendingPolicy", method: "POST", path: "/copilot/costManagement/spendingPolicies", doc: "spendingpolicy-create", perm: P.policyW, desc: "Create a new spending policy. Also requires the Billing Administrator or Global Administrator role." },
    { key: "getPolicy", name: "Get spendingPolicy", method: "GET", path: POLICY, doc: "spendingpolicy-get", perm: P.policyR, desc: "Retrieve a spending policy, including its ETag." },
    { key: "updatePolicy", name: "Update spendingPolicy", method: "PATCH", path: POLICY, doc: "spendingpolicy-update", perm: P.policyW, desc: "Update a spending policy. Requires If-Match with the current ETag." },
    { key: "deletePolicy", name: "Delete spendingPolicy", method: "DELETE", path: POLICY, doc: "spendingpolicy-delete", perm: P.policyW, desc: "Delete a spending policy." },
  ] },
  { title: "Group audience", icon: "i-people", ops: [
    { key: "listGroups", name: "List assignedGroups", method: "GET", path: POLICY + "/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups", doc: "selectedgroupsspendingpolicy-list-assignedgroups", perm: P.assignR, desc: "List the groups assigned to a policy.", collector: true },
    { key: "addGroup", name: "Add assignedGroup", method: "POST", path: POLICY + "/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups/$ref", doc: "selectedgroupsspendingpolicy-post-assignedgroups", perm: P.assignW, desc: "Add a group reference to a policy." },
    { key: "removeGroup", name: "Remove assignedGroup", method: "DELETE", path: POLICY + "/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups/{groupId}/$ref", doc: "selectedgroupsspendingpolicy-delete-assignedgroups", perm: P.assignW, desc: "Remove a group reference. The last group can't be removed." },
  ] },
  { title: "Service settings", icon: "i-flash", ops: [
    { key: "listServiceSettings", name: "List spendingPolicyServiceSettings", method: "GET", path: POLICY + "/serviceSettings", doc: "spendingpolicyservicesetting-list", perm: P.policyR, desc: "List the service settings of a policy.", collector: true },
    { key: "createServiceSetting", name: "Create spendingPolicyServiceSetting", method: "POST", path: POLICY + "/serviceSettings", doc: "spendingpolicyservicesetting-create", perm: P.policyW, desc: "Add a service to a policy." },
    { key: "getServiceSetting", name: "Get spendingPolicyServiceSetting", method: "GET", path: POLICY + "/serviceSettings/{serviceId}", doc: "spendingpolicyservicesetting-get", perm: P.policyR, desc: "Retrieve a service setting." },
    { key: "updateServiceSetting", name: "Update spendingPolicyServiceSetting", method: "PATCH", path: POLICY + "/serviceSettings/{serviceId}", doc: "spendingpolicyservicesetting-update", perm: P.policyW, desc: "Update a service setting. There is no DELETE: set state to disabled instead." },
  ] },
  { title: "Alerts and recipients", icon: "i-bell", ops: [
    { key: "getAlertSetting", name: "Get costManagementAlertSetting", method: "GET", path: POLICY + "/emailThresholdSettings", doc: "costmanagementalertsetting-get", perm: P.policyR, desc: "Retrieve the alert configuration of a policy. Returns 404 if none is configured.", collector: true },
    { key: "updateAlertSetting", name: "Update costManagementAlertSetting", method: "PATCH", path: POLICY + "/emailThresholdSettings", doc: "costmanagementalertsetting-update", perm: P.policyW, desc: "Create or update the alert configuration." },
    { key: "deleteAlertSetting", name: "Delete costManagementAlertSetting", method: "DELETE", path: POLICY + "/emailThresholdSettings", doc: "costmanagementalertsetting-delete", perm: P.policyW, desc: "Delete the alert configuration." },
    { key: "listRecipients", name: "List recipients", method: "GET", path: POLICY + "/emailThresholdSettings/recipients", doc: "costmanagementalertsetting-list-recipients", perm: P.policyR, desc: "List the alert recipients.", collector: true },
    { key: "addRecipient", name: "Add recipient", method: "POST", path: POLICY + "/emailThresholdSettings/recipients/$ref", doc: "costmanagementalertsetting-post-recipients", perm: P.policyW, desc: "Add an alert recipient." },
    { key: "removeRecipient", name: "Remove recipient", method: "DELETE", path: POLICY + "/emailThresholdSettings/recipients/{userId}/$ref", doc: "costmanagementalertsetting-delete-recipients", perm: P.policyW, desc: "Remove an alert recipient." },
  ] },
  { title: "User balances", icon: "i-person", ops: [
    { key: "getUserBalance", name: "Get costManagementUserBalance", method: "GET", path: "/copilot/costManagement/userBalances/{userId}", doc: "costmanagementuserbalance-get", perm: P.user, desc: "Retrieve a user's consumption balance. Supports $expand=serviceBalances. The collection itself isn't listable.", collector: true },
    { key: "listServiceBalances", name: "List costManagementUserServiceBalances", method: "GET", path: "/copilot/costManagement/userBalances/{userId}/serviceBalances", doc: "costmanagementuserservicebalance-list", perm: P.user, desc: "List a user's per-service balance rows." },
    { key: "getServiceBalance", name: "Get costManagementUserServiceBalance", method: "GET", path: "/copilot/costManagement/userBalances/{userId}/serviceBalances/{serviceId}", doc: "costmanagementuserservicebalance-get", perm: P.user, desc: "Retrieve one service's balance row for a user." },
  ] },
];
const API_OPS = API_GROUPS.flatMap((g) => g.ops);
const API_PERMS = [
  [P.read, "Read the tenant credit balance snapshot (delegated and application)."],
  [P.policyR, "Read spending policies, per-service settings, alert thresholds and recipients."],
  [P.policyW, "Create, update and delete policies, service settings, alerts and recipients."],
  [P.assignR, "Read a policy's group audience."],
  [P.assignW, "Add and remove a policy's group audience."],
  [P.user, "Read a named user's balance diagnostics, including consumption and the selected spendingPolicyId."],
];
// Documented error conditions; seen = sample index in API_SAMPLES.errors that reproduced it
const API_ERRORS = [
  { cond: "Caller lacks the required permission or a qualifying directory role", http: 403, code: "Authorization_RequestDenied" },
  { cond: "Unsupported query option or malformed request", http: 400, code: "invalidRequest, unsupportedQuery" },
  { cond: "Removing the last assigned group would leave the policy without an audience", http: 409, code: "lastAssignedGroup", seen: 10 },
  { cond: "Another non-disabled tenant-wide policy already governs the same service", http: 409, code: "allUsersServiceConflict" },
  { cond: "A group-scoped policy shares an assigned group and an enabled service with another non-disabled policy", http: 409, code: "groupServiceConflict" },
  { cond: "Disabling the last enabled service on a policy that has service settings", http: 409, code: "atLeastOneServiceRequired", seen: 5 },
  { cond: "Alert threshold out of range (percentage thresholds must be an integer 1-100)", http: 400, code: "invalidAlertThreshold", seen: 6 },
  { cond: "PATCH on a policy that isn't in an editable state", http: 400, code: "policyNotEditableWhilePending" },
  { cond: "Unknown or invalid service ID", http: 400, code: "invalidService", seen: 4 },
  { cond: "Alerting enabled with no recipient, or removing the last recipient while alerting is enabled", http: 400, code: "alertRecipientsRequired", seen: 7 },
  { cond: "Alert recipient doesn't resolve to a user in the tenant directory", http: 400, code: "alertRecipientNotFound", seen: 8 },
  { cond: "Supplying a server-managed field on PATCH", http: 400, code: "invalidRequest", seen: 2 },
  { cond: "Stale If-Match on a mutating operation", http: 412, code: "preconditionFailed", seen: 1 },
  { cond: "Conflicting concurrent state transition", http: 409, code: "invalidTransition", seen: 3 },
  { cond: "Upstream evaluator failed for every service, so no balance row could be produced", http: 503, code: "sourceUnavailable" },
  { cond: "API throttling", http: 429, code: "tooManyRequests" },
];
// Behaviour seen in the test run that the overview does not list
const API_OBSERVED = [
  { cond: "Mutating request without an If-Match header", seen: 0 },
  { cond: "Alert configuration read before one exists, or after it was deleted", seen: 11 },
  { cond: "Listing the userBalances collection (not listable)", seen: 12 },
  { cond: "Reading a deleted policy", seen: 13 },
];
const api = { method: "all", collector: false, q: "" };

const methodTag = (m) => `<span class="mtag ${esc(m.toLowerCase())}">${esc(m)}</span>`;
const docLink = (slug, text) => `<a href="${DOCS_BASE}${esc(slug)}" target="_blank" rel="noopener">${text}</a>`;
const pathHtml = (p) => esc(p).replace(/\//g, "/<wbr>").replace(/\{(\w+)\}/g, `<span class="ph">{$1}</span>`);
const statusKind = (s) => { const n = parseInt(s, 10); return n < 300 ? "good" : n === 404 ? "skip" : "bad"; };

function sampleHtml(s, note) {
  if (!s) return "";
  const req = [`${s.method} ${GRAPH_BASE}/${s.path}`, ...s.headers].join("\n");
  return `<div class="io">
    <div><h4>Request</h4><pre class="json">${esc(req)}${s.body ? "\n\n" + highlightJson(s.body) : ""}</pre></div>
    <div><h4>Response ${statusTag(statusKind(s.status), s.status)}</h4><pre class="json">${s.response ? highlightJson(s.response) : `<span class="muted">No content</span>`}</pre></div>
  </div>${note ? `<p class="small muted">${note}</p>` : ""}`;
}
function apiDetail(op) {
  const s = API_SAMPLES.ops[op.key];
  const notes = {
    getServiceBalance: "The test user had no balance row for this service, so the call returned 404.",
    listRecipients: "Returns full user objects; the sample is trimmed to a few properties.",
    listGroups: "Returns full group objects; the sample is trimmed to a few properties.",
  };
  return `<div class="inner api-detail">
    <div class="api-meta">
      <span>${ic("i-key")}<code>${esc(op.perm)}</code></span>
      <span>${ic("i-open")}${docLink(op.doc, "Open in Microsoft Learn")}</span>
      ${op.collector ? `<span>${ic("i-code")}Called by the collector scripts</span>` : `<span>${ic("i-info")}Not called by the read-only collector</span>`}
    </div>
    ${s ? `<h4 class="api-sample-title">Sample: ${esc(s.title)}</h4>${sampleHtml(s, notes[op.key])}` : ""}
  </div>`;
}
function apiFiltered() {
  const q = api.q.trim().toLowerCase();
  return (op) => (api.method === "all" || op.method === api.method) && (!api.collector || op.collector) &&
    (!q || [op.name, op.path, op.perm, op.desc].join(" ").toLowerCase().includes(q));
}
function renderApiRows() {
  const match = apiFiltered();
  let shown = 0;
  $("#apiBody").innerHTML = API_GROUPS.map((g) => {
    const ops = g.ops.filter(match);
    shown += ops.length;
    if (!ops.length) return "";
    return `<tr class="grp"><th colspan="5">${ic(g.icon)}${esc(g.title)} <span class="count-pill">${ops.length}</span></th></tr>` + ops.map((op) => `
      <tr class="arow xrow" data-key="${op.key}" tabindex="0" aria-expanded="false">
        <td class="xcol">${ic("i-chevron", "chev")}</td>
        <td>${methodTag(op.method)}</td>
        <td class="lead-cell"><b>${esc(op.name)}</b><small>${esc(op.desc)}</small></td>
        <td class="mono path">${pathHtml(op.path)}</td>
        <td>${op.collector ? `<span class="tag" title="Called by the collector scripts">Collector</span>` : ""}</td>
      </tr>`).join("");
  }).join("") || `<tr><td colspan="5"><div class="empty">${ic("i-search")}No operations match the filter.</div></td></tr>`;
  $("#apiCount").textContent = `${shown} of ${API_OPS.length} operations`;
  $$(".pill[data-action=apimethod]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === api.method)));
  $(".pill[data-action=apicollector]").setAttribute("aria-pressed", String(api.collector));
}
function toggleApiRow(tr) {
  const next = tr.nextElementSibling;
  if (next && next.classList.contains("xdetail")) { next.remove(); tr.classList.remove("open"); tr.setAttribute("aria-expanded", "false"); return; }
  const op = API_OPS.find((o) => o.key === tr.dataset.key);
  const seen = tr.dataset.seen != null ? API_SAMPLES.errors[+tr.dataset.seen] : null;
  if (!op && !seen) return;
  tr.classList.add("open");
  tr.setAttribute("aria-expanded", "true");
  const html = op ? apiDetail(op) : `<div class="inner">${sampleHtml(seen)}</div>`;
  tr.insertAdjacentHTML("afterend", `<tr class="xdetail"><td colspan="${tr.children.length}">${html}</td></tr>`);
}
function renderApi() {
  const count = (m) => API_OPS.filter((o) => o.method === m).length;
  const errRow = (e) => {
    const s = e.seen == null ? null : API_SAMPLES.errors[e.seen];
    const http = e.http || (s ? parseInt(s.status, 10) : "");
    const cells = `<td>${esc(e.cond)}</td><td class="num">${http}</td><td class="mono small">${esc(e.code || "")}</td>
      <td>${s ? statusTag(statusKind(s.status), s.status) : `<span class="muted small">Not reproduced</span>`}</td>`;
    return s ? `<tr class="arow xrow" data-seen="${e.seen}" tabindex="0" aria-expanded="false"><td class="xcol">${ic("i-chevron", "chev")}</td>${cells}</tr>`
      : `<tr><td class="xcol"></td>${cells}</tr>`;
  };
  $("#apiRef").innerHTML = `
    <div class="stats api-stats">
      <div><small>Base URL</small><b class="txt mono">${GRAPH_BASE}/copilot/costManagement</b></div>
      <div><small>Operations</small><b>${API_OPS.length}</b></div>
      <div><small>Read / write</small><b>${count("GET")} / ${API_OPS.length - count("GET")}</b></div>
      <div><small>Used by collector</small><b>${API_OPS.filter((o) => o.collector).length}</b></div>
    </div>
    <div class="toolbar">
      <label class="search">${ic("i-search")}<input id="apiq" type="search" placeholder="Search operations, paths, permissions" aria-label="Search operations"></label>
      <span class="pills" role="group" aria-label="HTTP method">${["all", "GET", "POST", "PATCH", "DELETE"].map((m) => `<button class="pill" data-action="apimethod" data-v="${m}" aria-pressed="false">${m === "all" ? "All" : m}${m === "all" ? "" : ` <b>${count(m)}</b>`}</button>`).join("")}</span>
      <button class="pill" data-action="apicollector" aria-pressed="false">${ic("i-code")}Collector only</button>
      <span class="spacer"></span><span class="muted small" id="apiCount"></span>
    </div>
    <div class="tbl-wrap"><table class="list api-list">
      <thead><tr><th class="xcol"><span class="sr">Expand</span></th><th>Method</th><th>Operation</th><th>Path</th><th></th></tr></thead>
      <tbody id="apiBody"></tbody>
    </table></div>
    <p class="small muted api-foot">Select an operation to see its permission, a link to its documentation page and a sample request and response.
      Samples were recorded against a test tenant; identifiers, names and amounts are replaced with Contoso placeholders.</p>
    <div class="stack">
      <details class="box"><summary>${ic("i-chevron", "chev")}${ic("i-key")}Permissions <span class="count-pill">${API_PERMS.length}</span></summary>
        <div class="tbl-wrap"><table class="list"><thead><tr><th>Permission</th><th>Operations</th></tr></thead><tbody>
          ${API_PERMS.map(([p, d]) => `<tr><td class="mono small">${esc(p)}</td><td>${esc(d)}</td></tr>`).join("")}</tbody></table></div>
        <p class="small muted pad">Most operations support only delegated (work or school account) permissions. Personal Microsoft accounts aren't supported. Choose the least privileged permission for each operation.</p>
      </details>
      <details class="box"><summary>${ic("i-chevron", "chev")}${ic("i-lock")}Concurrency and removal semantics</summary>
        <ul class="pad bullets">
          <li>To change a policy or its child resources (service settings and reference links), send <code>If-Match</code> with the parent policy's ETag. Child resources have no ETag of their own; a service setting shows it as <code>parentEtag</code>. Creating a policy doesn't use <code>If-Match</code>.</li>
          <li>Every successful change returns a new ETag. Read the policy again before the next change.</li>
          <li><code>serviceSettings</code> has no <code>DELETE</code>. Set <code>state</code> to <code>disabled</code> to remove a service; the entry stays.</li>
          <li><code>assignedGroups</code> and <code>recipients</code> are reference navigation properties. Add and remove them with <code>$ref</code>.</li>
        </ul>
      </details>
      <details class="box"><summary>${ic("i-chevron", "chev")}${ic("i-warn")}Error conditions <span class="count-pill">${API_ERRORS.length + API_OBSERVED.length}</span></summary>
        <div class="tbl-wrap"><table class="list errs"><thead><tr><th class="xcol"><span class="sr">Expand</span></th><th>Condition</th><th class="num">HTTP</th><th>Documented code</th><th>Observed in the test run</th></tr></thead><tbody>
          ${API_ERRORS.map(errRow).join("")}
          <tr class="grp"><th colspan="5">${ic("i-info")}Observed but not listed in the overview</th></tr>
          ${API_OBSERVED.map(errRow).join("")}
        </tbody></table></div>
        <p class="small muted pad">Errors use the OData <code>error</code> and <code>innerError</code> envelope. Some workload codes appear in <code>innerError.code</code> while <code>error.code</code> is generic, for example <code>badRequest</code> with <code>invalidService</code>. Row-level security runs first, so out-of-scope resources return 404 instead of 403.</p>
      </details>
    </div>`;
  renderApiRows();
  $("#apiq").addEventListener("input", (e) => { api.q = e.target.value; renderApiRows(); });
}
