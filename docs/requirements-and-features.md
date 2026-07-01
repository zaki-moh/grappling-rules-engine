# Grappling Rules Engine — Requirements & Features

> Living document. Captures the product vision, the MVP scope, what is built today,
> and where it is headed. Updated as the project evolves.

---

## 1. Product Vision

**A combat-sports analytics product for grappling.**

> Upload a single-angle grappling match video → automatically generate a useful,
> searchable, timestamped post-match breakdown for coaches and competitors.

The product is **not** trying to be an AI referee. The goal is not perfect AI
judging — it is to **save coaches time** by turning messy footage into structured,
reviewable match data. A timestamped report is valuable even when imperfect, which
makes it demoable and defensible; a scorebot is only valuable at ~99% accuracy.

### Explicitly out of scope (for now)
Real-time judging, multi-camera tracking, striking, multi-athlete/team brackets,
and full automated scoring. Scoring survives only as an **optional, confidence-gated
point estimate** inside the analytics — never the headline.

---

## 2. Core MVP Goal

Turn one uploaded grappling video into **structured match data**: a position
timeline, detected events, and an analytics summary that a coach can review and
correct.

### MVP Outputs

**1. Position timeline (the spine)** — a continuous, timestamped segmentation:
`standing, closed_guard, half_guard, side_control, mount, back_control, turtle,
scramble, unknown`.

**2. Event detection** — discrete moments, mostly *derived from* timeline transitions:
`guard_pass, sweep, reversal, submission_attempt, escape, back_take,
mount_transition, scramble`.

**3. Analytics summary** — per-athlete and match-level aggregates:
- Guard passes, sweeps/reversals, back takes, submission attempts, escapes
- Control time per athlete
- Time spent in each position
- Major transitions
- Optional estimated points (only when confidence is high)

---

## 3. Architecture Principles

1. **Timeline-as-spine.** The position timeline is the core primitive. Most events
   are *derived* from segment transitions (a guard pass IS guard → side control).
   Only scramble (motion-based) and submission attempt (no positional signal) are
   standalone detectors.
2. **Detectors propose; scoring/interpretation is centralized.** Detectors emit a
   shared, source-tagged `Candidate` (interval + evidence, no points). Reconcile →
   enrich → analytics/scoring happen in one place downstream. This keeps adding new
   detectors additive.
3. **Stub-first, swap behind the contract.** The position timeline is currently a
   deterministic stub, but the event-derivation and analytics layers are real and
   carry over. A real pose + position classifier replaces only the stub.
4. **Human corrections are the training flywheel.** Coaches confirm / correct /
   reject segments and events. Those corrections both fix the report now and become
   labeled training data later.
5. **Layer separation (CV → events → analytics → scoring).** Each layer is
   independently testable and swappable.

---

## 4. System Shape

**Backend** — FastAPI + OpenCV (in-memory store for MVP).
```
backend/app/
├── main.py                 # API: matches, video, analysis, timeline, events, analytics, corrections
├── pipeline.py             # orchestrator: IO → detectors → timeline → events
├── core/
│   ├── video_io.py         # shared frame sampling + metadata
│   ├── candidates.py       # shared Candidate / StabilityCheck contract
│   ├── timeline.py         # Position enum, position timeline (STUB + real scramble overlay)
│   ├── events.py           # EventType enum, REAL transition→event derivation, submission STUB
│   └── analytics.py        # REAL aggregation: control time, counts, time-in-position, gated points
└── detectors/
    └── scramble/           # REAL motion-based scramble detector (feeds the timeline)
```

**Frontend** — Next.js 16 + React 19 + Tailwind.
```
frontend/
├── app/matches/new         # create match + upload + start analysis
├── app/matches/[matchId]   # match breakdown: timeline bands, events, analytics, corrections
├── components/             # VideoReviewPanel, EventMarker, SelectedItemPanel, AnalyticsPanel
└── lib/display.ts          # shared labels, colors, formatting
```

---

## 5. Functional Requirements

### Match lifecycle
- FR-1 Create a match with two athletes (red/blue) and an optional ruleset.
- FR-2 Upload one single-angle video per match (before analysis starts).
- FR-3 Trigger analysis; status flows `created → processing → analyzed` (or `failed`).
- FR-4 Serve the uploaded video back for playback and replay windows.

### Analysis outputs
- FR-5 Produce a position timeline covering the full video (contiguous segments).
- FR-6 Produce detected events with timestamps, athlete, from/to position, confidence.
- FR-7 Produce an analytics summary derived from the timeline + events.
- FR-8 Fold real scramble-detector intervals into the timeline.

### Review & correction (the flywheel)
- FR-9 Confirm, reject, or reset any event; correct its type/athlete with a note.
- FR-10 Confirm or correct any position segment (position/top athlete) with a note.
- FR-11 Analytics recompute from *effective* (corrected, non-rejected) values.

### Presentation
- FR-12 Render the timeline as colored position bands with event markers.
- FR-13 Play a focused replay window for any selected event or segment.
- FR-14 Show the analytics breakdown (control time, counts, time-in-position, optional points).

---

## 6. Non-Functional Requirements
- NFR-1 The CV boundary stays behind one stable contract (`analyze_match_video`).
- NFR-2 Detectors are pure `(frames, metadata) → candidates`; sampling runs once.
- NFR-3 The product is demoable end-to-end at every stage (stub-first).
- NFR-4 Single-angle, offline (non-real-time) processing is acceptable for MVP.
- NFR-5 In-memory storage is acceptable for MVP; a real datastore comes later.

---

## 7. Current Status (built vs stubbed)

| Capability | Status |
|---|---|
| Match lifecycle, video upload/serve | ✅ Built |
| Scramble detection (motion + stability) | ✅ Built (real) |
| Position timeline | 🟡 Stub sequence + real scramble overlay |
| Event derivation from transitions | ✅ Built (real) |
| Submission-attempt detection | 🟡 Stub |
| Analytics (control time, counts, positions, gated points) | ✅ Built (real) |
| Coach corrections + analytics recompute | ✅ Built |
| Frontend match-breakdown UI | ✅ Built |
| Real pose + position classifier | ⛔ Deferred |
| Athlete tracking (stable red/blue identity) | ⛔ Deferred |
| Persistence / database | ⛔ Deferred (in-memory) |

---

## 8. Roadmap (near → far)

1. **Adaptive motion thresholding** — per-video thresholds vs the fixed scramble threshold.
2. **Pose detection** — MediaPipe / YOLO-Pose / MMPose keypoints over candidate windows.
3. **Athlete tracking** — maintain red/blue identity across frames (prereq for reliable attribution).
4. **Position classification** — replace the stubbed timeline with a real classifier
   (standing, guards, side, mount, back, turtle, scramble).
5. **Action classification** — refine non-positional events (submission attempts, takedowns).
6. **Ruleset-aware scoring** — turn confirmed events into points per ruleset (IBJJF/ADCC/Custom),
   kept separate from the CV layer.
7. **Corrections → training data** — export corrected clips as labels; model evaluation (precision/recall).
8. **Persistence & accounts** — datastore, athlete/coach accounts, match history.

---

## 9. Future Vision — Gamified Athlete Profiles

> Idea: give each athlete a **video-game-style progression profile** that turns
> their accumulated match analytics into a sense of measurable growth over time.

The analytics we already produce are the natural fuel for this — every match
contributes data points, so progression is a *byproduct* of the core product, not
a separate system.

### Concept
- **Profile per athlete** aggregating all of their analyzed matches.
- **XP & levels** earned from match activity: guard passes, sweeps, back takes,
  submission attempts, control time, clean escapes.
- **Position mastery / skill tree** — per-position proficiency (e.g. "Closed Guard",
  "Back Control") that levels up as the athlete accumulates time and successful
  actions from those positions.
- **Stats over time** — trends in control time, pass rate, escape rate,
  submission-attempt frequency across matches; "personal bests."
- **Streaks & milestones** — e.g. "10 matches analyzed", "first back take",
  "3 sweeps in one match", consistency streaks.
- **Style fingerprint** — a derived profile (guard player vs top-pressure vs
  scrambler) from where the athlete spends time and scores.

### What this needs first (dependencies)
- Stable **athlete identity** across matches (accounts) and within matches (tracking).
- **Persistence** for historical match data.
- Reliable **position + event accuracy** (so progression reflects reality) — which
  the correction flywheel and real classifier both serve.

### Why it fits the strategy
- Increases retention and "stickiness" for individual athletes, not just coaches.
- Reuses the exact data the MVP already generates — low marginal cost.
- The correction flywheel improves both the report *and* the progression accuracy.

> Status: **vision / not started.** Captured here so the data model and accounts
> work can keep it in mind (e.g. design athlete identity and persistence with
> per-athlete aggregation in view).
