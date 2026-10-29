/* ---------- synthetic demo tenant (no real data) ---------- */
function demoData() {
  let seed = 20261029;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const guid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.floor(rnd() * 16); return (c === "x" ? r : (r & 3) | 8).toString(16); });
  const now = Date.now(), iso = (msAgo = 0) => new Date(now - msAgo).toISOString(), DAY = 86400000;
  const lim = (v) => ({ "@odata.type": "#microsoft.graph.limitedCostManagementQuantity", value: v, unit: "copilotCredit" });
  const unl = () => ({ "@odata.type": "#microsoft.graph.unlimitedCostManagementQuantity", unit: "copilotCredit" });
  const pct = (v) => ({ "@odata.type": "#microsoft.graph.percentageCostManagementAlertThreshold", value: v });
  const abs = (v) => ({ "@odata.type": "#microsoft.graph.absoluteCostManagementAlertThreshold", value: v, unit: "copilotCredit" });
  const first = ["Adele", "Alex", "Allan", "Diego", "Emily", "Enrico", "Grady", "Henrietta", "Isaiah", "Johanna", "Joni", "Lee", "Lidia", "Lynne", "Megan", "Miriam", "Nestor", "Patti", "Pradeep", "Christie", "Ben", "Cameron", "Debra", "Irvin", "Lenore", "Mona", "Raul", "Sofia", "Tomas", "Yuki", "Zara", "Malik", "Nora", "Omar", "Priya", "Lukas", "Hannah", "Jonas", "Leonie", "Felix"];
  const last = ["Vance", "Wilber", "Deyoung", "Zarate", "Braun", "Gonzales", "Archie", "Cantrell", "Langer", "Lauer", "Sherman", "Gu", "Holloway", "Robbins", "Bowen", "Hagen", "Wilke", "Fernandez", "Gupta", "Cline", "Becker", "Schmidt", "Novak", "Tanaka", "Okafor", "Rossi", "Haddad", "Larsen", "Meyer", "Kovacs"];
  const tenantId = guid();
  const admin = { id: guid(), displayName: "Megan Bowen", userPrincipalName: "meganb@contoso.com" };
  const usedNames = new Set();
  const person = () => {
    let f, l, n;
    do { f = first[Math.floor(rnd() * first.length)]; l = last[Math.floor(rnd() * last.length)]; n = `${f} ${l}`; } while (usedNames.has(n));
    usedNames.add(n);
    return { id: guid(), displayName: n, userPrincipalName: `${f}.${l}`.toLowerCase() + "@contoso.com", userType: "Member" };
  };
  const defs = [
    { name: "Copilot Champions", billing: "prepaidCredits,payAsYouGo", period: unl(), perUser: lim(1500), status: "enabled", group: "Copilot Champions", members: 12, weight: 880,
      services: ["cowork", "workIQ", "sharePointCopilot", "oneDriveCopilot"], alerts: { isEnabled: true, thresholds: [pct(80), pct(100)] }, recipients: 2 },
    { name: "Sales Pay-as-you-go", billing: "payAsYouGo", period: lim(20000), perUser: lim(750), status: "enabled", group: "Sales EMEA", members: 18, weight: 560,
      services: ["cowork", "workIQ"], alerts: { isEnabled: true, thresholds: [abs(15000)] }, recipients: 1 },
    { name: "Finance Pilot", billing: "prepaidCredits", period: lim(5000), perUser: lim(250), status: "enabled", group: "Finance Pilot", members: 7, weight: 170,
      services: ["workIQ", "sharePointCopilot"], alerts: { isEnabled: false, thresholds: [pct(90)] }, recipients: 0 },
    { name: "External Contractors", billing: "payAsYouGo", period: lim(2000), perUser: lim(100), status: "disabled", group: "External Contractors", members: 4, weight: 0,
      services: ["cowork"], alerts: null, recipients: 0 },
  ];
  const split = { cowork: 0.55, workIQ: 0.25, sharePointCopilot: 0.12, oneDriveCopilot: 0.08 };
  const policies = [], users = [], calls = [];
  const call = (path, status = 200) => calls.push({ method: "GET", path, status, ms: Math.round(70 + rnd() * 320) });
  call("me?$select=id,displayName,userPrincipalName"); call("organization?$select=id,displayName,verifiedDomains");
  call("copilot/costManagement/getTenantCreditBalance"); call("copilot/costManagement/spendingPolicies");
  let prepaidUse = 0, paygUse = 0, errorDone = false;
  for (const d of defs) {
    const id = guid(), groupId = guid(), etag = `"${guid()}"`, created = iso((40 + rnd() * 120) * DAY);
    const base = `copilot/costManagement/spendingPolicies/${id}`;
    call(`${base}/serviceSettings`); call(`${base}/emailThresholdSettings`, d.alerts ? 200 : 404); call(`${base}/emailThresholdSettings/recipients`, d.alerts ? 200 : 404);
    call(`${base}/microsoft.graph.selectedGroupsSpendingPolicy/assignedGroups`);
    call(`groups/${groupId}/transitiveMembers/microsoft.graph.user?$select=id,displayName,userPrincipalName,userType&$top=999`);
    const recipients = [admin, person()].slice(0, d.recipients).map((r) => ({ id: r.id, displayName: r.displayName, userPrincipalName: r.userPrincipalName, mail: r.userPrincipalName }));
    policies.push({
      "@odata.type": "#microsoft.graph.selectedGroupsSpendingPolicy", "@odata.etag": etag, id, displayName: d.name, status: d.status, billingMethods: d.billing,
      createdDateTime: created, lastModifiedDateTime: iso(rnd() * 20 * DAY), periodLimit: d.period, perUserLimit: d.perUser,
      createdBy: { user: { id: admin.id } }, lastModifiedBy: { user: { id: admin.id } },
      createdByResolved: { id: admin.id, displayName: admin.displayName, userPrincipalName: admin.userPrincipalName }, lastModifiedByResolved: { id: admin.id, displayName: admin.displayName, userPrincipalName: admin.userPrincipalName },
      serviceSettings: d.services.map((s) => ({ serviceId: s, state: "enabled", parentStatus: d.status, parentEtag: etag })),
      alertSettings: d.alerts ? { "@odata.etag": `"${guid()}"`, id, isEnabled: d.alerts.isEnabled, thresholds: d.alerts.thresholds } : null,
      alertRecipients: recipients,
      assignedGroups: [{ id: groupId, displayName: d.group, description: `Audience for the '${d.name}' spending policy`, mail: null, securityEnabled: true, groupTypes: [], membershipRule: null, transitiveUserMembers: d.members }],
    });
    for (let m = 0; m < d.members; m++) {
      const u = person();
      const path = `copilot/costManagement/userBalances/${u.id}?$expand=serviceBalances`;
      if (!errorDone && d.name.startsWith("Sales") && m === 5) {
        errorDone = true;
        for (let a = 0; a < 4; a++) call(path, 503);
        users.push(Object.assign(u, { groupIds: [groupId], balance: null, error: { status: 503, code: "serviceUnavailable", innerCode: "sourceUnavailable", message: "The usage data source is temporarily unavailable. Try again later." } }));
        continue;
      }
      call(path);
      const total = d.status === "enabled" ? d.weight * (0.08 + Math.pow(rnd(), 1.7) * 1.9) : 0;
      const limit = qv(d.perUser);
      const capped = limit != null ? Math.min(total, limit) : total;
      const exhausted = limit != null && total >= limit;
      const stamp = iso(rnd() * 3 * 3600000);
      const share = d.services.reduce((s, x) => s + split[x], 0);
      const serviceBalances = d.services.map((s) => {
        const used = d.status === "enabled" ? capped * (split[s] / share) * (0.85 + rnd() * 0.3) : 0;
        const allowed = d.status === "enabled" && !exhausted;
        return {
          serviceId: s, spendingPolicyId: id, consumedQuantity: Math.round(used * 100) / 100, unit: "copilotCredit",
          isConsumptionAllowed: allowed, accessDecisionReason: allowed ? "allowed" : d.status !== "enabled" ? "notEntitled" : "limitExhausted",
          configuredPeriodLimit: d.period, configuredPerUserLimit: d.perUser,
          effectiveCapacityQuantity: limit != null ? lim(limit) : unl(),
          remainingQuantity: limit != null ? lim(Math.max(0, Math.round((limit - capped) * 100) / 100)) : unl(),
          dataStatus: { lastModifiedDateTime: stamp },
        };
      });
      const used = serviceBalances.reduce((s, x) => s + x.consumedQuantity, 0);
      if (d.billing.startsWith("prepaid")) prepaidUse += used * (d.billing.includes("payAsYouGo") ? 0.7 : 1);
      if (d.billing.includes("payAsYouGo")) paygUse += used * (d.billing.startsWith("prepaid") ? 0.3 : 1);
      users.push(Object.assign(u, {
        groupIds: [groupId], error: null,
        balance: { id: u.id, unevaluatedServices: [], serviceBalances,
          selectionDataStatus: { evaluatedDateTime: stamp, policyConfigurationAsOfDateTime: stamp, groupMembershipAsOfDateTime: stamp, usageAsOfDateTime: stamp } },
      }));
    }
  }
  const asOf = iso(2.5 * 3600000);
  return {
    schema: "copilot-cost-inventory/v1",
    generatedAt: iso(0),
    generator: { name: "Demo data", version: "1.0.0", platform: "demo", runtime: "Synthetic Contoso dataset (no real tenant data)", poweredBy: "Copilot Coaching (copilot-coaching.de)" },
    tenant: { id: tenantId, displayName: "Contoso Ltd. (demo)", defaultDomain: "contoso.com", initialDomain: "contoso.onmicrosoft.com" },
    signedInUser: admin,
    options: { userScope: "PolicyMembers", maxUsers: 500 },
    creditBalance: { billingMethodBalances: [
      { billingMethod: "prepaidCredits", purchasedQuantity: 100000, consumedQuantity: Math.round(prepaidUse * 1.35), remainingQuantity: 100000 - Math.round(prepaidUse * 1.35), unit: "copilotCredit", dataStatus: { lastModifiedDateTime: asOf } },
      { billingMethod: "payAsYouGo", consumedQuantity: Math.round(paygUse * 1.2), unit: "copilotCredit", dataStatus: { lastModifiedDateTime: asOf } },
    ] },
    policies, users,
    warnings: ["Demo data: synthetic values for illustration only."],
    errors: [],
    calls,
    durationMs: calls.reduce((s, c) => s + c.ms, 0),
  };
}
