<!-- src/components/cards/PhaseMusicGraphCard.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import CardFrame from './CardFrame.vue'
import { storeToRefs } from 'pinia'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import { useAudioStore } from '@/stores/audio'
import type { BedPlaylist } from '@/types/domain'

const shift = useShiftTimelineStore()
const { phaseMusic, lastPhase } = storeToRefs(shift)
const audio = useAudioStore()
const { bed } = storeToRefs(audio)

const playlists: BedPlaylist[] = ['calm', 'focus', 'recover', 'push']
const displayPlaylists = [...playlists].reverse()
const phases = ['ON', 'PRE', 'BREAK', 'POST', 'END'] as const
const phaseLabels = ['Start', 'Pre', 'Break', 'Post', 'End']

const svgRef = ref<SVGSVGElement | null>(null)
const showGuidance = ref(false)

const padX = 6
const padY = 16
const graphHeight = 140
const padYPx = computed(() => (padY / 100) * graphHeight)
const graphTopOffset = 12
const pointData = computed(() => {
  return phases.map((phase, idx) => {
    const playlist = phaseMusic.value[phase]
    const yIndex = Math.max(0, displayPlaylists.indexOf(playlist as BedPlaylist))
    const xPct = idx / (phases.length - 1)
    return { phase, label: phaseLabels[idx] ?? phase, yIndex, xPct, idx }
  })
})

const currentColumn = computed(() => {
  const spanX = 100 - padX * 2
  const colW = spanX / phases.length
  const idx = phases.findIndex((p) => p === lastPhase.value)
  if (idx < 0) return null
  return { x: padX + idx * colW, w: colW }
})

const barData = computed(() => {
  const spanX = 100 - padX * 2
  const spanY = 100 - padY * 2
  const spacing = spanY / (displayPlaylists.length - 1)
  const segH = Math.min(10, spacing * 0.6)
  const colW = spanX / phases.length
  const barW = Math.min(14, colW * 0.55)

  return pointData.value.map((p) => {
    const x = padX + p.idx * colW + colW / 2 - barW / 2
    const segments = displayPlaylists.map((_, level) => ({
      level,
      x,
      y: padY + level * spacing - segH / 2,
      w: barW,
      h: segH,
      active: level >= p.yIndex,
    }))
    return { phase: p.phase, segments, hitX: padX + p.idx * colW, hitW: colW }
  })
})

const yLabelData = computed(() => {
  const spanY = 100 - padY * 2
  return displayPlaylists.map((label, i) => ({
    label,
    yPct: padY + (i / (displayPlaylists.length - 1)) * spanY,
  }))
})

function yIndexFromClientY(clientY: number) {
  const el = svgRef.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const yPct = ((clientY - rect.top) / rect.height) * 100
  const clamped = Math.max(padY, Math.min(100 - padY, yPct))
  const rel = (clamped - padY) / (100 - padY * 2)
  const idx = Math.round(rel * (displayPlaylists.length - 1))
  return Math.max(0, Math.min(displayPlaylists.length - 1, idx))
}

function onPointerDown(phase: (typeof phases)[number], e: PointerEvent) {
  const idx = yIndexFromClientY(e.clientY)
  const playlist = displayPlaylists[idx]
  if (!playlist) return
  shift.setPhaseMusic(phase, playlist)
}

function onSegmentClick(phase: (typeof phases)[number], level: number) {
  const playlist = displayPlaylists[level]
  if (!playlist) return
  shift.setPhaseMusic(phase, playlist)
}
</script>

<template>
  <CardFrame title="Phase Music" subtitle="Click points to select bed playlists per phase">
    <template #actions>
      <div class="actions" @mouseenter="showGuidance = true" @mouseleave="showGuidance = false">
        <button class="info" type="button" aria-label="Show playlist guidance">i</button>
        <button class="reset" type="button" @click="shift.resetPhaseMusic()">Reset</button>
      </div>
    </template>
    <div
      class="wrap"
      :style="{
        '--graph-h': `${graphHeight}px`,
        '--pad-y': `${padYPx}px`,
        '--pad-x': `${padX}%`,
      }"
    >
      <svg ref="svgRef" class="graph" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- horizontal bands / labels -->
        <g>
          <line
            v-for="(f, i) in displayPlaylists"
            :key="f"
            class="grid"
            :x1="padX"
            :x2="100 - padX"
            :y1="padY + (i / (displayPlaylists.length - 1)) * (100 - padY * 2)"
            :y2="padY + (i / (displayPlaylists.length - 1)) * (100 - padY * 2)"
          />
        </g>

        <!-- bar stacks -->
        <g v-for="bar in barData" :key="bar.phase">
          <rect
            v-for="seg in bar.segments"
            :key="`${bar.phase}-${seg.level}`"
            class="seg"
            :class="{
              active: seg.active,
              current: bed.playlist === displayPlaylists[seg.level] && bar.phase === lastPhase,
            }"
            :x="seg.x"
            :y="seg.y"
            :width="seg.w"
            :height="seg.h"
            rx="2.2"
            @pointerdown="onSegmentClick(bar.phase, seg.level)"
          />
          <rect
            class="bar-hit"
            :x="bar.hitX"
            :y="padY"
            :width="bar.hitW"
            :height="100 - padY * 2"
            @pointerdown="onPointerDown(bar.phase, $event)"
          />
        </g>
      </svg>

      <div class="xlabels">
        <span
          v-for="p in pointData"
          :key="p.phase"
          class="xl"
          :class="{ active: p.phase === lastPhase }"
        >
          {{ p.label }}
        </span>
      </div>

      <div class="ylabels" :style="{ '--graph-top': `${graphTopOffset}px` }">
        <span
          v-for="f in yLabelData"
          :key="f.label"
          class="yl"
          :class="{ active: bed.playlist === f.label && lastPhase !== 'OFF' }"
          :style="{ top: `calc(var(--graph-top) + ${f.yPct} * var(--graph-h) / 100)` }"
        >
          {{ f.label }}
        </span>
      </div>

      <div v-if="showGuidance" class="guidance" role="dialog" aria-label="Playlist guidance">
        <div class="g-hdr">Playlist guidance</div>
        <div class="g-table">
          <div class="g-head">Playlist</div>
          <div class="g-head">Psychological effect</div>

          <div class="g-row">
            <span class="g-name">Calm</span>
            <span class="g-meta">Lowers arousal, stabilises attention</span>
          </div>
          <div class="g-row">
            <span class="g-name">Focus</span>
            <span class="g-meta">Steady rhythm, moderate activation</span>
          </div>
          <div class="g-row">
            <span class="g-name">Push</span>
            <span class="g-meta">Raises urgency, increases tempo</span>
          </div>
          <div class="g-row">
            <span class="g-name">Recover</span>
            <span class="g-meta">Gradual downshift, reduces irritability</span>
          </div>
        </div>
      </div>
    </div>
  </CardFrame>
</template>

<style scoped>
.wrap {
  position: relative;
  padding: 12px 12px 24px;
}
.actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.info {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.9);
  color: rgba(15, 23, 42, 0.75);
  font-weight: 900;
  font-size: 12px;
  line-height: 1;
}
.info:hover {
  background: rgba(255, 255, 255, 1);
}
.graph {
  width: 100%;
  height: var(--graph-h);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
}
.grid {
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 0.8;
}
.seg {
  fill: rgba(15, 23, 42, 0.12);
}
.seg.active {
  fill: rgba(12, 18, 28, 0.62);
}
.seg.current {
  fill: rgba(217, 119, 6, 0.85);
}
.bar-hit {
  fill: transparent;
  cursor: pointer;
}
.reset {
  padding: 6px 10px;
  border: 0;
  background: rgba(15, 23, 42, 0.08);
  color: rgba(12, 18, 28, 0.8);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.reset:hover {
  background: rgba(15, 23, 42, 0.14);
}
.xlabels {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 0 var(--pad-x);
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(12, 18, 28, 0.75);
}
.xl {
  text-align: center;
}
.xl.active {
  color: rgba(217, 119, 6, 0.95);
}
.ylabels {
  position: absolute;
  left: 12px;
  top: 0;
  height: 100%;
  padding-right: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.95) 65%,
    rgba(255, 255, 255, 0) 100%
  );
  z-index: 2;
  font-size: 11px;
  font-weight: 700;
  color: rgba(12, 18, 28, 0.6);
  pointer-events: none;
}
.yl {
  position: absolute;
  transform: translateY(-50%);
}
.yl.active {
  color: rgba(217, 119, 6, 0.95);
}
.guidance {
  position: absolute;
  right: 12px;
  top: 8px;
  width: 260px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  font-size: 11px;
  z-index: 3;
}
.g-hdr {
  font-weight: 900;
  font-size: 12px;
  margin-bottom: 8px;
}
.g-table {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 6px 10px;
}
.g-head {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(12, 18, 28, 0.55);
  margin-bottom: 2px;
}
.g-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 6px;
  align-items: center;
}
.g-name {
  font-weight: 800;
}
.g-meta {
  color: rgba(12, 18, 28, 0.7);
}
</style>
