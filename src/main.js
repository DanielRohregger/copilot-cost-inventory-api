/* ---------- scripts section ---------- */
function detectOs() {
  const p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "").toLowerCase();
  if (/mac|iphone|ipad/.test(p)) return "macos";
  if (/win/.test(p)) return "windows";
  return "other";
}
const OS_ICONS = { windows: "i-windows", macos: "i-command" };
function renderScripts() {
  const os = detectOs();
  const cards = [
    { key: "ps1", os: "windows", title: "Windows", sub: "PowerShell 5.1 or 7 &middot; also runs on macOS/Linux with pwsh",
      cmd: "cd $HOME\\Downloads\npowershell -ExecutionPolicy Bypass -File .\\Get-CopilotCostInventory.ps1",
      hint: "Needs the Microsoft.Graph.Authentication module; the script asks before installing it for the current user. Opens a browser sign-in. Add <code>-UseDeviceCode</code> on servers without a browser." },
    { key: "sh", os: "macos", title: "macOS", sub: "zsh + built-in osascript &middot; no installs required",
      cmd: "cd ~/Downloads\nzsh get-copilot-cost-inventory.sh",
      hint: "Signs in with a device code: the sign-in page opens and the code is copied to your clipboard. If Conditional Access blocks device code flow, use the PowerShell script with <code>pwsh</code>." },
  ];
  $("#dlGrid").innerHTML = cards.map((c) => {
    const e = EMBED[c.key] || {};
    return `<div class="dl ${os === c.os ? "rec" : ""}">
      <div class="os"><span class="os-tile ${c.os}">${ic(OS_ICONS[c.os])}</span><div><h3>${c.title}</h3><small>${c.sub}</small></div>
        ${os === c.os ? `<span class="tag">Recommended for this device</span>` : ""}</div>
      <div class="row"><button class="btn primary" data-action="dl" data-key="${c.key}" ${e.b64 ? "" : "disabled"}>${ic("i-download")}Download ${esc(e.name || "script")}</button>
        <span class="muted small">${e.bytes ? `${nf(e.bytes / 1024, 1)} KB &middot; ${nf(e.lines)} lines &middot; v${esc(e.version || "")}` : "not embedded"}</span></div>
      <div class="cmd"><pre>${esc(c.cmd)}</pre><button class="btn subtle small" data-action="copy" data-text="${esc(c.cmd)}" aria-label="Copy commands">${ic("i-copy")}Copy</button></div>
      <p class="small muted">${c.hint}</p>
      ${e.sha256 ? `<div class="facts"><span>SHA-256</span><code>${esc(e.sha256)}</code></div>` : ""}
      <details class="box" data-preview="${c.key}"><summary>${ic("i-chevron", "chev")}View script source</summary><pre class="mono src"></pre></details>
    </div>`;
  }).join("");
}

/* ---------- import ---------- */
function loadInventory(text, fileName) {
  let d;
  try { d = JSON.parse(String(text).replace(/^\uFEFF/, "")); }
  catch (e) { toast("This file is not valid JSON.", true); return false; }
  if (!d || typeof d.schema !== "string" || !d.schema.startsWith("copilot-cost-inventory/")) {
    toast("Not a Copilot Cost Inventory file (schema copilot-cost-inventory/v1 expected).", true);
    return false;
  }
  state.data = d; state.fileName = fileName || ""; state.model = analyze(d); state.userLimit = 200;
  document.body.dataset.view = "dash";
  document.title = `${(d.tenant && d.tenant.displayName) || "Tenant"} - Copilot Cost Inventory`;
  renderDashboard();
  setUnit(state.unit);
  window.scrollTo({ top: 0 });
  moveNavIndicator();
  toast(`Imported ${state.model.policies.length} policies and ${state.model.users.length} users`);
  return true;
}
function readFile(file) {
  if (!file) return;
  if (file.size > 200 * 1024 * 1024) { toast("File is larger than 200 MB.", true); return; }
  const r = new FileReader();
  r.onload = () => loadInventory(r.result, file.name);
  r.onerror = () => toast("Could not read the file.", true);
  r.readAsText(file);
}
function goHome() {
  document.body.dataset.view = "landing";
  document.title = "Copilot Cost Inventory";
  state.data = null; state.model = null;
  $("#dash").innerHTML = "";
  $("#dash").className = "view-dash";
  $("#suiteTenant").textContent = "";
  $("#file").value = "";
  window.scrollTo({ top: 0 });
  observeReveals();
}

/* ---------- nav indicator ---------- */
function moveNavIndicator() {
  const nav = $("nav.nav-dash"), a = $("a.active", nav), ind = $(".ind", nav);
  if (!a || !nav.offsetParent) return;
  ind.style.setProperty("--y", a.offsetTop + "px");
  ind.style.setProperty("--sy", ((a.offsetHeight - 16) / 20).toFixed(3));
  ind.style.setProperty("--x", a.offsetLeft + "px");
  ind.style.setProperty("--sx", ((a.offsetWidth - 20) / 100).toFixed(3));
  nav.classList.add("ready");
  if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: REDUCED ? "auto" : "smooth" });
}

function setNav(collapsed, animate) {
  const apply = () => {
    document.body.classList.toggle("nav-collapsed", collapsed);
    const btn = $("#navToggle"), label = collapsed ? "Expand navigation" : "Collapse navigation";
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", label);
    btn.dataset.tip = label;
    moveNavIndicator();
  };
  try { localStorage.setItem("cci-nav", collapsed ? "collapsed" : "expanded"); } catch (_) { /* storage blocked */ }
  if (animate && !REDUCED && document.startViewTransition) document.startViewTransition(apply);
  else apply();
}

/* ---------- events ---------- */
function bindEvents() {
  $("#file").addEventListener("change", (e) => readFile(e.target.files[0]));
  $("#dropzone").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#file").click(); } });
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
  addEventListener("dragenter", (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; document.body.classList.add("dragging"); });
  addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; document.body.classList.remove("dragging"); } });
  addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove("dragging");
    readFile(e.dataTransfer.files[0]);
  });

  $$(".unit-switch button").forEach((b) => b.addEventListener("click", () => setUnit(b.dataset.unit)));

  document.addEventListener("click", (e) => {
    const row = e.target.closest("tr.xrow");
    if (row && !e.target.closest("a, button")) { toggleRow(row); return; }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    if (a === "home") { e.preventDefault(); goHome(); }
    else if (a === "nav") setNav(!document.body.classList.contains("nav-collapsed"), true);
    else if (a === "pick") $("#file").click();
    else if (a === "demo") loadInventory(JSON.stringify(demoData()), "demo-data.json");
    else if (a === "csv") exportCsv();
    else if (a === "json") download(state.fileName && state.fileName !== "demo-data.json" ? state.fileName : `${fileStem()}.json`, JSON.stringify(state.data, null, 2), "application/json");
    else if (a === "print") print();
    else if (a === "more") { state.userLimit += 200; renderUsers(); }
    else if (a === "ufilter") { $("#ustatus").value = el.dataset.v; state.userLimit = 200; renderUsers(); }
    else if (a === "copy") copyText(el.dataset.text);
    else if (a === "dl") {
      const s = EMBED[el.dataset.key];
      if (!s) return;
      download(s.name, b64ToBytes(s.b64));
      toast(`Downloaded ${s.name}`);
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("tr.xrow")) { e.preventDefault(); toggleRow(e.target); }
  });
  document.addEventListener("toggle", (e) => {
    const det = e.target;
    if (!det.open) return;
    if (det.dataset.lazy) fillLazy(det);
    if (det.dataset.preview) {
      const pre = $("pre", det), s = EMBED[det.dataset.preview];
      if (s && !pre.textContent) pre.textContent = b64ToText(s.b64);
    }
  }, true);

  // highlight the section in view and slide the indicator to it
  addEventListener("resize", moveNavIndicator);
  if ("IntersectionObserver" in window) {
    const navObs = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$("nav.nav-dash a").forEach((a) => {
        const on = a.getAttribute("href") === "#" + en.target.id;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
      moveNavIndicator();
    }), { rootMargin: "-30% 0px -60% 0px" });
    const watch = () => ["overview", "policies", "users", "diagnostics", "scripts"].forEach((id) => { const el = document.getElementById(id); if (el) navObs.observe(el); });
    new MutationObserver(watch).observe($("#dash"), { childList: true });
    watch();
  }
}

/* ---------- init ---------- */
renderScripts();
bindEvents();
setUnit(state.unit);
try { if (localStorage.getItem("cci-nav") === "collapsed") setNav(true, false); } catch (_) { /* storage blocked */ }
observeReveals();
if (/[?#&]demo\b/.test(location.search + location.hash)) loadInventory(JSON.stringify(demoData()), "demo-data.json");
