# Topology Visualization — NthLayer Ecosystem Integration

**Date**: 2026-03-21
**Status**: Approved
**File**: `nthlayer-topology.html`

## Problem

The topology visualization shows 29 services degrading and recovering during a scripted incident scenario, but NthLayer's ecosystem components (measure, correlate, respond, learn) are invisible. The viewer sees services change colour and reads event feed text describing what NthLayer did, but never sees NthLayer doing it. The ecosystem is narrated, not shown.

## Solution

Add the 4 running NthLayer ecosystem components as visible, interactive nodes in a dedicated platform region. They activate with directional signal lines during the scenario, showing the real data flows: services emit signals to NthLayer components, components communicate via verdict lineage, and components act back on services.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement | Dedicated "NthLayer" 5th platform region at bottom-center | NthLayer is its own infrastructure, not embedded in the service mesh |
| Activation model | Edges invisible until activated (event-driven, ephemeral) | Matches reality — NthLayer receives signals on events, not via persistent connections |
| Signal visual | Directional pulse lines with branded particles | Reuses existing particle visual language, direction shows real data flow |
| Inter-component edges | Visible (subtle when inactive, bright when active) | Verdict lineage chain is a core architectural feature |
| nthlayer-learn shape | Cylinder (database) vs diamonds for agents | Learn is a data store, not an active agent |
| Static layer | Brief text annotation in Phase 1, not a persistent node | OpenSRM spec and `nthlayer generate` are build-time tools, not running services |
| Autonomy reduction | Added to Recovery phase | Safety ratchet is a key differentiator, fits naturally in post-incident |
| Second scenario | Deferred | Current scenario already shows both AI and traditional infra incidents |

## NthLayer Platform Region

### Layout

Positioned at bottom-center of the canvas, below the service topology. Labeled "NTHLAYER" in the same style as ON-PREM/AWS/GCP/EXT region labels.

```
                  ┌─────────────────────────────┐
                  │     Service Topology         │
                  │  ON-PREM / AWS / GCP / EXT   │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────┴───────────────┐
                  │        NTHLAYER              │
                  │                              │
                  │  ◆ measure    ◆ correlate    │
                  │        ◆ respond             │
                  │        ▐▌ learn              │
                  └──────────────────────────────┘
```

### Nodes

| Node | Shape | Colour | Position |
|------|-------|--------|----------|
| nthlayer-measure | Diamond (rotated square) | #b48ead | Left-of-center |
| nthlayer-correlate | Diamond | #ebcb8b | Center |
| nthlayer-respond | Diamond | #bf616a | Right-of-center |
| nthlayer-learn | Cylinder (database) | #a3be8c | Center-bottom, below the three agents |

### Static Inter-Component Edges

Always present (subtle when inactive, bright when activated):

- measure → learn (verdict storage)
- measure → respond (governance — autonomy reduction)
- correlate → learn (verdict storage)
- correlate → respond (verdict handoff)
- respond → learn (verdict storage)

### Node Rendering

- Diamonds: same size as "standard" tier service node, drawn as 45° rotated square. Brand colour gradient fill matching service node treatment.
- Cylinder: rectangle with elliptical top/bottom caps. Same height as diamond nodes.
- Labels below each node: `measure`, `correlate`, `respond`, `learn` — NthLayer labels use their brand colour (not default grey).
- No health rings (NthLayer components don't have error budgets in this visualization).
- Inactive: ~30% opacity. Active: 100% opacity with subtle glow in brand colour.

## Signal Activation

### Signal Line Rendering

- Coloured by the **receiving** NthLayer component's brand colour
- ~2x thickness of service-to-service edges
- A bright particle (3-4x size of traffic particles) travels along the line from source → destination
- Line draws on progressively as the particle travels (not instant)
- Receiving node pulses brighter when particle arrives
- Line fades over ~2.5 seconds after particle arrival

### Outbound Action Lines (NthLayer → services)

Same mechanic, particle travels from NthLayer outward to the service:
- respond → services: uses #bf616a (respond's colour)
- measure → fraud-detect (autonomy reduction): uses #b48ead with dashed pattern to distinguish governance from data reception

### Phase-by-Phase Activation

#### Phase 1 — Steady State (14s)

- All services green, traffic particles flowing normally
- NthLayer region visible but dim (nodes at ~30% opacity, inter-component edges barely visible)
- **Spec annotation**: Text fades in near NthLayer region: "monitoring infrastructure generated from OpenSRM specs" with subtle sweep toward service topology. Fades out by ~4 seconds.

#### Phase 2 — Bad Deploy (16s)

- fraud-detect degrades (existing)
- **Signal**: fraud-detect → nthlayer-measure (quality evaluation received). Measure activates.
- **Signal**: measure → nthlayer-learn (verdict stored). Learn glows briefly.
- Event feed: existing MEASURE event
- Key visual: Prometheus still green, but measure has already lit up

#### Phase 3 — Dual Failure (20s)

- Services degrade across platforms (existing)
- **Signals**: Multiple service → nthlayer-correlate lines (fraud-detect, payment-api, config-service, etc. — alerts, metrics, logs arriving)
- **Signal**: measure → correlate (quality verdicts as correlation input)
- Correlate node glows as signals accumulate
- Event feed: existing METRIC and LOG+CONFIG events

#### Phase 4 — Correlation (20s)

- **Signal**: correlate → nthlayer-respond (verdict handoff). Respond activates.
- **Signals**: respond → services (remediation actions outbound — rollback fraud-detect, restart config-service)
- **Signals**: correlate → learn, respond → learn (verdict chain stored)
- Existing trace lines still show two incident root-cause paths
- Event feed: existing CORRELATE and RESPOND events

#### Phase 5 — Recovery (20s)

- Services recovering (existing)
- **Signal**: measure → fraud-detect (autonomy reduction — dashed outbound line). fraud-detect's autonomy reduced to supervised.
- **Signals**: All components → learn (retrospective verdicts). Learn glows prominently.
- **New event**: `MEASURE` — "fraud-detect autonomy reduced: full → supervised · model v2.3 reversal rate exceeded judgment SLO · human approval required to restore"
- Event feed: existing LEARN events plus new MEASURE governance event

## Polish Items

### Label Readability

- Increase base font size from 6.5 → 7.5 (scaled by canvas factor)
- NthLayer node labels use their brand colour instead of default grey (#9CA3AF)

### Platform Region Grouping

- Draw subtle rounded-rect boundaries behind each platform's service cluster
- Uses existing `PLATFORM_COLORS` bg/border values which are defined but not currently rendered as shapes
- NthLayer region gets same treatment with #88c0d0 border colour

### Particle Semantics

- Existing traffic particles: unchanged (represent service-to-service request flow, colour/speed already varies with health)
- NthLayer signal particles: visually distinct (larger, branded colour, directional, ephemeral with glow trail)
- No risk of confusion between the two

## Implementation Notes

### New Data Structures

```javascript
// NthLayer ecosystem nodes (separate from SERVICES array)
const ECOSYSTEM = [
  { id: "nthlayer-measure", shape: "diamond", color: "#b48ead", label: "measure", x: TBD, y: TBD },
  { id: "nthlayer-correlate", shape: "diamond", color: "#ebcb8b", label: "correlate", x: TBD, y: TBD },
  { id: "nthlayer-respond", shape: "diamond", color: "#bf616a", label: "respond", x: TBD, y: TBD },
  { id: "nthlayer-learn", shape: "cylinder", color: "#a3be8c", label: "learn", x: TBD, y: TBD },
];

// Static edges within NthLayer region
const ECO_EDGES = [
  { from: "nthlayer-measure", to: "nthlayer-learn" },
  { from: "nthlayer-measure", to: "nthlayer-respond" },  // governance
  { from: "nthlayer-correlate", to: "nthlayer-learn" },
  { from: "nthlayer-correlate", to: "nthlayer-respond" },
  { from: "nthlayer-respond", to: "nthlayer-learn" },
];

// Per-phase signal activations (new)
// Each signal: { from, to, color, dashed?, delay_ms }
// Added to PHASES as a `signals` array
```

### New Rendering

- Diamond draw function (rotated square with gradient fill)
- Cylinder draw function (rect + ellipse caps)
- Signal line renderer (progressive draw-on, particle travel, fade-out)
- Platform region boundary renderer (rounded rects from service cluster bounds)
- Spec annotation renderer (fade in/out text for Phase 1)

### State Additions

```javascript
// Added to st.current (useRef state)
{
  ecoOpacity: { measure: 0.3, correlate: 0.3, respond: 0.3, learn: 0.3 },
  ecoTargetOpacity: { ... },
  activeSignals: [],  // { from, to, color, dashed, t, spd, fadeT }
}
```

## Files Changed

- `nthlayer-topology.html` — all changes in this single file

## Accept Criteria

- NthLayer platform region visible at bottom-center with 4 correctly-shaped nodes
- Nodes are dim during Steady State, activate per the phase mapping above
- Directional signal lines appear between services and NthLayer components at the right moments
- Inter-component signal lines (e.g. correlate → respond) fire during Correlation phase
- Autonomy reduction signal (measure → fraud-detect, dashed) appears during Recovery
- New MEASURE governance event appears in the event feed during Recovery
- Platform region boundaries visible for all 5 regions
- Labels readable at 1280×720 and 1920×1080 viewports
