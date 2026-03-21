# Topology Ecosystem Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 4 running NthLayer ecosystem components (measure, correlate, respond, learn) as visible, interactive nodes in the topology visualization with event-driven signal activation across the 5 scenario phases.

**Architecture:** All changes in a single file (`nthlayer-topology.html`). New data constants (ECOSYSTEM, ECO_EDGES, phase signals) are added alongside existing SERVICES/EDGES/PHASES. New draw functions (diamond, cylinder, signal line, platform boundary) are added to the existing `animate` callback's canvas rendering pipeline. State additions go into the existing `st.current` useRef object.

**Tech Stack:** React 18 + Babel (CDN), HTML5 Canvas, requestAnimationFrame loop. No build tooling.

**Spec:** `docs/superpowers/specs/2026-03-21-topology-ecosystem-integration-design.md`

---

### Task 1: Add ECOSYSTEM and ECO_EDGES data constants

**Files:**
- Modify: `nthlayer-topology.html:130-148` (after EDGES, before Brand section)

This task adds the ecosystem node definitions and their static inter-component edges. No rendering yet — just data.

- [ ] **Step 1: Add ECOSYSTEM array after EDGES (line 131)**

Insert after line 130 (`];` closing EDGES) and before line 132 (`// ── Brand`):

```javascript
// ── NthLayer Ecosystem (running components) ─────────────────────────────────
const ECOSYSTEM = [
  { id: "nthlayer-measure",   shape: "diamond",  color: "#b48ead", label: "measure",   x: -60,  y: 290 },
  { id: "nthlayer-correlate", shape: "diamond",  color: "#ebcb8b", label: "correlate", x: 30,   y: 280 },
  { id: "nthlayer-respond",   shape: "diamond",  color: "#bf616a", label: "respond",   x: 120,  y: 290 },
  { id: "nthlayer-learn",     shape: "cylinder", color: "#a3be8c", label: "learn",     x: 30,   y: 340 },
];

const ECO_EDGES = [
  { from: "nthlayer-measure",   to: "nthlayer-learn" },
  { from: "nthlayer-measure",   to: "nthlayer-respond" },   // governance
  { from: "nthlayer-correlate", to: "nthlayer-learn" },
  { from: "nthlayer-correlate", to: "nthlayer-respond" },
  { from: "nthlayer-respond",   to: "nthlayer-learn" },
];
```

- [ ] **Step 2: Add "nthlayer" to PLATFORM_COLORS**

Add entry to the existing `PLATFORM_COLORS` object (after `"external"` entry, line 147):

```javascript
  "nthlayer":{ bg: "rgba(136,192,208,0.03)", border: "rgba(136,192,208,0.10)", label: "#88c0d0", name: "NTHLAYER" },
```

- [ ] **Step 3: Open in browser and verify no errors**

Open `nthlayer-topology.html` in browser. The visualization should render exactly as before — no visible changes yet, but no console errors from the new constants.

- [ ] **Step 4: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: add ECOSYSTEM and ECO_EDGES data constants for NthLayer components"
```

---

### Task 2: Add ecosystem state to useRef and phase signal definitions

**Files:**
- Modify: `nthlayer-topology.html` — `st.current` init (~line 244), PHASES array (~lines 161-220)

- [ ] **Step 1: Add ecosystem opacity and signal state to st.current**

In the `st.current` object initializer (currently lines 244-252), add after `hovered: null,`:

```javascript
    ecoOpacity: Object.fromEntries(ECOSYSTEM.map(e => [e.id, 0.3])),
    ecoTargetOpacity: Object.fromEntries(ECOSYSTEM.map(e => [e.id, 0.3])),
    activeSignals: [],  // { fromX, fromY, toX, toY, color, dashed, t, spd, fadeT, alive }
```

- [ ] **Step 2: Add `signals` and `ecoActivate` arrays to each PHASE**

Update each phase object. Add two new fields: `signals` (ephemeral signal lines to fire) and `ecoActivate` (which ecosystem nodes should go to full opacity).

Phase 0 — Steady State:
```javascript
    signals: [],
    ecoActivate: [],
```

Phase 1 — Bad Deploy:
```javascript
    signals: [
      { from: "fraud-detect", to: "nthlayer-measure", color: "#b48ead", delay: 2000 },
      { from: "nthlayer-measure", to: "nthlayer-learn", color: "#a3be8c", delay: 5000 },
    ],
    ecoActivate: ["nthlayer-measure", "nthlayer-learn"],
```

Phase 2 — Dual Failure:
```javascript
    signals: [
      { from: "fraud-detect", to: "nthlayer-correlate", color: "#ebcb8b", delay: 1000 },
      { from: "payment-api", to: "nthlayer-correlate", color: "#ebcb8b", delay: 2500 },
      { from: "config-service", to: "nthlayer-correlate", color: "#ebcb8b", delay: 4000 },
      { from: "checkout-svc", to: "nthlayer-correlate", color: "#ebcb8b", delay: 5500 },
      { from: "nthlayer-measure", to: "nthlayer-correlate", color: "#ebcb8b", delay: 7000 },
    ],
    ecoActivate: ["nthlayer-measure", "nthlayer-correlate", "nthlayer-learn"],
```

Phase 3 — Correlation:
```javascript
    signals: [
      { from: "nthlayer-correlate", to: "nthlayer-respond", color: "#bf616a", delay: 2000 },
      { from: "nthlayer-respond", to: "fraud-detect", color: "#bf616a", delay: 5000 },
      { from: "nthlayer-respond", to: "config-service", color: "#bf616a", delay: 6000 },
      { from: "nthlayer-correlate", to: "nthlayer-learn", color: "#a3be8c", delay: 8000 },
      { from: "nthlayer-respond", to: "nthlayer-learn", color: "#a3be8c", delay: 9000 },
    ],
    ecoActivate: ["nthlayer-measure", "nthlayer-correlate", "nthlayer-respond", "nthlayer-learn"],
```

Phase 4 — Recovery:
```javascript
    signals: [
      { from: "nthlayer-measure", to: "fraud-detect", color: "#b48ead", delay: 3000, dashed: true },
      { from: "nthlayer-measure", to: "nthlayer-learn", color: "#a3be8c", delay: 6000 },
      { from: "nthlayer-correlate", to: "nthlayer-learn", color: "#a3be8c", delay: 7000 },
      { from: "nthlayer-respond", to: "nthlayer-learn", color: "#a3be8c", delay: 8000 },
    ],
    ecoActivate: ["nthlayer-measure", "nthlayer-correlate", "nthlayer-respond", "nthlayer-learn"],
```

- [ ] **Step 3: Add new MEASURE event to Recovery phase events**

Append to `PHASES[4].events` array (currently 2 LEARN events):

```javascript
      { text: "fraud-detect autonomy reduced: full → supervised · model v2.3 reversal rate exceeded judgment SLO · human approval required to restore", tag: "MEASURE", src: "governance", color: "#b48ead" },
```

- [ ] **Step 4: Open in browser, verify no errors**

No visual changes yet — just data. Console should be clean.

- [ ] **Step 5: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: add ecosystem state, phase signal definitions, and governance event"
```

---

### Task 3: Draw platform region boundaries

**Files:**
- Modify: `nthlayer-topology.html` — `animate` function, after background gradient fill (~line 336), replacing existing platform label code (~lines 337-353)

- [ ] **Step 1: Replace platform label rendering with platform region boundaries**

Replace lines 337-353 (the `platformPositions` block) with a function that computes bounding boxes from service positions and draws rounded rectangles:

```javascript
    // Platform region boundaries
    const platformGroups = { "on-prem": [], "aws": [], "gcp": [], "external": [] };
    SERVICES.forEach(sv => platformGroups[sv.platform].push(sv));
    // Add NthLayer region from ECOSYSTEM nodes
    platformGroups["nthlayer"] = ECOSYSTEM;

    Object.entries(platformGroups).forEach(([plat, nodes]) => {
      if (!nodes.length) return;
      const pc = PLATFORM_COLORS[plat];
      const pad = 30 * sc;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        const nx = cx + n.x * sc, ny = cy + n.y * sc;
        if (nx < minX) minX = nx; if (ny < minY) minY = ny;
        if (nx > maxX) maxX = nx; if (ny > maxY) maxY = ny;
      });
      const rx = minX - pad, ry = minY - pad, rw = maxX - minX + pad * 2, rh = maxY - minY + pad * 2;
      const radius = 8 * sc;
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry); ctx.arcTo(rx + rw, ry, rx + rw, ry + radius, radius);
      ctx.lineTo(rx + rw, ry + rh - radius); ctx.arcTo(rx + rw, ry + rh, rx + rw - radius, ry + rh, radius);
      ctx.lineTo(rx + radius, ry + rh); ctx.arcTo(rx, ry + rh, rx, ry + rh - radius, radius);
      ctx.lineTo(rx, ry + radius); ctx.arcTo(rx, ry, rx + radius, ry, radius);
      ctx.closePath();
      ctx.fillStyle = pc.bg;
      ctx.fill();
      ctx.strokeStyle = pc.border;
      ctx.lineWidth = 0.5 * sc;
      ctx.stroke();
      // Region label
      ctx.fillStyle = pc.label + "22";
      ctx.font = `bold ${6 * sc}px 'JetBrains Mono',monospace`;
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(pc.name, rx + 4 * sc, ry + 3 * sc);
    });
```

- [ ] **Step 2: Open in browser, verify all 5 platform regions have subtle boundaries**

Verify: ON-PREM, AWS, GCP, EXTERNAL, and NTHLAYER regions each have a rounded rectangle with their platform colour. The NTHLAYER region should be at the bottom-center (it will be empty visually for now — nodes come in the next task).

- [ ] **Step 3: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: draw platform region boundaries for all 5 regions"
```

---

### Task 4: Render ecosystem nodes (diamond + cylinder)

**Files:**
- Modify: `nthlayer-topology.html` — `animate` function, after existing node rendering (~line 454), and `pos` helper (~line 299)

- [ ] **Step 1: Update pos() helper to find ecosystem nodes too**

Replace the `pos` callback (line 299):

```javascript
  const pos = useCallback(id => {
    const svc = SERVICES.find(s => s.id === id);
    if (svc) return svc;
    return ECOSYSTEM.find(e => e.id === id) || { x: 0, y: 0 };
  }, []);
```

- [ ] **Step 2: Add ecosystem opacity lerp to the animate loop**

After the existing service health lerp (line 330: `SERVICES.forEach(sv => { s.h[sv.id] = lerp(...)`)  add:

```javascript
    ECOSYSTEM.forEach(en => {
      s.ecoOpacity[en.id] = lerp(s.ecoOpacity[en.id], s.ecoTargetOpacity[en.id], 0.003 * dt);
    });
```

- [ ] **Step 3: Draw ECO_EDGES (static inter-component edges)**

Insert after the existing EDGES rendering block and before the Particles block. These are always visible but at the current node opacity:

```javascript
    // Ecosystem inter-component edges
    ECO_EDGES.forEach(e => {
      const f = pos(e.from), t = pos(e.to);
      const opacity = Math.min(s.ecoOpacity[e.from], s.ecoOpacity[e.to]);
      ctx.beginPath();
      ctx.moveTo(cx + f.x * sc, cy + f.y * sc);
      ctx.lineTo(cx + t.x * sc, cy + t.y * sc);
      ctx.strokeStyle = `rgba(136,192,208,${0.12 * opacity})`;
      ctx.lineWidth = 0.6 * sc;
      ctx.stroke();
    });
```

- [ ] **Step 4: Draw ecosystem nodes after service nodes**

Insert after the existing `SERVICES.forEach` node rendering block (after line 454, after the closing `});`):

```javascript
    // Ecosystem nodes
    ECOSYSTEM.forEach(en => {
      const x = cx + en.x * sc, y = cy + en.y * sc;
      const r = TIER_R.standard * sc;
      const opacity = s.ecoOpacity[en.id];
      const dx = mouse.current.x - x, dy = mouse.current.y - y;
      const isH = dx * dx + dy * dy < (r + 8) * (r + 8);
      if (isH) curH = en.id;

      ctx.globalAlpha = opacity;

      // Glow when active
      if (opacity > 0.6) {
        ctx.beginPath(); ctx.arc(x, y, r + 6 * sc, 0, 6.28);
        ctx.fillStyle = en.color + "15";
        ctx.fill();
      }

      if (en.shape === "diamond") {
        // Rotated square
        const ng = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
        ng.addColorStop(0, en.color + "40"); ng.addColorStop(1, en.color + "0a");
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fillStyle = ng; ctx.fill();
        ctx.strokeStyle = en.color + (isH ? "cc" : "66");
        ctx.lineWidth = (isH ? 1.2 : 0.7) * sc; ctx.stroke();
      } else {
        // Cylinder (database)
        const cw = r * 1.2, ch = r * 1.6, ey = ch * 0.25;
        const ng = ctx.createRadialGradient(x, y, 0, x, y, r);
        ng.addColorStop(0, en.color + "40"); ng.addColorStop(1, en.color + "0a");
        // Body
        ctx.beginPath();
        ctx.moveTo(x - cw, y - ch / 2 + ey); ctx.lineTo(x - cw, y + ch / 2 - ey);
        ctx.quadraticCurveTo(x - cw, y + ch / 2 + ey, x, y + ch / 2 + ey);
        ctx.quadraticCurveTo(x + cw, y + ch / 2 + ey, x + cw, y + ch / 2 - ey);
        ctx.lineTo(x + cw, y - ch / 2 + ey);
        ctx.quadraticCurveTo(x + cw, y - ch / 2 - ey, x, y - ch / 2 - ey);
        ctx.quadraticCurveTo(x - cw, y - ch / 2 - ey, x - cw, y - ch / 2 + ey);
        ctx.closePath();
        ctx.fillStyle = ng; ctx.fill();
        ctx.strokeStyle = en.color + (isH ? "cc" : "66");
        ctx.lineWidth = (isH ? 1.2 : 0.7) * sc; ctx.stroke();
        // Top ellipse
        ctx.beginPath();
        ctx.ellipse(x, y - ch / 2 + ey, cw, ey, 0, 0, 6.28);
        ctx.strokeStyle = en.color + (isH ? "cc" : "44");
        ctx.lineWidth = 0.5 * sc; ctx.stroke();
      }

      // Label — brand colour
      const label = en.label;
      const fontSize = (isH ? 7.5 : 7) * sc;
      ctx.font = `${isH ? "bold " : ""}${fontSize}px 'JetBrains Mono',monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      const ly = y + r + 4 * sc;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(11,17,32,0.75)";
      ctx.fillRect(x - tw / 2 - 2, ly - 1, tw + 4, fontSize + 2);
      ctx.fillStyle = en.color + (isH ? "ff" : "aa");
      ctx.fillText(label, x, ly);

      ctx.globalAlpha = 1;
    });
```

- [ ] **Step 5: Update hover tooltip to handle ecosystem nodes**

In the hover tooltip JSX (lines 566-580), update to show ecosystem node info. Replace the `hovSvc` lookup logic:

After existing line 496 (`const hovSvc = hovered ? SERVICES.find(s => s.id === hovered) : null;`), add:

```javascript
  const hovEco = hovered ? ECOSYSTEM.find(e => e.id === hovered) : null;
```

Then wrap the hover tooltip JSX to handle both cases. Replace the existing `{hovSvc && (` block with:

```javascript
      {(hovSvc || hovEco) && (
        <div style={{ position: "absolute", bottom: 42, right: 12, zIndex: 10, background: "rgba(11,17,32,0.9)", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "5px 9px", minWidth: 105, backdropFilter: "blur(6px)" }}>
          <div style={{ color: TEXT1, fontSize: 8.5, fontWeight: 600, marginBottom: 3 }}>{hovSvc ? hovSvc.id : hovEco.id}</div>
          {hovSvc ? (
            <>
              {[["PLATFORM", hovSvc.platform], ["TIER", hovSvc.tier], ["TYPE", hovSvc.type]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ color: TEXT3, fontSize: 6.5 }}>{k}</span>
                  <span style={{ color: TEXT4, fontSize: 6.5 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: TEXT3, fontSize: 6.5 }}>HEALTH</span>
                <span style={{ color: hRgb(hovH), fontSize: 6.5 }}>{(hovH * 100).toFixed(1)}%</span>
              </div>
            </>
          ) : (
            <>
              {[["COMPONENT", hovEco.label], ["SHAPE", hovEco.shape], ["ROLE", hovEco.shape === "cylinder" ? "data store" : "agent"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ color: TEXT3, fontSize: 6.5 }}>{k}</span>
                  <span style={{ color: hovEco.color, fontSize: 6.5 }}>{v}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
```

- [ ] **Step 6: Open in browser, verify ecosystem nodes render**

Verify: 4 nodes visible in the NTHLAYER region at bottom-center. 3 diamonds (measure, correlate, respond) and 1 cylinder (learn). All should be dim (~30% opacity). Labels show in brand colours. Hovering shows tooltip. Inter-component edges faintly visible.

- [ ] **Step 7: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: render ecosystem nodes (diamond + cylinder) with hover tooltips"
```

---

### Task 5: Implement signal line renderer and phase activation logic

**Files:**
- Modify: `nthlayer-topology.html` — `animate` function (signal spawning in phase transition, signal rendering, opacity targets), phase transition handler (~lines 312-328)

- [ ] **Step 1: Update phase transition to set ecosystem opacity targets and spawn signals**

In the phase transition block (inside `if (s.pt >= PHASES[s.pi].dur)`), after the existing `s.traceAI_P = []; s.traceInfra_P = [];` line, add:

```javascript
          // Set ecosystem opacity targets
          ECOSYSTEM.forEach(en => { s.ecoTargetOpacity[en.id] = 0.3; });
          (np.ecoActivate || []).forEach(id => { s.ecoTargetOpacity[id] = 1.0; });
          // Queue signal lines
          s.pendingSignals = (np.signals || []).map(sig => ({ ...sig, fired: false }));
```

- [ ] **Step 2: Add signal spawning in the playing block**

After the phase transition check but still inside the `if (s.playing)` block (before the closing `}`), add signal spawning based on elapsed phase time:

```javascript
      // Fire pending signals based on phase elapsed time
      if (s.pendingSignals) {
        s.pendingSignals.forEach(sig => {
          if (!sig.fired && s.pt >= (sig.delay || 0)) {
            sig.fired = true;
            const f = pos(sig.from), t = pos(sig.to);
            s.activeSignals.push({
              fromX: cx + f.x * sc, fromY: cy + f.y * sc,
              toX: cx + t.x * sc, toY: cy + t.y * sc,
              color: sig.color, dashed: !!sig.dashed,
              t: 0, spd: 0.4, fadeT: 0, alive: true,
              toId: sig.to,
            });
          }
        });
      }
```

Note: `cx`, `cy`, `sc` are computed at the top of `animate` and are in scope here.

- [ ] **Step 3: Add signal rendering in the animate loop**

Insert after the trace rendering block (`if (s.traceInfra) drawTrace(...)`) and before the Nodes section:

```javascript
    // Active signal lines
    for (let i = s.activeSignals.length - 1; i >= 0; i--) {
      const sig = s.activeSignals[i];
      if (sig.t < 1) {
        // Particle traveling — draw line up to particle position
        sig.t += (sig.spd * dt) / 2000;
        const px = lerp(sig.fromX, sig.toX, sig.t);
        const py = lerp(sig.fromY, sig.toY, sig.t);
        // Line from source to particle
        ctx.beginPath(); ctx.moveTo(sig.fromX, sig.fromY); ctx.lineTo(px, py);
        ctx.strokeStyle = sig.color + "55";
        ctx.lineWidth = 1.6 * sc;
        if (sig.dashed) { ctx.setLineDash([4 * sc, 3 * sc]); }
        ctx.stroke();
        if (sig.dashed) { ctx.setLineDash([]); }
        // Particle glow
        ctx.beginPath(); ctx.arc(px, py, 4 * sc, 0, 6.28);
        ctx.fillStyle = sig.color + "20"; ctx.fill();
        // Particle core
        ctx.beginPath(); ctx.arc(px, py, 2 * sc, 0, 6.28);
        ctx.fillStyle = sig.color + "cc"; ctx.fill();
      } else if (sig.fadeT < 2500) {
        // Particle arrived — pulse target node, fade line
        sig.fadeT += dt;
        const fadeAlpha = Math.max(0, 1 - sig.fadeT / 2500);
        const alphaHex = Math.round(fadeAlpha * 0x55).toString(16).padStart(2, "0");
        ctx.beginPath(); ctx.moveTo(sig.fromX, sig.fromY); ctx.lineTo(sig.toX, sig.toY);
        ctx.strokeStyle = sig.color + alphaHex;
        ctx.lineWidth = 1.6 * sc;
        if (sig.dashed) { ctx.setLineDash([4 * sc, 3 * sc]); }
        ctx.stroke();
        if (sig.dashed) { ctx.setLineDash([]); }
        // Pulse ring at destination on first frame after arrival
        if (sig.fadeT < dt * 2) {
          const eNode = ECOSYSTEM.find(e => e.id === sig.toId);
          if (eNode) s.ecoTargetOpacity[eNode.id] = 1.0;
        }
      } else {
        s.activeSignals.splice(i, 1);
      }
    }
```

- [ ] **Step 4: Reset ecosystem state on scenario restart**

In the `go` callback (line 479-486), add resets for ecosystem state after the existing `SERVICES.forEach`:

```javascript
    ECOSYSTEM.forEach(en => { s2.ecoOpacity[en.id] = 0.3; s2.ecoTargetOpacity[en.id] = 0.3; });
    s2.activeSignals = []; s2.pendingSignals = [];
```

- [ ] **Step 5: Open in browser, play scenario, verify signal activation**

Verify per phase:
- Phase 1 (Steady State): NthLayer nodes dim, no signals
- Phase 2 (Bad Deploy): Signal from fraud-detect to measure, then measure to learn. Both nodes brighten.
- Phase 3 (Dual Failure): Multiple signals converge on correlate from services. Correlate brightens.
- Phase 4 (Correlation): Signal from correlate to respond. Respond sends signals outward to fraud-detect and config-service. Verdict chain signals to learn.
- Phase 5 (Recovery): Dashed signal from measure to fraud-detect. All components send to learn. New MEASURE event in feed.

- [ ] **Step 6: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: implement signal line renderer and phase activation logic"
```

---

### Task 6: Steady State spec annotation

**Files:**
- Modify: `nthlayer-topology.html` — `animate` function, `st.current` state

- [ ] **Step 1: Add annotation state**

No new state needed — opacity computed directly from phase elapsed time.

- [ ] **Step 1: Add annotation rendering in the animate loop**

Insert in the animate function, after platform region boundaries and before edges. The annotation shows during the first 5 seconds of Phase 1:

```javascript
    // Spec annotation (Phase 1 only, first 5s)
    if (s.pi === 0 && s.playing) {
      const annoT = s.pt / 1000; // seconds
      let annoAlpha = 0;
      if (annoT < 0.5) annoAlpha = annoT / 0.5;          // fade in 0-0.5s
      else if (annoT < 3.5) annoAlpha = 1;                // hold 0.5-3.5s
      else if (annoT < 5) annoAlpha = 1 - (annoT - 3.5) / 1.5; // fade out 3.5-5s
      if (annoAlpha > 0) {
        const nthRegion = ECOSYSTEM[1]; // correlate is center
        const ax = cx + nthRegion.x * sc, ay = cy + (nthRegion.y - 45) * sc;
        ctx.globalAlpha = annoAlpha * 0.6;
        ctx.font = `${5.5 * sc}px 'JetBrains Mono',monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = ACCENT;
        ctx.fillText("monitoring infrastructure generated from OpenSRM specs", ax, ay);
        ctx.globalAlpha = 1;
      }
    }
```

- [ ] **Step 2: Open in browser, play scenario, verify annotation appears and fades**

The text "monitoring infrastructure generated from OpenSRM specs" should fade in during the first second of Steady State, hold for ~3 seconds, then fade out.

- [ ] **Step 3: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: add spec annotation during Steady State phase"
```

---

### Task 7: Label readability improvement

**Files:**
- Modify: `nthlayer-topology.html` — service node label rendering (~lines 442-453)

- [ ] **Step 1: Increase service label base font size from 6.5 to 7.5**

Update line 443. Change:
```javascript
      const fontSize = (isH ? 7.5 : 6.5) * sc;
```
To:
```javascript
      const fontSize = (isH ? 8.5 : 7.5) * sc;
```

- [ ] **Step 2: Open in browser at 1280x720 and 1920x1080, verify labels are readable**

Service labels should be noticeably more readable at both viewport sizes. NthLayer labels (already set to 7.0 base in Task 4) are comparable.

- [ ] **Step 3: Commit**

```bash
git add nthlayer-topology.html
git commit -m "fix: increase service label font size for readability"
```

---

### Task 8: Update service count and final verification

**Files:**
- Modify: `nthlayer-topology.html` — start overlay tagline (~line 615), services counter (~line 607)

- [ ] **Step 1: Update start overlay tagline**

The current tagline is "DEFENSE-IN-DEPTH FOR AI AGENT SYSTEMS". The visualization now shows 29 services + 4 ecosystem components = 33 nodes. Update the services counter (line 607) to show the combined count, or keep it at 29 and add a separate "ECOSYSTEM" count.

Keep services at 29 (customer services) and add ecosystem indicator. Replace the counter block (lines 605-608):

```javascript
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: TEXT3, fontSize: 5.5, letterSpacing: 0.5 }}>SERVICES</span>
            <span style={{ color: TEXT2, fontSize: 11, fontWeight: 300 }}>{SERVICES.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: ACCENT, fontSize: 5.5, letterSpacing: 0.5 }}>NTHLAYER</span>
            <span style={{ color: ACCENT, fontSize: 11, fontWeight: 300 }}>{ECOSYSTEM.length}</span>
          </div>
        </div>
```

- [ ] **Step 2: Full scenario playthrough — verify all accept criteria**

Play the entire scenario start to finish and verify:

1. NthLayer platform region visible at bottom-center with 4 correctly-shaped nodes
2. Nodes are dim during Steady State, spec annotation fades in/out
3. Directional signal lines appear between services and NthLayer components per phase
4. Inter-component signal lines (correlate → respond) fire during Correlation phase
5. Autonomy reduction signal (measure → fraud-detect, dashed) appears during Recovery
6. New MEASURE governance event appears in the event feed during Recovery
7. Platform region boundaries visible for all 5 regions
8. Labels readable at 1280x720 and 1920x1080 viewports
9. Restart button resets ecosystem state properly
10. Hover tooltips work for both service and ecosystem nodes

- [ ] **Step 3: Commit**

```bash
git add nthlayer-topology.html
git commit -m "feat: update counters and complete ecosystem integration"
```
