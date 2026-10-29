"use strict";
/* ---------- embedded content (filled by build.mjs) ---------- */
const EMBED = /*@EMBED@*/ {} /*@END@*/;

/* ---------- constants ---------- */
const PRICING = { usdPerCredit: 0.01, eurPerUsd: 0.92 }; // PAYG list price per Copilot Credit; generic average EUR rate
const SERVICE_LABELS = { cowork: "Copilot Cowork", workIQ: "Work IQ", sharePointCopilot: "SharePoint Copilot", oneDriveCopilot: "OneDrive Copilot" };
const SERVICE_LOGOS = { cowork: "cowork", sharePointCopilot: "sharepoint", oneDriveCopilot: "onedrive" }; // product logos, .lg-* in styles.css
const SERVICE_COLORS = ["var(--v1)", "var(--v2)", "var(--v3)", "var(--v4)", "var(--v5)", "var(--v6)", "var(--v7)", "var(--v8)"]; // Fluent data-viz order, light and dark values in styles.css
const BILLING_LABELS = { prepaidCredits: "Prepaid credits", payAsYouGo: "Pay-as-you-go" };
const UNITS = ["credits", "usd", "eur"];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = { data: null, model: null, fileName: "", unit: localStorage.getItem("cci-unit") || "credits", userLimit: 200 };

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const splitCamel = (s) => String(s || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const isUnlimited = (q) => !!q && /unlimited/i.test(q["@odata.type"] || "");
const qv = (q) => (q && !isUnlimited(q) && typeof q.value === "number" ? q.value : null);
const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
const clamp01 = (v) => Math.max(0, Math.min(1, v || 0));
const svcName = (id) => SERVICE_LABELS[id] || splitCamel(id);
const nf = (v, d = 0) => new Intl.NumberFormat(undefined, { maximumFractionDigits: d }).format(v);
const pctText = (p) => `${nf(p * 100, p > 0 && p < 0.1 ? 1 : 0)}%`;
const ic = (name, cls = "") => `<svg class="i ${cls}" aria-hidden="true"><use href="#${name}"/></svg>`;
const logo = (name) => `<i class="logo lg-${name}" aria-hidden="true"></i>`;
function svcIcon(id) {
  const key = String(id || "");
  if (SERVICE_LOGOS[key]) return logo(SERVICE_LOGOS[key]);
  if (/agent/i.test(key)) return logo("agent");
  if (/code/i.test(key)) return ic("s-code");
  return ic(SERVICE_LABELS[key] ? "s-" + key : "i-flash");
}
const creditGlyph = `<svg class="cr" role="img" aria-label="credits"><use href="#i-credit"/></svg>`;

function fmtMoney(cr, unit = state.unit) {
  if (cr == null || isNaN(cr)) return "&ndash;";
  if (unit === "usd" || unit === "eur") {
    const usd = cr * PRICING.usdPerCredit;
    const v = unit === "usd" ? usd : usd * PRICING.eurPerUsd;
    return new Intl.NumberFormat(undefined, { style: "currency", currency: unit === "usd" ? "USD" : "EUR" }).format(v);
  }
  const a = Math.abs(cr);
  return nf(cr, a >= 1000 ? 0 : a >= 10 ? 1 : 2) + creditGlyph;
}
const altUnit = () => (state.unit === "credits" ? "usd" : "credits");
const money = (cr, cls = "") => `<span class="m ${cls}" data-cr="${num(cr)}">${fmtMoney(num(cr))}</span>`;
const moneyAlt = (cr) => `<span class="m alt" data-alt="1" data-cr="${num(cr)}">${fmtMoney(num(cr), altUnit())}</span>`;
const count = (n) => `<span class="count" data-n="${num(n)}">${nf(num(n))}</span>`;
function qty(q, cls = "") {
  if (!q) return "&ndash;";
  if (isUnlimited(q)) return `<span class="unl">No limit</span>`;
  return money(qv(q), cls);
}
function fmtDate(v, withTime = true) {
  if (!v) return "&ndash;";
  const d = new Date(v);
  if (isNaN(d)) return esc(v);
  return esc(d.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }));
}
function ago(v) {
  const d = new Date(v); if (isNaN(d)) return "";
  const s = (d - Date.now()) / 1000, rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [u, n] of [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]]) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return rtf.format(Math.round(s), "second");
}

/* ---------- status + people ---------- */
const STATUS_ICONS = { good: "i-ok", warn: "i-warn", bad: "i-error", skip: "i-minus", info: "i-info", block: "i-blocked" };
const statusTag = (kind, text) => `<span class="st ${kind}">${ic(STATUS_ICONS[kind] || "i-info")}${esc(text)}</span>`;
function policyStatus(s) {
  const kind = { enabled: "good", disabled: "skip", provisioning: "warn", provisioningFailed: "bad" }[s] || "info";
  return statusTag(kind, splitCamel(s || "unknown"));
}
function initials(name) {
  const parts = String(name || "?").replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function avatar(name) {
  let h = 0;
  for (const c of String(name || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="av c${h % 8}" aria-hidden="true">${esc(initials(name))}</span>`;
}

/* ---------- charts (snapshot data only, no time series) ---------- */
function meter(p, opts = {}) {
  const v = clamp01(p);
  const tone = opts.tone || (v >= 1 ? "bad" : v >= 0.8 ? "warn" : "");
  const ticks = (opts.ticks || []).filter((t) => t > 0 && t <= 1).map((t) => `<b style="left:${(t * 100).toFixed(2)}%" title="${esc(opts.tickLabel || "Alert threshold")} ${pctText(t)}"></b>`).join("");
  return `<span class="meter ${tone} ${opts.cls || ""}"><i style="--w:${(v * 100).toFixed(2)}%;--d:${opts.i || 0}"></i>${ticks}</span>`;
}
function stackBar(parts, scale = 1, opts = {}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.v), 0);
  const segs = total > 0 ? parts.filter((p) => p.v > 0).map((p) => `<i style="--w:${((p.v / total) * 100).toFixed(2)}%;--c:${p.c}" title="${esc(p.label)}"></i>`).join("") : "";
  return `<span class="stackbar ${opts.cls || ""}"><span class="sb-fill" style="--w:${(clamp01(scale) * 100).toFixed(2)}%;--d:${opts.i || 0}">${segs}</span></span>`;
}
function donut(parts, center, sub, label) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.v), 0);
  let start = 0;
  const gap = parts.filter((p) => p.v > 0).length > 1 ? 0.6 : 0;
  const arcs = total > 0 ? parts.filter((p) => p.v > 0).map((p, i) => {
    const len = (p.v / total) * 100, vis = Math.max(0.01, len - gap);
    const s = `<circle class="seg" pathLength="100" cx="60" cy="60" r="48" style="--da:${vis.toFixed(3)} ${(100 - vis).toFixed(3)};--do:${(-start).toFixed(3)};--d:${i};stroke:${p.c}"><title>${esc(p.label)}</title></circle>`;
    start += len;
    return s;
  }).join("") : "";
  return `<figure class="donut" role="img" aria-label="${esc(label || "")}"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="48" pathLength="100"/>${arcs}</svg><figcaption><b>${center}</b><small>${sub || ""}</small></figcaption></figure>`;
}
function columns(cols, label) {
  const max = Math.max(1, ...cols.map((c) => c.v));
  return `<div class="cols" role="img" aria-label="${esc(label || "")}">${cols.map((c, i) => `
    <div class="col" title="${esc(c.title || "")}"><span class="cv">${nf(c.v)}</span><span class="cbar"><i class="${c.tone || ""}" style="--h:${((c.v / max) * 100).toFixed(2)}%;--d:${i}"></i></span><span class="cl">${c.label}</span></div>`).join("")}</div>`;
}

/* ---------- feedback ---------- */
function toast(msg, err = false) {
  const t = $("#toast");
  t.innerHTML = ic(err ? "i-error" : "i-ok") + `<span>${esc(msg)}</span>`;
  t.className = "show" + (err ? " err" : "");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => (t.className = err ? "err" : ""), err ? 5200 : 2400);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast("Copied to clipboard");
}
function download(name, data, type = "application/octet-stream") {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([data], { type })), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const b64ToText = (b64) => new TextDecoder().decode(b64ToBytes(b64));
function highlightJson(text) {
  return esc(text).replace(/(&quot;(?:\\&quot;|\\.|[^&\\]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (m, str, colon, bool, n) => {
    if (str) return colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`;
    if (bool) return `<span class="b">${bool}</span>`;
    return `<span class="n">${n}</span>`;
  });
}

/* ---------- motion: data draws in once, numbers count up ---------- */
function countUp(el) {
  const isMoney = el.classList.contains("m");
  const to = Number(isMoney ? el.dataset.cr : el.dataset.n);
  if (REDUCED || !to) return;
  const start = performance.now(), dur = 900;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(2, -10 * t), v = t >= 1 ? to : to * e;
    if (isMoney) el.innerHTML = fmtMoney(v); else el.textContent = nf(Math.round(v));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    revealObserver.unobserve(e.target);
    $$(".count", e.target).forEach(countUp);
  }
}, { threshold: 0.15 }) : null;
function observeReveals(root = document) {
  $$(".reveal:not(.in)", root).forEach((el) => (REDUCED || !revealObserver ? el.classList.add("in") : revealObserver.observe(el)));
}

/* ---------- currency switch ---------- */
function setUnit(unit) {
  const changed = state.unit !== unit;
  state.unit = UNITS.includes(unit) ? unit : "credits";
  localStorage.setItem("cci-unit", state.unit);
  const sw = $(".unit-switch");
  sw.style.setProperty("--i", UNITS.indexOf(state.unit));
  $$("button", sw).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.unit === state.unit)));
  $$(".m").forEach((el) => (el.innerHTML = fmtMoney(Number(el.dataset.cr), el.dataset.alt ? altUnit() : state.unit)));
  if (changed && !REDUCED) {
    const d = $("#dash");
    d.classList.toggle("swap-b", !d.classList.contains("swap-b"));
    d.classList.add("swap");
  }
}
