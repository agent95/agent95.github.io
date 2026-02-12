# ShiftAudio Demo – Developer Notes (Current State)

## Overview

Vue 3 + Vite demo that simulates ShiftAudio safety announcements over a background bed playlist. The demo includes shift scheduling, queue management, emergency override, and a realtime/demo clock toggle.

---

## Core Concepts

- **Bed audio**: A continuous background playlist (from `/public/audio/<playlist>`). Crossfades between tracks and can be paused/ducked during announcements.
- **Announcements**: Safety messages are queued and delivered based on bed playback state and cadence.
- **Shift timeline**: Defines shift start/end and a break window. Start/stop controls the demo clock and queue lifecycle.
- **Realtime vs Demo**: Realtime uses system clock; Demo advances simulated time after the shift is started.

---

## App Flow

1. **Start Shift** (Shift Timeline card)
   - Sets the sim clock to shift start (demo mode).
   - Clears and reloads the safety schedule (“Loading schedule…” state).
2. **Delivery Rules**
   - **Bed playing** → deliver on **crossfade**.
   - **No bed** → deliver at **scheduled time** (if missed, skip).
   - **Manual trigger** → **immediate**.
   - **Emergency active** → no non-emergency messages play.
3. **Stop Shift**
   - Stops shift, pauses bed audio, clears the queue.
4. **Auto Stop**
   - When sim time reaches shift end, the shift stops and the queue is cleared.

---

## Key UI Areas

- **Brand Bar** (`src/components/shell/BrandBar.vue`)
  - Logo + Realtime/Demo tabs + clock at the right end.
- **Shift Timeline** (`src/components/cards/ShiftTimelineCard.vue`)
  - Start/Stop shift, break settings, timeline visualization.
- **Safety Announcements** (`src/components/cards/SafetyAnnouncementsCard.vue`)
  - “Now” message + next 3 items, cadence select in header, refresh queue, skip-queue control.
- **Phase Music Graph** (`src/components/cards/PhaseMusicGraphCard.vue`)
  - Clickable bar graph for phase → bed playlist mapping.
- **Background Audio** (`src/components/cards/BackgroundAudioCard.vue`)
  - Play/pause, crossfade now, bed playlist tabs.
- **System Health** (`src/components/cards/SystemHealthCard.vue`)
  - Health pills + Reset PWA cache action.

---

## Time Modes

- **Realtime**: `demoClock.realNowMin` updates every second.
- **Demo**: `demoClock.simNowMin` advances every second after shift starts.
- Toggle lives in `src/components/controls/TimeModeToggle.vue`.

---

## Announcement Scheduling

**Source of safety messages**

- Auto-generated from `/public/messages/safety/*.wav`.
- Build script: `scripts/generate-audio-manifests.mjs` generates `src/config/safetyManifest.ts`.

**Queue behavior**

- Queue continuously fills to show the next 3 items (the “Now” item is displayed separately).
- Cadence intervals:
  - Low: 20 min
  - Standard: 10 min
  - High: 5 min

---

## Announcement Delivery

**Delivery entry points** (`src/stores/announcements.ts`)

- `deliverDueOnCrossfade(nowMin)`
- `deliverDueImmediate(nowMin)`
- `deliverImmediate(id, reason)`

**Delivery mode mapping**

- `crossfade` → when bed is playing
- `scheduled` → when bed is not playing
- `immediate` → manual or emergency

**Playback**

- Uses `playSequence()` from `src/services/messageAudio.ts`.
- Safety messages play directly from `/public/messages/safety`.

---

## Shift Timeline Rules

- Defaults: start = now, break start = +3 hours, break duration = 20 min, end = +6 hours.
- Break start/end announcements use:
  - `/messages/break/break-start.wav`
  - `/messages/break/break-end.wav`
- Break periods suppress non‑emergency announcements.

---

## Bed Playlist BPM Guidance (WHS-Friendly)

### Playlist guidance table

| Mode    | BPM Range   | Primary Use in Shift                                     | Physiological Effect                                  | % of Shift (Typical)       | Guardrails                                 |
| ------- | ----------- | -------------------------------------------------------- | ----------------------------------------------------- | -------------------------- | ------------------------------------------ |
| Calm    | 55–80 BPM   | Start of shift, post-break reset, heat-sensitive periods | Lowers arousal, reduces rushing, stabilises attention | 5–15%                      | Avoid lyrics-heavy tracks, no sudden drops |
| Focus   | 80–105 BPM  | Main operational blocks (induct, picking, stowing)       | Supports steady rhythm, moderate activation           | 60–80%                     | Sweet spot: 88–98 BPM, low cognitive load  |
| Push    | 110–130 BPM | Short output drives, end-of-sort surge, CPT pressure     | Raises urgency, increases movement tempo              | 10–20% (short bursts only) | Keep <130 BPM, max 15–30 min at a time     |
| Recover | 70–90 BPM   | After Push, pre-break wind-down, late shift fatigue      | Gradual downshift, reduces irritability               | 5–15%                      | Should feel lighter, not sleepy            |

### Simple operational rules

| Rule                            | Rationale                               |
| ------------------------------- | --------------------------------------- |
| Focus is default                | Prevents overstimulation                |
| Push is time-boxed              | Avoids sustained stress elevation       |
| Always follow Push with Recover | Nervous system reset                    |
| After breaks → Calm → Focus     | Smooth re-entry                         |
| Avoid >130 BPM                  | Chaotic in noisy warehouse environments |

---

## Emergency Behavior

- Emergency fades out bed audio.
- While emergency is active, no other messages play.
- On emergency end, bed resumes only if it was playing before the emergency.

---

## PWA Notes

- Static PWA assets: `public/manifest.webmanifest`, `public/sw.js`.
- Service worker is registered in `src/main.ts`.

---

## Useful Files

- **Audio Engine**: `src/services/audioEngine.ts`
- **Announcements Store**: `src/stores/announcements.ts`
- **Shift Timeline Store**: `src/stores/shiftTimeline.ts`
- **Demo Clock**: `src/stores/demoClock.ts`
- **Safety manifest generator**: `scripts/generate-audio-manifests.mjs`

---

## Build-time Generation

Regenerate audio manifests:

```bash
npm run generate:audio
```

This updates:

- `/public/audio/*/manifest.json`
- `src/config/safetyManifest.ts`
