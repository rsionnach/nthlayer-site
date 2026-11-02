// Source for the walkthrough's interactive stage. Edit this file, then run ./walkthrough/build.sh
// to regenerate app.js. React and ReactDOM are self-hosted in /vendor/ and loaded (deferred) as globals.

// If React didn't load, show the short version instead of a blank stage. Nothing below touches React until it's needed.
const HAS_REACT = !!(window.React && window.ReactDOM);
const { useState, useEffect, useRef, useCallback } = window.React || {};
const SUMMARY = "The short version: every decision the AI SRE makes is recorded as a verdict, its outcome settles later, and how often a human overrides its decisions becomes a judgment SLO with its own alert. Example data.";

// ── Example estate: 21 services across three platforms plus SaaS ────────────
// The strip names a service only when the current chapter involves it.
const PLATFORMS = [
  { id: "gcp", name: "GCP", count: 5, color: "#B48EAD", y: 52, h: 88,
    named: [{ id: "fraud-detect", sit: "a" }] },
  { id: "onprem", name: "ON-PREM", count: 7, color: "#81A1C1", y: 150, h: 112,
    named: [{ id: "config-service", sit: "b" }, { id: "notification-svc", sit: "b" }] },
  { id: "aws", name: "AWS", count: 7, color: "#EBCB8B", y: 272, h: 88,
    named: [{ id: "payment-api", sit: "a" }] },
  { id: "ext", name: "EXTERNAL", count: 2, color: "#8FBCBB", y: 370, h: 56, named: [] },
];

// ── Palette (homepage tokens) ───────────────────────────────────────────────
const C = {
  bg: "#0B1120", text: "#F0F0F3", body: "#A8B0BD", muted: "#7D8BA1", line: "#1E2A3A",
  frost: "#88C0D0", frost2: "#81A1C1", held: "#A3BE8C", red: "#D0737C", yellow: "#EBCB8B",
  purple: "#B48EAD", orange: "#D08770",
};
const SIT_A = { id: "SIT-0412", name: "fraud-detect", kase: "CASE-221", color: C.red };
const SIT_B = { id: "SIT-0413", name: "on-prem config", kase: "CASE-222", color: C.frost };

const START_LEDE = "Two failures, three decisions, one week of outcomes.";
const WORKER_MODULES = ["observe · measure ·", "correlate · respond · learn"];

// ── Strip geometry (viewBox 929 × 520, starting at x = 15) ──────────────────
// The viewBox starts at the services column's left edge, so the strip lines up with the page gutter.
const VB = { x: 15, w: 929, h: 520 };
const SVC_COL = { x: 16, w: 170 };
const BOX = {
  ai:      { x: 254, y: 72,  w: 134, h: 110, c: C.yellow },
  group:   { x: 498, y: 52,  w: 246, h: 392 },
  core:    { x: 518, y: 72,  w: 206, h: 110, c: C.frost },
  workers: { x: 518, y: 222, w: 206, h: 84,  c: C.purple },
  tags:    { x: 518, y: 318, w: 206, h: 50,  c: C.muted },
  adapter: { x: 518, y: 380, w: 206, h: 52,  c: C.orange },
  oncall:  { x: 557, y: 466, w: 128, h: 38,  c: C.held },
  stack:   { x: 834, y: 72,  w: 106, h: 124, c: C.frost },
};
// Connectors: `d` runs to the base of the arrowhead, `tip` is where it points.
const WIRES = {
  alerts:    { d: "M190,127 H244", tip: [250, 127, "r"], c: C.red },
  decisions: { d: "M388,127 H510", tip: [518, 127, "r"], c: C.yellow },
  workers:   { d: "M621,222 V190", tip: [621, 184, "u"], c: C.purple },
  oncall:    { d: "M621,466 V440", tip: [621, 434, "u"], c: C.held },
  adapter:   { d: "M518,406 H508 V164 H510", tip: [518, 164, "r"], c: C.orange },
  stack:     { d: "M744,127 H824", tip: [830, 127, "r"], c: C.frost },
  // Prometheus is input as well as output: the workers read the SLO series back.
  reads:     { d: "M887,196 V264 H732", tip: [724, 264, "l"], c: C.frost2 },
};
// The override travels on-call → adapter, then adapter → core: one dot, two legs.
const OVERRIDE_PATH = "M621,466 V434 M518,406 H508 V164 H518";

// ── Chapters ────────────────────────────────────────────────────────────────
const pct1 = x => (x * 100).toFixed(1) + "%";
const pct0 = x => Math.round(x * 100) + "%";

// Strip state per chapter: what is lit, the one pulse, and the live labels.
const noVerdicts = () => ["0 verdicts"];
const weekCore = d => d ? [`${d.week.decisions} AI SRE verdicts ·`, `${d.week.pending} pending`] : ["outcomes settling"];
const isOverridden = v => v.outcome.settled.status === "overridden";
const byAiSre = v => v.producer.system === "ai-sre";
const ALL_SERVICES = ["gcp", "onprem", "aws", "ext"];

// Mobile mini strip: the chapter's lit elements in the strip's column order, with labelled connectors.
// `at` is the index (or indices) of the item a connector arrow leaves from, `label` the matching label(s);
// `up` flips the arrows (data flowing back).
const CHAPTERS = [
  {
    tab: "Steady state", dur: 12000,
    headline: "21 services, three platforms, two external APIs. A third-party AI SRE watches their alerts.",
    detail: () => "NthLayer records each of its decisions as a verdict. The decision is written once; its outcome is settled once, later.",
    strip: { lit: ["ai", "w-stack", "stack"], pulse: "stack", core: noVerdicts },
    mini: { items: [["ai", "AI SRE", "watches alerts for 21 services"], ["nth", "NthLayer", "compiled from the manifest"], ["stack", "Your stack", "Prometheus · Alertmanager · Grafana"]], label: "rules · alerts", at: 1 },
    events: [
      { src: "nthlayer apply", text: "Compiled the manifest into recording rules, alert rules and dashboards for Prometheus, Alertmanager and Grafana." },
      { src: "ai-sre", text: "Watching alerts for 21 services. The AI SRE’s shim (a small adapter that posts its verdicts and counters) points at NthLayer core." },
    ],
    ledger: "none",
    aria: "21 example services across GCP, on-prem, AWS and two external APIs, all quiet. A third-party AI SRE watches their alerts and makes decisions. NthLayer sits beside it, with core, workers (observe, measure, correlate, respond, learn) and the override adapter, and has compiled recording rules, alert rules and dashboards into Prometheus, Alertmanager and Grafana.",
  },
  {
    tab: "Two failures", dur: 11000,
    headline: "Two unrelated failures land at once.",
    detail: () => "A model deploy degrades fraud-detect on GCP while a cache config change runs on-prem services out of memory. Alerts fire across both.",
    strip: { lit: ["gcp", "onprem", "aws", "w-alerts", "ai", "w-reads"], pulse: "alerts", svc: "failing", core: noVerdicts },
    mini: { items: [["svc", "Your services", "fraud-detect (GCP) · payment-api (AWS) · config-service, notification-svc (on-prem)"], ["ai", "AI SRE", "receives the alerts"]], label: "alerts", at: 0 },
    events: [
      { src: "deploy", text: "fraud-detect model v2.3 rolled out on GCP.", dot: C.red },
      { src: "alertmanager → ai-sre", text: "fraud-detect p99 latency 480ms against a 150ms target. payment-api error rate climbing on AWS.", dot: C.red },
      { src: "alertmanager → ai-sre", text: "config-service OOM-killed on-prem. A cache config change (TTL) was pushed 22 minutes earlier.", dot: C.frost },
    ],
    ledger: "none",
    aria: "Two failures: fraud-detect on GCP is degraded and payment-api on AWS is affected; config-service and notification-svc on-prem are out of memory. Their alerts go to the AI SRE. NthLayer’s workers read the SLO series from Prometheus.",
  },
  {
    tab: "Situations", dur: 14000,
    headline: "NthLayer’s workers group the SLO breaches into two situations.",
    detail: () => "They evaluate your declared SLOs against Prometheus and group what they find before anyone has called it an incident. The respond worker opens a case for each.",
    strip: {
      lit: ["workers", "w-workers", "tags", "gcp", "onprem", "aws", "w-reads"], pulse: "reads", svc: "failing", tags: true,
      core: noVerdicts, workers: ["2 situations ·", "2 cases"], workersWire: "2 cases",
    },
    mini: { items: [["svc", "Your services", "fraud-detect · payment-api · config-service · notification-svc"], ["workers", "NthLayer workers", "SIT-0412 → CASE-221 · SIT-0413 → CASE-222"], ["stack", "Your stack", "Prometheus"]], label: "reads SLO series", at: 1, up: true },
    events: [
      { src: "nthlayer-workers · observe", text: "Read the SLO series from Prometheus: fraud-detect latency and on-prem availability are breaching their declared SLOs.", dot: C.frost2 },
      { src: "nthlayer-workers · correlate", text: "Grouped the fraud-detect latency breach and the payment-api error budget burn into SIT-0412 · fraud-detect.", dot: C.red },
      { src: "nthlayer-workers · correlate", text: "Grouped the config-service and notification-svc availability breaches into SIT-0413 · on-prem config.", dot: C.frost },
      { src: "nthlayer-workers · respond", text: "Opened CASE-221 for SIT-0412 and CASE-222 for SIT-0413 in core.", dot: C.purple },
    ],
    ledger: "none",
    aria: "NthLayer’s workers read the declared SLO series from Prometheus and group the breaches into two situations: SIT-0412 around fraud-detect and payment-api, and SIT-0413 around the on-prem config change. The respond worker opens CASE-221 and CASE-222 in core.",
  },
  {
    tab: "Decisions", dur: 15000,
    headline: "Every decision is recorded, then waits for its outcome.",
    detail: () => "The AI SRE posts each decision to core over HTTP. NthLayer’s respond worker proposes a rollback; a human must approve and run it.",
    strip: {
      lit: ["ai", "w-decisions", "core", "workers", "w-workers"], pulse: "decisions", svc: "failing", tags: true,
      core: d => [`${d ? d.verdicts.length : 3} pending`],
    },
    mini: { items: [["ai", "AI SRE", "2 decisions"], ["core", "NthLayer core", "3 verdicts pending, including the respond worker’s rollback proposal"]], label: "decisions · POST /verdicts", at: 0 },
    // The cards say the same thing on narrow screens, so the timeline skips these lines.
    mobileEvents: false,
    events: [
      { src: "ai-sre → core", text: "POST /verdicts: paged platform-eng for the config OOM. Confidence 0.81.", dot: C.frost },
      { src: "ai-sre → core", text: "POST /verdicts: marked the fraud-detect p99 latency alert as noise and suppressed it. Confidence 0.92.", dot: C.red },
      { src: "nthlayer-workers · respond", text: "Proposed a rollback of fraud-detect to model v2.2 for human approval. Confidence 0.74.", dot: C.purple },
    ],
    ledger: "pending", changed: byAiSre,
    aria: "The AI SRE posts two decisions to NthLayer core over HTTP, a page and an alert suppression, and NthLayer’s respond worker proposes a rollback that needs human approval. All three verdicts are pending. The failures continue.",
  },
  {
    tab: "Override", dur: 17000,
    headline: "The on-call rejects the suppression in Slack.",
    detail: () => "The override adapter binds the rejection to the 0.92 verdict by decision ID, and its outcome settles as overridden. A confident decision that’s overridden counts as a high-confidence failure. The on-call approves the rollback and runs it themselves.",
    strip: {
      lit: ["oncall", "w-oncall", "adapter", "w-adapter", "core"], pulse: "override", svc: "recovered", tags: true,
      core: () => ["1 overridden ·", "2 pending"],
    },
    mini: { items: [["oncall", "On-call · Slack", "rejects the suppression"], ["adapter", "Override adapter", "binds it to the verdict by decision ID"], ["core", "NthLayer core", "1 overridden · 2 pending"]], label: ["override", "outcome"], at: [0, 1] },
    events: [
      { src: "on-call · Slack", text: "Rejected the suppression: the fraud-detect latency is real.", dot: C.held },
      { src: "nthlayer-override-adapter", text: "Bound the override to ai-sre-0412-a1 by decision ID. Outcome settled: overridden.", dot: C.red },
      { src: "nthlayer-override-adapter", text: "If core can’t be reached at that moment, the override still reaches the metrics, but this verdict would stay pending and expire after 7 days." },
      { src: "on-call", text: "Approved the rollback proposal and ran it: fraud-detect is back on model v2.2.", dot: C.held },
      { src: "platform-eng", text: "Reverted the cache config change. Services recover.", dot: C.held },
    ],
    ledger: "settled", changed: isOverridden,
    aria: "The on-call’s override flows from Slack through the override adapter to core, and the suppression verdict settles as overridden. The on-call approves the rollback proposal and runs it themselves; platform-eng reverts the config change. Services return to healthy.",
  },
  {
    tab: "Seven days later", dur: 12000,
    headline: "Over the next week, outcomes settle, including these three.",
    detail: w => w
      ? `The AI SRE made ${w.decisions} decisions that week: ${w.confirmed} confirmed, ${w.overridden} overridden, ${w.pending} still pending.`
      : "Each decision settles as confirmed or overridden once its outcome is known. The newest are still pending.",
    strip: {
      lit: ["workers", "w-workers", "core", "w-reads"], pulse: "workers", tags: true, core: weekCore,
      workers: ["learn · settles", "outcomes"], workersWire: "outcomes",
    },
    mini: { items: [["workers", "NthLayer workers", "learn settles outcomes"], ["core", "NthLayer core", "212 AI SRE verdicts · 22 pending"]], label: "outcomes", at: 0 },
    events: [
      { src: "nthlayer-workers · learn", text: "Settled each verdict once it was at least an hour old: confirmed when a positive outcome was posted (the shim reports the alert resolved and stayed resolved), overridden when a human overrode it. A verdict with no outcome after 7 days expires; none have yet." },
    ],
    ledger: "week", changed: v => !isOverridden(v), settleNote: true,
    aria: "A week later, all services are healthy. NthLayer’s learn worker has settled each AI SRE decision at least an hour old as confirmed or overridden. The newest are still pending; none has expired.",
  },
  {
    tab: "The point", dur: 17000,
    headline: "Every service is within SLO. The AI SRE’s judgment SLO is breached.",
    detail: () => <>A judgment SLO is a target for how often the AI SRE’s decisions hold up. Its breach alert fires in Alertmanager. The manifest declares a breach action, <code>reduce_autonomy</code>; your AI SRE’s platform decides how to apply it.</>,
    strip: { lit: ["core", "w-stack", "stack", "w-reads", ...ALL_SERVICES], pulse: "stack", stackAlert: true, tags: true, core: weekCore },
    mini: { items: [["svc", "Your services", "all 21 within SLO"], ["core", "NthLayer core", "AI SRE reversal rate 9.0% · target 5%"], ["stack", "Your stack", "Alertmanager: breach alert"]], label: "rules · alerts", at: 1, alert: true },
    events: [
      { src: "nthlayer-workers", text: "AI SRE reversal rate over 7 days is above its 5% target. Judgment SLO breached.", dot: C.red },
      { src: "alertmanager", text: "The breach alert fires, from the rule NthLayer compiled.", dot: C.red },
      { src: "manifest", text: <>Declared breach action: <code>reduce_autonomy</code>.</> },
    ],
    ledger: "week", compare: true,
    aria: "Every service is within SLO, while the AI SRE’s reversal rate breaches its judgment SLO and a breach alert fires in Alertmanager. The manifest’s declared breach action is reduce_autonomy; the AI SRE’s platform decides how to apply it.",
  },
  {
    tab: "End", dur: 0,
    headline: "",
    detail: () => "",
    overlay: "end",
    strip: { lit: [], pulse: null, tags: true, core: weekCore },
    events: [],
    ledger: "week",
    aria: "End of the walkthrough.",
  },
];
const LAST = CHAPTERS.length - 1;

function endCopy(w) {
  if (!w) return { headline: "That’s the scenario.", detail: "Every decision recorded, its outcome settled later, and its reversal rate measured against a target." };
  return {
    headline: `${w.decisions} decisions recorded. ${w.overridden} overridden.`,
    detail: <>Reversal rate {pct1(w.reversal_rate)} against a {pct0(w.target)} target: the AI SRE’s judgment SLO is breached. The manifest’s declared breach action is <code>reduce_autonomy</code>; your AI SRE’s platform decides what happens next.</>,
  };
}
function chapterText(i, w) {
  return { headline: CHAPTERS[i].headline, detail: CHAPTERS[i].detail(w) };
}
function aiDecisionCount(i, data) {
  const ledger = CHAPTERS[i].ledger;
  if (!data || ledger === "none") return 0;
  if (ledger === "week") return data.week.decisions;
  return data.verdicts.filter(byAiSre).length;
}

// ── Data ────────────────────────────────────────────────────────────────────
const ROOT = document.getElementById("root");
const DATA_URL = (ROOT && ROOT.dataset.src) || "/walkthrough/verdicts.json";
const num = x => typeof x === "number" && isFinite(x);
function validData(d) {
  if (!d || !Array.isArray(d.verdicts) || d.verdicts.length === 0 || !d.week) return false;
  const w = d.week;
  if (!["decisions", "confirmed", "overridden", "pending", "reversal_rate", "target", "availability"].every(k => num(w[k]))) return false;
  return d.verdicts.every(v => v && typeof v.id === "string" && v.producer && v.producer.system
    && v.subject && v.subject.summary && v.judgment && num(v.judgment.confidence)
    && v.outcome && v.outcome.settled && v.outcome.settled.status);
}

// ── Story strip ─────────────────────────────────────────────────────────────
function arrowHead([x, y, dir]) {
  if (dir === "u") return `M${x - 5},${y + 8} L${x},${y} L${x + 5},${y + 8} Z`;
  if (dir === "l") return `M${x + 8},${y - 5} L${x},${y} L${x + 8},${y + 5} Z`;
  return `M${x - 8},${y - 5} L${x},${y} L${x - 8},${y + 5} Z`;
}
function motionPath(w) { return `${w.d} L${w.tip[0]},${w.tip[1]}`; }

function Wire({ w, lit, c, children }) {
  return (
    <g className={"el" + (lit ? " lit" : "")} style={{ "--c": c || w.c }}>
      <path className="wire" d={w.d} />
      <path className="head" d={arrowHead(w.tip)} />
      {children}
    </g>
  );
}

function Box({ b, lit, c, dash, children }) {
  return (
    <g className={"el" + (lit ? " lit" : "")} style={{ "--c": c || b.c }}>
      <rect className={"box" + (dash ? " dash" : "")} x={b.x} y={b.y} width={b.w} height={b.h} rx="12" />
      {children}
    </g>
  );
}

// Coordinates may arrive as strings; coerce so `y + i * step` adds rather than concatenates.
function Lines({ x, y, lines, step = 20, className }) {
  const x0 = Number(x), y0 = Number(y);
  return lines.map((t, i) => <text key={i} x={x0} y={y0 + i * step} className={className}>{t}</text>);
}

function PlatformCard({ p, lit, svc }) {
  const x = SVC_COL.x, w = SVC_COL.w;
  const named = svc ? p.named : [];
  const ring = n => svc === "recovered" ? C.held : n.sit === "a" ? SIT_A.color : SIT_B.color;
  return (
    <g className={"el" + (lit ? " lit" : "")} style={{ "--c": p.color }}>
      <rect className="box" x={x} y={p.y} width={w} height={p.h} rx="12" />
      <text x={x + 14} y={p.y + 24} className="plat">{p.name}</text>
      {named.length === 0 && <circle className="dot" cx={x + w - 18} cy={p.y + 20} r="4" fill={C.held} />}
      {named.map((n, i) => (
        <g key={n.id}>
          <circle className="ring" cx={x + 21} cy={p.y + 48 + i * 24} r="6" style={{ stroke: ring(n) }} />
          <text x={x + 35} y={p.y + 53 + i * 24} className="svc">{n.id}</text>
        </g>
      ))}
      <text x={x + 14} y={p.y + (named.length ? 54 + named.length * 24 : 45)} className="sb">
        {named.length ? `+ ${p.count - named.length} more · quiet` : `${p.count} services · quiet`}
      </text>
    </g>
  );
}

function Strip({ ch, run, data, reduced, playing, started, label }) {
  const s = CHAPTERS[ch].strip;
  const lit = id => s.lit.includes(id);
  const svgRef = useRef(null);
  const pulseRef = useRef(null);
  const fired = useRef("");
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const [compact, setCompact] = useState(false);

  // Connector sublabels drop out once the strip renders its labels below ~11px.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => {
      const scale = Math.min(el.clientWidth / VB.w, el.clientHeight / VB.h);
      setCompact(12.5 * scale < 11);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One pulse per chapter: it runs once on a manual step and twice while the walkthrough plays.
  useEffect(() => {
    if (reduced || !s.pulse || !started) return;
    const key = ch + "-" + run;
    if (fired.current === key) return;
    const id = setTimeout(() => {
      fired.current = key;
      const reps = playingRef.current ? "2" : "1";
      if (pulseRef.current) pulseRef.current.querySelectorAll("animate, animateMotion").forEach(a => {
        a.setAttribute("repeatCount", reps);
        a.beginElement();
      });
    }, 350);
    return () => clearTimeout(id);
  }, [ch, run, started, reduced]);

  const alert = !!s.stackAlert;
  const core = s.core(data);
  const groupLit = ["core", "workers", "adapter", "tags"].some(lit);
  // NthLayer sends no alert: the wire carries the compiled rules; the breach alert fires inside the stack.
  const pulse = s.pulse && !reduced && {
    path: s.pulse === "override" ? OVERRIDE_PATH : motionPath(WIRES[s.pulse]),
    c: s.pulse === "override" ? C.held : WIRES[s.pulse].c,
  };

  return (
    <svg ref={svgRef} className={"strip" + (compact ? " compact" : "")} viewBox={`${VB.x} 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMinYMid meet" role="img" aria-label={label}>
      <text x={SVC_COL.x} y={34} className="col">YOUR SERVICES</text>
      <text x={BOX.ai.x} y={34} className="col">THE AI SRE</text>
      <text x={BOX.group.x} y={34} className="col">NTHLAYER</text>
      <text x={BOX.stack.x} y={34} className="col">YOUR STACK</text>

      {PLATFORMS.map(p => <PlatformCard key={p.id} p={p} lit={lit(p.id)} svc={s.svc} />)}

      <Wire w={WIRES.alerts} lit={lit("w-alerts")}>
        <text x={220} y={117} className="wl mid">alerts</text>
      </Wire>
      <Box b={BOX.ai} lit={lit("ai")}>
        <text x={BOX.ai.x + 14} y={BOX.ai.y + 30} className="nm">AI SRE</text>
        <Lines x={BOX.ai.x + 14} y={BOX.ai.y + 54} lines={["third-party ·", "makes decisions"]} className="sb" />
      </Box>
      <Wire w={WIRES.decisions} lit={lit("w-decisions")}>
        <text x={440} y={117} className="wl mid">decisions</text>
        <text x={440} y={147} className="wl mid sub">POST /verdicts</text>
      </Wire>

      <rect className={"group" + (groupLit ? " lit" : "")} x={BOX.group.x} y={BOX.group.y} width={BOX.group.w} height={BOX.group.h} rx="14" />
      <Box b={BOX.core} lit={lit("core")}>
        <text x={BOX.core.x + 14} y={BOX.core.y + 30} className="nm">core</text>
        <text x={BOX.core.x + 14} y={BOX.core.y + 54} className="sb">verdict store</text>
        <Lines x={BOX.core.x + 14} y={BOX.core.y + 76} lines={core} className="live" />
      </Box>
      <Wire w={WIRES.workers} lit={lit("w-workers")}>
        {s.workersWire && <text x={631} y={209} className="wl">{s.workersWire}</text>}
      </Wire>
      <Box b={BOX.workers} lit={lit("workers")}>
        <text x={BOX.workers.x + 14} y={BOX.workers.y + 30} className="nm">workers</text>
        <Lines x={BOX.workers.x + 14} y={BOX.workers.y + 54} step={18}
          lines={s.workers || WORKER_MODULES} className={s.workers ? "live" : "sb"} />
      </Box>
      {s.tags && (
        <Box b={BOX.tags} lit={lit("tags")} dash>
          <text x={BOX.tags.x + 14} y={BOX.tags.y + 21} className="tag" fill={SIT_A.color}>{SIT_A.id} · {SIT_A.kase}</text>
          <text x={BOX.tags.x + 14} y={BOX.tags.y + 39} className="tag" fill={SIT_B.color}>{SIT_B.id} · {SIT_B.kase}</text>
        </Box>
      )}
      <Wire w={WIRES.adapter} lit={lit("w-adapter")} />
      <Box b={BOX.adapter} lit={lit("adapter")}>
        <text x={BOX.adapter.x + 14} y={BOX.adapter.y + 31} className="nm">override adapter</text>
      </Box>
      <Wire w={WIRES.oncall} lit={lit("w-oncall")} />
      <Box b={BOX.oncall} lit={lit("oncall")}>
        <text x={BOX.oncall.x + BOX.oncall.w / 2} y={BOX.oncall.y + 24} className="svc mid">on-call · Slack</text>
      </Box>

      <Wire w={WIRES.stack} lit={lit("w-stack")}>
        <Lines x={787} y={103} step={15} lines={["rules ·", "alerts"]} className="wl mid" />
      </Wire>
      <Wire w={WIRES.reads} lit={lit("w-reads")}>
        <text x={806} y={255} className="wl mid">reads SLO series</text>
      </Wire>
      {/* Prometheus lights whenever the workers read from it, not only when NthLayer writes to it. */}
      <Box b={BOX.stack} lit={lit("stack") || lit("w-reads")} c={alert ? C.red : C.frost} dash>
        <text x={BOX.stack.x + 11} y={BOX.stack.y + 28} className="svc">Prometheus</text>
        <text x={BOX.stack.x + 11} y={BOX.stack.y + 50} className={"sb" + (alert ? " alert" : "")}>Alertmanager</text>
        <text x={BOX.stack.x + 11} y={BOX.stack.y + 72} className="sb">Grafana</text>
        {alert && <text x={BOX.stack.x + 11} y={BOX.stack.y + 100} className="sb alert">breach alert</text>}
      </Box>

      {pulse && (
        <g key={ch} ref={pulseRef} aria-hidden="true">
          <circle r="3.5" fill={pulse.c} opacity="0">
            <animateMotion begin="indefinite" dur="3s" repeatCount="1" path={pulse.path}
              keyPoints="0;1;1" keyTimes="0;0.5;1" calcMode="linear" />
            <animate attributeName="opacity" begin="indefinite" dur="3s" repeatCount="1"
              values="0.8;0.8;0;0" keyTimes="0;0.5;0.56;1" />
          </circle>
        </g>
      )}
    </svg>
  );
}

// ── Mobile mini strip: a static, vertical version of the chapter's lit elements ──
const MINI_COLOR = { svc: C.held, ai: C.yellow, nth: C.frost, core: C.frost, workers: C.purple, adapter: C.orange, oncall: C.held, stack: C.frost };
function MiniStrip({ m }) {
  if (!m) return null;
  const at = [].concat(m.at), labels = [].concat(m.label);
  return (
    <ol className={"mini" + (m.alert ? " alert" : "")} aria-hidden="true">
      {m.items.map(([k, name, sub], i) => {
        const w = at.indexOf(i);
        return (
          <li key={i} style={{ "--c": k === "stack" && m.alert ? C.red : MINI_COLOR[k] }}>
            <div className="mini-box"><b>{name}</b><span>{sub}</span></div>
            {w >= 0 && i < m.items.length - 1 && (
              <div className="mini-wire">
                <svg width="12" height="22" viewBox="0 0 12 22" className={m.up ? "up" : ""}>
                  <path d="M6 1v15" stroke="currentColor" strokeWidth="1.4" fill="none" />
                  <path d="M1.5 14.5L6 21l4.5-6.5z" fill="currentColor" />
                </svg>
                <span>{labels[w]}</span>
              </div>
            )}
            {w < 0 && i < m.items.length - 1 && <div className="mini-gap" />}
          </li>
        );
      })}
    </ol>
  );
}

// ── Icons (authored SVG, one stroke weight) ─────────────────────────────────
const Icon = HAS_REACT ? {
  play: <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3.5v11l9-5.5z" fill="currentColor"/></svg>,
  pause: <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="4.5" y="3.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="10.5" y="3.5" width="3" height="11" rx="1" fill="currentColor"/></svg>,
  prev: <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 4L6 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  next: <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M7 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  replay: <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9a5 5 0 1 0 1.6-3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4.5 2.5v3.2h3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
} : {};

// ── Ledger pieces (shared by desktop and mobile) ────────────────────────────
const STATUS_COLOR = { pending: "var(--frost-2)", overridden: "var(--bad)", confirmed: "var(--held)", expired: "var(--text-muted)" };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function producerLabel(v) {
  if (byAiSre(v)) return <>AI SRE <span>· {v.subject.type}</span></>;
  return <>NthLayer respond <span>· {v.producer.agent || v.subject.type}</span></>;
}
function VerdictCard({ v, settled, changed, ringIndex }) {
  const o = settled ? v.outcome.settled : { status: v.outcome.status, detail: "outcome pending" };
  const style = changed ? { "--sc": STATUS_COLOR[o.status], "--ri": ringIndex || 0 } : undefined;
  return (
    <li className={"vcard" + (changed ? " changed" : "")} style={style}>
      <div className="vcard-top">
        <span className="who">{producerLabel(v)}</span>
        <span className="conf">confidence <span className="n">{v.judgment.confidence.toFixed(2)}</span></span>
      </div>
      <p className="what">{v.subject.summary}</p>
      <span className={"verdict v-" + o.status}>{o.status}<small>{o.detail}</small></span>
      {v.note && <p className="note">{v.note}</p>}
      <p className="ids">{v.id} · {v.situation}</p>
    </li>
  );
}
function WeekSummary({ w, rate }) {
  return (
    <div className="week">
      <ul className="week-counts" aria-label="Outcomes over seven days">
        {["confirmed", "overridden", "pending"].map(k => (
          <li key={k}><span className={"verdict v-" + k}>{k}</span><b>{w[k]}</b></li>
        ))}
      </ul>
      <p className="week-expiry">A verdict with no outcome after 7 days expires.</p>
      {rate && <p className="week-rate">Reversal rate <b>{pct1(w.reversal_rate)}</b> · <span className="nw">target ≤ {pct0(w.target)}</span>
        <span className="why">share of decisions a human overrode: {w.overridden} ÷ {w.decisions}</span></p>}
    </div>
  );
}
function SettleNote({ w }) {
  const resolved = w.confirmed + w.overridden;
  return (
    <details className="settle" open>
      <summary>How a verdict settles</summary>
      <p>A decision stays pending until something resolves it: a downstream verdict that confirms it, an override, or an explicit outcome posted by whatever observed the result. Learn only looks at a verdict once it’s at least an hour old, so those signals have time to land. If nothing arrives within seven days (configurable), it becomes expired. Expired is not a pass: it never counts as confirmed and produces no calibration signal, so a decision nobody checks can never quietly improve an agent’s numbers.</p>
      <p className="ops">A high expired count is itself a signal: those decisions have no closure mechanism. And an override that never reached core (the adapter fails open) shows up as expired rather than overridden, so a gap between the override counter and overridden verdicts points at a binding failure. Two rates, two denominators: the verdict-based override rate counts only resolved decisions, leaving expired ones out of both sides (here {w.overridden} ÷ {resolved} = {pct1(w.overridden / resolved)}), while the reversal rate above is counter-based and counts every decision emitted ({w.overridden} ÷ {w.decisions} = {pct1(w.reversal_rate)}). The ledger and the Grafana panel can therefore show different numbers for the same week.</p>
    </details>
  );
}
// Desktop ledger sections sit under an h3 panel heading; the mobile timeline goes straight from h2.
function SubHead({ title, count, mobile }) {
  const H = mobile ? "h3" : "h4";
  return <H className="sub-head">{title}{count && <span> · {count}</span>}</H>;
}
function DataError({ onRetry }) {
  return (
    <div className="data-error" role="status">
      <p>The example data couldn’t load. Check your connection, then try again.</p>
      {onRetry && <button type="button" className="text-btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

function Ledger({ chapter, data, err, onRetry, mobile }) {
  const c = CHAPTERS[chapter], mode = c.ledger;
  if (err) return <DataError onRetry={onRetry} />;
  if (!data) return <p className="empty" role="status">Loading example data…</p>;
  if (mode === "none") return mobile ? null : <p className="empty">No decisions yet. Each decision the AI SRE makes appears here as a verdict.</p>;
  const changed = v => !!c.changed && c.changed(v);
  // Cards that changed this chapter come first, so the change is the first thing in view.
  const order = list => [...list.filter(changed), ...list.filter(v => !changed(v))];
  const ai = order(data.verdicts.filter(byAiSre)), respond = order(data.verdicts.filter(v => !byAiSre(v)));
  // In the override chapter only the overridden decision has an outcome yet; the rest settle over the week.
  const settled = v => mode === "week" || (mode === "settled" && isOverridden(v));
  const ringOrder = data.verdicts.filter(changed).map(v => v.id);
  // Keyed on status, so a card whose outcome changes remounts and replays its ring.
  const card = v => {
    const s = settled(v) ? v.outcome.settled.status : v.outcome.status;
    return <VerdictCard key={v.id + "-" + s} v={v} settled={settled(v)} changed={changed(v)} ringIndex={ringOrder.indexOf(v.id)} />;
  };

  if (mode === "week") {
    const r = respond[0];
    return (<>
      <SubHead mobile={mobile} title="AI SRE · last 7 days" count={plural(data.week.decisions, "decision", "decisions")} />
      <WeekSummary w={data.week} rate={!c.compare} />
      {c.settleNote && <SettleNote w={data.week} />}
      {!mobile && <>
        <p className="minor-head">From this scenario</p>
        <ul className="vlist">{ai.map(card)}</ul>
      </>}
      {respond.length > 0 && <SubHead mobile={mobile} title="NthLayer respond" count={plural(respond.length, "proposal", "proposals")} />}
      {mobile
        ? r && <p className="respond-line"><span className={"verdict v-" + r.outcome.settled.status}>{r.outcome.settled.status}<small>{r.outcome.settled.detail}</small></span></p>
        : <ul className="vlist">{respond.map(card)}</ul>}
    </>);
  }
  if (mobile && mode === "settled") {
    const now = data.verdicts.filter(changed), rest = data.verdicts.length - now.length;
    return (<>
      <ul className="vlist">{now.map(card)}</ul>
      {rest > 0 && <p className="minor-head">{rest} {rest === 1 ? "other" : "others"} still pending</p>}
    </>);
  }
  return (<>
    <SubHead mobile={mobile} title="AI SRE" count={plural(ai.length, "decision", "decisions")} />
    <ul className="vlist">{ai.map(card)}</ul>
    {respond.length > 0 && <>
      <SubHead mobile={mobile} title="NthLayer respond" count={plural(respond.length, "proposal", "proposals")} />
      <ul className="vlist">{respond.map(card)}</ul>
    </>}
  </>);
}

function EventList({ events }) {
  return (
    <ul className="log-group">
      {events.map((e, i) => (
        <li key={i} className="ev" style={e.dot ? { "--dot": e.dot } : undefined}>
          <span><span className="src">{e.src}</span>{e.text}</span>
        </li>
      ))}
    </ul>
  );
}

// Chapter 7: two SLOs side by side, compact enough to sit above the ledger.
function Comparison({ data, err, onRetry }) {
  if (err) return <DataError onRetry={onRetry} />;
  if (!data) return <p className="empty" role="status">Loading example data…</p>;
  const w = data.week;
  // Scale is 0 to 2x target, so the target mark sits at the midpoint.
  const fill = Math.min(100, (w.reversal_rate / (w.target * 2)) * 100);
  return (
    <div className="compare">
      <div className="cmp ok">
        <p className="cmp-k">Availability · all services</p>
        <p className="cmp-v"><b>{(w.availability * 100).toFixed(2)}%</b><span>within SLO</span></p>
      </div>
      <div className="cmp bad">
        <p className="cmp-k">AI SRE reversal rate · last 7 days</p>
        <p className="cmp-v"><b>{pct1(w.reversal_rate)}</b><span><span className="nw">target ≤ {pct0(w.target)}</span> · judgment SLO breached</span></p>
        <div className="meter-track" role="img" aria-label={`${pct1(w.reversal_rate)} against a target of at most ${pct0(w.target)}, over target`}>
          <div className="meter-fill over" style={{ width: fill + "%" }}></div><div className="meter-target"></div>
        </div>
      </div>
      <p className="cmp-note">Reversal rate = overrides ÷ decisions, from Prometheus counters exposed by the AI SRE (via its shim) and the override adapter. NthLayer respond’s proposals aren’t counted.</p>
    </div>
  );
}

function EndActions({ onReplay }) {
  return (
    <div className="end-actions">
      <a className="btn primary" href="/#start">Set it up for your AI SRE →</a>
      <a className="btn" href="/#how">See how verdicts are recorded →</a>
      {onReplay && <button type="button" className="text-btn replay" onClick={onReplay}>{Icon.replay} Replay</button>}
    </div>
  );
}

// ── Desktop stage ───────────────────────────────────────────────────────────
const STACKED_Q = "(min-width: 900px) and (max-width: 1199px)";

function Stage({ data, err, onRetry, guided, reduced, ch, setCh, started, setStarted }) {
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [logOpen, setLogOpen] = useState(true);
  const [left, setLeft] = useState(null);
  // Time already spent on the current chapter while playing (so Pause/Play resumes, not restarts).
  const elapsed = useRef({ key: "", ms: 0 });
  const deadline = useRef(0);
  const stageRef = useRef(null);
  const playRef = useRef(null);
  const endHeadRef = useRef(null);
  const sideRef = useRef(null);
  const controlsRef = useRef(null);
  const focusIn = useRef(false);
  const userNav = useRef(false);
  const cur = CHAPTERS[ch];
  const text = chapterText(ch, data && data.week);
  const end = endCopy(data && data.week);

  useEffect(() => {
    if (!playing) return;
    if (ch >= LAST) { setPlaying(false); return; }
    const key = ch + "-" + run;
    if (elapsed.current.key !== key) elapsed.current = { key, ms: 0 };
    const t0 = performance.now();
    const wait = Math.max(0, cur.dur - elapsed.current.ms);
    deadline.current = t0 + wait;
    const id = setTimeout(() => { userNav.current = false; setCh(Math.min(ch + 1, LAST)); }, wait);
    return () => {
      clearTimeout(id);
      if (elapsed.current.key === key) elapsed.current.ms += performance.now() - t0;
    };
  }, [playing, ch, run]);

  // Reduced motion: no moving progress bar, so a stepped "Next in Ns" stands in for it.
  useEffect(() => {
    if (!reduced || !playing || ch >= LAST) { setLeft(null); return; }
    const tick = () => setLeft(Math.max(1, Math.ceil((deadline.current - performance.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [reduced, playing, ch, run]);

  // Track whether keyboard/pointer focus is inside the stage, so a chapter change can restore it.
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const onIn = () => { focusIn.current = true; };
    const onOut = e => { if (e.relatedTarget && !st.contains(e.relatedTarget)) focusIn.current = false; };
    const onDown = e => { if (!st.contains(e.target)) focusIn.current = false; };
    st.addEventListener("focusin", onIn);
    st.addEventListener("focusout", onOut);
    document.addEventListener("pointerdown", onDown);
    return () => {
      st.removeEventListener("focusin", onIn);
      st.removeEventListener("focusout", onOut);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // The controls are sticky in the stacked band: keep scrolled-to targets clear of them.
  useEffect(() => {
    const el = controlsRef.current;
    if (!el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--controls-h", el.getBoundingClientRect().height + "px"));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Before any decisions the event log is the only thing happening, so it starts open.
    setLogOpen(CHAPTERS[ch].ledger === "none");
    // Focus: the end card takes it after a user step; a removed control hands it to Play.
    requestAnimationFrame(() => {
      const a = document.activeElement;
      if (ch === LAST && started && userNav.current && endHeadRef.current) {
        endHeadRef.current.focus({ preventScroll: true });
      } else if (focusIn.current && (!a || a === document.body || !a.isConnected) && playRef.current) {
        playRef.current.focus({ preventScroll: true });
      }
    });
  }, [ch]);

  // Bring the chapter's change into view: inside the side panel on wide screens, on the page in the stacked band.
  useEffect(() => {
    const side = sideRef.current;
    if (!side) return;
    side.scrollTop = 0;
    if (!started || ch === LAST) return;
    const target = side.querySelector(".vcard.changed") || (cur.compare ? side.querySelector("#slo-h") : null);
    if (!target) return;
    const frame = requestAnimationFrame(() => {
      const tr = target.getBoundingClientRect();
      if (window.matchMedia(STACKED_Q).matches) {
        const ctl = controlsRef.current ? controlsRef.current.getBoundingClientRect().height : 0;
        if (tr.top > window.innerHeight - ctl - 24) target.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      } else if (!cur.settleNote) {
        // Chapter 6 leads with the week summary and how a verdict settles, so its panel stays at the top.
        const sr = side.getBoundingClientRect();
        if (tr.bottom > sr.bottom) side.scrollTop += Math.min(tr.top - sr.top - 12, tr.bottom - sr.bottom + 12);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [ch, run, !!data]);

  const go = useCallback(i => { userNav.current = true; setCh(Math.max(0, Math.min(LAST, i))); setRun(r => r + 1); setStarted(true); }, []);
  const replay = useCallback(() => {
    userNav.current = false;
    setCh(0); setRun(r => r + 1); setStarted(true); setPlaying(true);
    requestAnimationFrame(() => playRef.current && playRef.current.focus({ preventScroll: true }));
  }, []);
  const start = useCallback(() => {
    setStarted(true); setPlaying(true);
    const r = stageRef.current && stageRef.current.getBoundingClientRect();
    if (r && r.bottom > window.innerHeight + 1) stageRef.current.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    requestAnimationFrame(() => playRef.current && playRef.current.focus({ preventScroll: true }));
  }, [reduced]);
  const togglePlay = useCallback(() => {
    if (!started) { start(); return; }
    if (ch === LAST) { replay(); return; }
    setPlaying(p => !p);
  }, [started, ch, start, replay]);

  const keys = useRef({});
  keys.current = {
    ch, next: () => go(ch + 1), prev: () => go(ch - 1), togglePlay,
    replay: () => { if (guided) { go(0); setPlaying(false); } else replay(); },
  };
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const stage = stageRef.current;
      if (!stage) return;
      const el = e.target instanceof Element ? e.target : document.body, tag = el.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      const inStage = stage.contains(el);
      if (!inStage) {
        // Outside the stage, only a page-level keypress counts, and only while the stage is on screen.
        if (el !== document.body && el !== document.documentElement) return;
        const r = stage.getBoundingClientRect();
        if (r.bottom < 120 || r.top > window.innerHeight - 120) return;
      }
      if (e.key === "ArrowRight") { e.preventDefault(); keys.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); keys.current.prev(); }
      else if (e.key === " ") {
        if (["BUTTON", "A", "SUMMARY"].includes(tag) || el.closest(".side")) return;
        e.preventDefault();
        // Space pauses and plays; it never restarts from the end.
        if (keys.current.ch !== LAST) keys.current.togglePlay();
      } else if ((e.key === "r" || e.key === "R") && inStage) keys.current.replay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const overlay = !started ? "start" : cur.overlay || null;
  const count = aiDecisionCount(ch, data);
  const announce = ch === LAST ? end.headline : text.headline;

  return (
    <section className="stage" ref={stageRef} aria-label="Walkthrough">
      <div className="narration">
        {/* Every chapter's text shares one grid cell, so the narration is always as tall as the longest and the strip never resizes. */}
        <div className="narration-text">
          {CHAPTERS.map((c, i) => {
            const t = i === ch ? text : chapterText(i, data && data.week);
            const H = i === ch ? "h2" : "p";
            return (
              <div key={i} className={"nt" + (i === ch ? " on" : "")} aria-hidden={i === ch ? undefined : "true"}>
                {t.headline && <H className="headline">{t.headline}</H>}
                {t.detail && <p className="detail">{t.detail}</p>}
              </div>
            );
          })}
        </div>
        <p className="hud">
          <span aria-hidden="true"><span className="hud-k">AI SRE decisions</span><b>{err ? "—" : count}</b></span>
          <span className="sr-only">{err ? "AI SRE decisions unavailable" : `${count} AI SRE decisions recorded`}</span>
        </p>
        <p className="sr-only" aria-live={playing ? "off" : "polite"}>Chapter {ch + 1} of {CHAPTERS.length}: {announce}</p>
      </div>

      <div className="stage-body">
        <div className="strip-wrap">
          <Strip ch={ch} run={run} data={data} reduced={reduced} playing={playing} started={started}
            label={`${cur.aria} Example data.`} />
          {overlay === "start" && (
            <div className="overlay">
              <div className="start-card">
                <p className="start-lede">{START_LEDE}</p>
                <button type="button" className="btn primary" onClick={start}>{Icon.play} Start the walkthrough</button>
                <p>Eight short chapters, about a minute and a half. Pause, step or jump to any chapter.</p>
              </div>
            </div>
          )}
          {overlay === "end" && (
            <div className="overlay">
              <div className="end-card">
                <h2 ref={endHeadRef} tabIndex={-1}>{end.headline}</h2>
                <p className="end-close">{end.detail}</p>
                <EndActions onReplay={replay} />
                <p className="end-label">Example scenario · example data</p>
              </div>
            </div>
          )}
        </div>

        <aside className="side" ref={sideRef} tabIndex={0} aria-label="Verdicts and event log">
          {cur.compare && !err && (
            <section className="side-sec" aria-labelledby="slo-h">
              <div className="side-head"><h3 id="slo-h">SLO status</h3><span>example data</span></div>
              <Comparison data={data} err={err} onRetry={onRetry} />
            </section>
          )}
          <section className="side-sec" aria-labelledby="ledger-h">
            <div className="side-head"><h3 id="ledger-h">Verdicts</h3><span>example data</span></div>
            <Ledger chapter={ch} data={data} err={err} onRetry={onRetry} />
          </section>
          {cur.events.length > 0 && (
            <section className="side-sec log-sec">
              <details open={logOpen} onToggle={e => setLogOpen(e.currentTarget.open)}>
                <summary>Event log ({cur.events.length})</summary>
                <EventList events={cur.events} />
              </details>
            </section>
          )}
        </aside>
      </div>

      <div className="controls" ref={controlsRef}>
        <div className="transport">
          <button type="button" ref={playRef} className="icon-btn primary" onClick={togglePlay} aria-keyshortcuts="Space"
            aria-label={!started ? "Start" : ch === LAST ? "Replay from the start" : playing ? "Pause" : "Play"}>
            {ch === LAST && started ? Icon.replay : playing ? Icon.pause : Icon.play}
          </button>
          {/* aria-disabled rather than disabled, so focus stays put at either end. */}
          <button type="button" className="icon-btn" onClick={() => { if (ch > 0) go(ch - 1); }} aria-disabled={ch === 0}
            aria-keyshortcuts="ArrowLeft" aria-label="Previous chapter">{Icon.prev}</button>
          <button type="button" className="icon-btn" onClick={() => { if (ch < LAST) go(ch + 1); }} aria-disabled={ch === LAST}
            aria-keyshortcuts="ArrowRight" aria-label="Next chapter">{Icon.next}</button>
        </div>
        <nav className="tabs-nav" aria-label="Chapters">
          <ol className="tabs">
            {CHAPTERS.map((c, i) => (
              <li key={i}>
                <button type="button" className={"tab" + (i < ch ? " done" : "")} aria-current={i === ch ? "step" : undefined} onClick={() => go(i)}>
                  {/* The space keeps the accessible name "1 Steady state" rather than "1Steady state". */}
                  <span className="n">{i + 1}</span>{" "}<span className="t">{c.tab}</span>
                  {i === ch && i < LAST && started && !reduced && (
                    <span key={run + "-" + ch} className="prog run" aria-hidden="true"
                      style={{ animationDuration: c.dur + "ms", animationPlayState: playing ? "running" : "paused" }}></span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {reduced && started && ch < LAST && <p className="next-in" aria-hidden="true">{playing && left ? `Next in ${left}s` : "Paused"}</p>}
        <p className="kbd-hint" aria-hidden="true"><kbd>←</kbd> <kbd>→</kbd><span className="kh-w"> step</span> · <kbd>Space</kbd><span className="kh-w"> play</span><span className="kh-r"> · <kbd>R</kbd> replay</span></p>
      </div>
    </section>
  );
}

// ── Mobile timeline ─────────────────────────────────────────────────────────
function Timeline({ data, err, onRetry, ch, setCh, reduced }) {
  const w = data && data.week;
  const listRef = useRef(null);
  const items = () => listRef.current ? Array.from(listRef.current.children) : [];

  // Arriving from the stage mid-walkthrough: pick up at the same chapter.
  useEffect(() => {
    if (ch > 0 && items()[ch]) items()[ch].scrollIntoView({ block: "start" });
  }, []);
  // The jump menu follows the reader.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const lis = items();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setCh(lis.indexOf(e.target)); });
    }, { rootMargin: "-35% 0px -60% 0px" });
    lis.forEach(l => io.observe(l));
    return () => io.disconnect();
  }, []);
  const jump = e => {
    const i = Number(e.target.value);
    setCh(i);
    const li = items()[i];
    if (!li) return;
    li.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    const h = li.querySelector("h2");
    if (h) h.focus({ preventScroll: true });
  };

  return (<>
    <div className="jump">
      <label>
        <span className="sr-only">Jump to chapter</span>
        <select value={ch} onChange={jump}>
          {CHAPTERS.map((c, i) => <option key={i} value={i}>Chapter {i + 1}/{CHAPTERS.length} · {c.tab}</option>)}
        </select>
      </label>
    </div>
    <ol className="mtl" ref={listRef}>
      {CHAPTERS.map((c, i) => {
        const t = i === LAST ? endCopy(w) : chapterText(i, w);
        const showLedger = c.ledger === "pending" || c.ledger === "settled" || (c.ledger === "week" && !c.compare && i !== LAST);
        return (
          <li key={i}>
            <span className="num" aria-hidden="true">{i + 1}</span>
            <div>
              <h2 tabIndex={-1}><span className="sr-only">Chapter {i + 1}, {c.tab}: </span>{t.headline}</h2>
              {t.detail && <p className="detail">{t.detail}</p>}
              <MiniStrip m={c.mini} />
              {c.events.length > 0 && c.mobileEvents !== false && <EventList events={c.events} />}
              {showLedger && <div className="mblock"><Ledger chapter={i} data={data} err={err} onRetry={onRetry} mobile /></div>}
              {c.compare && <div className="mblock"><Comparison data={data} err={err} onRetry={onRetry} /></div>}
              {i === LAST && <EndActions />}
            </div>
          </li>
        );
      })}
    </ol>
  </>);
}

// ── App ─────────────────────────────────────────────────────────────────────
function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q), f = () => setM(mq.matches);
    mq.addEventListener("change", f); f();
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

// A render error shows the data-error state instead of a blank stage.
const Base = HAS_REACT ? React.Component : class {};
class ErrorBoundary extends Base {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { if (window.console) console.error(e); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal">
        <DataError />
        <p>{SUMMARY}</p>
        <p><a href={window.location.href}>Reload the walkthrough</a></p>
      </div>
    );
  }
}

function App() {
  const guided = new URLSearchParams(window.location.search).get("mode") === "guided";
  // Below 900px the strip's labels get too small to read, so narrow screens get the timeline.
  const mobile = useMedia("(max-width: 899px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  // Chapter and start state live here, so crossing 900px keeps the reader's place.
  const [ch, setCh] = useState(0);
  const [started, setStarted] = useState(guided);
  const load = useCallback(() => {
    setErr(false);
    const ctl = "AbortController" in window ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctl) ctl.abort(); }, 8000);
    fetch(DATA_URL, ctl ? { signal: ctl.signal } : undefined)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(d => { if (!validData(d)) throw new Error("shape"); setData(d); })
      .catch(() => { setData(null); setErr(true); })
      .finally(() => clearTimeout(timer));
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <ErrorBoundary>
      {mobile
        ? <Timeline data={data} err={err} onRetry={load} ch={ch} setCh={setCh} reduced={reduced} />
        : <Stage data={data} err={err} onRetry={load} guided={guided} reduced={reduced}
            ch={ch} setCh={setCh} started={started} setStarted={setStarted} />}
    </ErrorBoundary>
  );
}

if (HAS_REACT && ROOT) {
  ReactDOM.createRoot(ROOT).render(<App />);
} else if (ROOT) {
  ROOT.innerHTML = "";
  const box = document.createElement("div");
  box.className = "fatal";
  const p1 = document.createElement("p");
  p1.textContent = "The interactive walkthrough couldn’t load. " + SUMMARY;
  const p2 = document.createElement("p");
  const a = document.createElement("a");
  a.href = window.location.href;
  a.textContent = "Reload";
  p2.appendChild(a);
  box.append(p1, p2);
  ROOT.appendChild(box);
}
