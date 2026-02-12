<!-- src/components/cards/ShiftTimelineCard.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import CardFrame from './CardFrame.vue'
import PlayIcon from '@/components/icons/PlayIcon.vue'
import StopIcon from '@/components/icons/StopIcon.vue'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import { useDemoClockStore } from '@/stores/demoClock'
import { minToTime, useNowLabel } from '@/composables/useNowLabel'

const shift = useShiftTimelineStore()
const clock = useDemoClockStore()

const { startMin, breakStartMin, breakDurationMin, endMin, breakActive, lastPhase, phaseMusic } =
  storeToRefs(shift)

const showEdit = ref(false)

const nowLabel = computed(() => {
  void clock.realNowTick
  return useNowLabel(clock.mode, clock.nowMin)
})

function toTimeInput(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fromTimeInput(v: string): number {
  const [hh, mm] = v.split(':').map((n) => Number.parseInt(n, 10))
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0
  return Math.max(0, Math.min(24 * 60 - 1, hh * 60 + mm))
}

const startTime = computed({
  get: () => toTimeInput(startMin.value),
  set: (v: string) => shift.setStartMin(fromTimeInput(v)),
})

const breakStartTime = computed({
  get: () => toTimeInput(breakStartMin.value),
  set: (v: string) => shift.setBreakStartMin(fromTimeInput(v)),
})

const endTime = computed({
  get: () => toTimeInput(endMin.value),
  set: (v: string) => shift.setEndMin(fromTimeInput(v)),
})

const phaseLabel = computed(() => {
  if (lastPhase.value === 'PRE') return 'Pre-break'
  if (lastPhase.value === 'BREAK') return 'On break'
  if (lastPhase.value === 'POST') return 'Post-break'
  if (lastPhase.value === 'END') return 'End phase'
  if (lastPhase.value === 'ON') return 'On shift'
  return 'Off shift'
})

const breakWindow = computed(() => {
  const end = shift.breakEndMin
  return `${minToTime(breakStartMin.value)}–${minToTime(end)}`
})

const displayStartMin = computed(() => {
  const start = startMin.value
  const end = endMin.value
  const now = clock.nowMin
  if (start === end) return start
  const inShift = start < end ? now >= start && now < end : now >= start || now < end
  if (inShift) return start
  return now < start ? now : start
})

const shiftWindowMinutes = computed(() => {
  const start = displayStartMin.value
  const end = endMin.value
  return start === end ? 24 * 60 : start < end ? end - start : 24 * 60 - start + end
})

const nowOffset = computed(() => {
  const start = displayStartMin.value
  const now = clock.nowMin
  if (start === endMin.value) return 0
  if (start <= now) return now - start
  return 24 * 60 - start + now
})

const nowPct = computed(() => {
  const total = shiftWindowMinutes.value
  if (total <= 0) return 0

  const start = startMin.value
  const end = endMin.value
  const now = clock.nowMin

  // If current time is outside the shift window, pin to start or end.
  if (start !== end) {
    const inShift = start < end ? now >= start && now < end : now >= start || now < end
    if (!inShift) {
      if (start < end) return now < start ? 0 : 1
      return now < start ? 0 : 1
    }
  }

  return Math.max(0, Math.min(1, nowOffset.value / total))
})

const breakStartOffset = computed(() => {
  const start = displayStartMin.value
  const brk = breakStartMin.value
  if (start <= brk) return brk - start
  return 24 * 60 - start + brk
})

const breakStartPct = computed(() => {
  const total = shiftWindowMinutes.value
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, breakStartOffset.value / total))
})

const breakWidthPct = computed(() => {
  const total = shiftWindowMinutes.value
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, breakDurationMin.value / total))
})

const startMarkerPct = computed(() => {
  const total = shiftWindowMinutes.value
  if (total <= 0) return 0
  const start = displayStartMin.value
  const shiftStart = startMin.value
  if (start === shiftStart) return 0
  const offset =
    start <= shiftStart ? shiftStart - start : 24 * 60 - start + shiftStart
  return Math.max(0, Math.min(1, offset / total))
})
</script>

<template>
  <CardFrame title="Shift Timeline" subtitle="Configure shift window and break times">
    <template #actions>
      <button
        class="btn btn-compact"
        :class="shift.started ? 'btn-stop' : 'btn-start'"
        type="button"
        @click="shift.started ? shift.stopShift() : shift.startShift()"
      >
        <StopIcon v-if="shift.started" />
        <PlayIcon v-else />
        <span>{{ shift.started ? 'Stop Shift' : 'Start Shift' }}</span>
      </button>
    </template>
    <div class="row">
      <div class="k">Now</div>
      <div class="v">{{ nowLabel }}</div>
    </div>

    <div class="summary">
      <div class="row">
        <span class="k">Phase</span><span class="v">{{ phaseLabel }}</span>
      </div>
      <div class="row">
        <span class="k">Shift Start</span><span class="v">{{ minToTime(startMin) }}</span>
      </div>
      <div class="row">
        <span class="k">Break Window</span><span class="v">{{ breakWindow }}</span>
      </div>
      <div class="row">
        <span class="k">Shift End</span><span class="v">{{ minToTime(endMin) }}</span>
      </div>
    </div>

    <div class="timeline">
      <div class="timeline-wrap">
        <div class="timeline-track">
          <div
            class="timeline-pre"
            :style="{ width: `${startMarkerPct * 100}%` }"
          ></div>
          <div
            class="timeline-break"
            :style="{ left: `${breakStartPct * 100}%`, width: `${breakWidthPct * 100}%` }"
          ></div>
          <div class="timeline-now" :style="{ left: `${nowPct * 100}%` }">
            <span class="now-line"></span>
          </div>
        </div>
        <div class="now-arrow" :style="{ left: `${nowPct * 100}%` }"></div>
        <div class="now-label" :style="{ left: `${nowPct * 100}%` }">
          <span>{{ nowLabel }}</span>
        </div>
      </div>
      <div class="timeline-meta">
        <span class="k">{{ minToTime(displayStartMin) }}</span>
        <span class="k">{{ minToTime(endMin) }}</span>
      </div>
    </div>

    <div class="actions">
      <button class="btn edit-btn" type="button" @click="showEdit = !showEdit">
        {{ showEdit ? 'Hide Config' : 'Edit Shift Times' }}
      </button>
    </div>

    <div v-if="showEdit" class="grid">
      <label class="lbl">
        Shift Start
        <input class="input" type="time" v-model="startTime" step="60" />
      </label>

      <label class="lbl">
        Break Start
        <input class="input" type="time" v-model="breakStartTime" step="60" />
      </label>

      <label class="lbl">
        Break Duration (min)
        <input
          class="input"
          type="number"
          min="5"
          max="180"
          step="5"
          v-model.number="breakDurationMin"
        />
      </label>

      <label class="lbl">
        Shift End
        <input class="input" type="time" v-model="endTime" step="60" />
      </label>
    </div>

    <div class="note mt-5">
      No announcements play during breaks. Pre-break music:
      {{ phaseMusic.PRE }}. Post-break music: {{ phaseMusic.POST }}.
    </div>
  </CardFrame>
</template>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 6px 0;
}
.k {
  font-size: 12px;
  opacity: 0.75;
}
.v {
  font-weight: 800;
  font-size: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 8px 0 10px;
}
.lbl {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
.input {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
  font-size: 12px;
}
.summary {
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.18);
  padding: 10px 12px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.72);
}
.note {
  font-size: 12px;
  opacity: 0.7;
  font-style: italic;
}
.timeline {
  margin: 6px 0 10px;
}
.timeline-wrap {
  position: relative;
}
.timeline-track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: visible;
}
.timeline-break {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(245, 158, 11, 0.55);
}
.timeline-pre {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(239, 68, 68, 0.5);
}
.timeline-now {
  position: absolute;
  top: -1px;
  width: 0;
  height: 10px;
}
.now-line {
  position: absolute;
  top: -6px;
  width: 3px;
  height: 20px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.95);
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}
.now-label {
  position: absolute;
  top: 14px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.92);
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  z-index: 10;
}
.now-arrow {
  position: absolute;
  top: 9px;
  width: 0;
  height: 0;
  transform: translateX(-50%) translateX(1px);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(0, 0, 0, 0.92);
}
.timeline-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}
.hidden {
  visibility: hidden;
}
.edit-btn {
  width: 100%;
  margin: 6px 0 10px;
}
.actions {
  display: grid;
  gap: 8px;
  margin: 6px 0 10px;
}
.actions .btn {
  width: 100%;
}
.btn-compact {
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-compact svg {
  width: 14px;
  height: 14px;
}
.btn-start {
  border-color: rgba(22, 163, 74, 0.5);
  background: rgba(22, 163, 74, 0.12);
  color: rgba(22, 101, 52, 0.95);
}
.btn-stop {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.12);
  color: rgba(153, 27, 27, 0.95);
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
