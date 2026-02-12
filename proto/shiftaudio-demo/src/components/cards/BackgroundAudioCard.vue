<!-- src/components/cards/BackgroundAudioCard.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CardFrame from './CardFrame.vue'
import { storeToRefs } from 'pinia'
import { useAudioStore } from '@/stores/audio'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import type { BedPlaylist } from '@/types/domain'
import PlayIcon from '@/components/icons/PlayIcon.vue'
// import StopIcon from '@/components/icons/StopIcon.vue'
import PauseIcon from '../icons/PauseIcon.vue'
import { announceEngine } from '@/services/announceEngine'

const audio = useAudioStore()
const shift = useShiftTimelineStore()
const {
  bed,
  policy,
  masterVolume,
  outputDeviceLabel,
  lastCrossfadeTs,
  nextCrossfadeTs,
  messageHold,
  messageHoldRemainingMs,
  messageHoldWindowMs,
} = storeToRefs(audio)

const isEndingSoon = computed(() => messageHold.value || (remainingMs.value > 0 && remainingMs.value <= 5000))

function setPlaylist(playlist: BedPlaylist) {
  audio.setBedPlaylist(playlist)
  if (shift.lastPhase !== 'OFF') {
    shift.setPhaseMusic(shift.lastPhase as 'ON' | 'PRE' | 'BREAK' | 'POST' | 'END', playlist)
  }
}

function onPlay() {
  announceEngine.enableFromUserGesture()
  audio.startBed()
}

/* ---------------------------------------------------------
 * Crossfade progress line
 * -------------------------------------------------------*/
const now = ref(Date.now())
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => (now.value = Date.now()), 200)
})
onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})

const remainingMs = computed(() => {
  if (!bed.value.playing) return messageHold.value ? messageHoldRemainingMs.value : 0
  const next = nextCrossfadeTs.value || 0
  if (!next) return 0
  return Math.max(0, next - now.value)
})

const windowMs = computed(() => {
  if (!bed.value.playing) return messageHold.value ? messageHoldWindowMs.value : 0
  const start = audio.crossfadeWindowStartTs
  const next = nextCrossfadeTs.value || 0
  if (!start || !next || next <= start) return 0
  return next - start
})

const progress = computed(() => {
  if (!windowMs.value) return 0
  const done = 1 - remainingMs.value / windowMs.value
  return Math.max(0, Math.min(1, done))
})

function fmtRemaining(ms: number) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`
}
</script>

<template>
  <CardFrame title="Background Audio" subtitle="Auto-ducks on Safety and Emergency">
    <template #actions>
      <PlayIcon v-if="!bed.playing" @click="onPlay" aria-label="Play background audio" />
      <PauseIcon
        v-else-if="bed.playing"
        @click="audio.pauseBed()"
        aria-label="Pause background audio"
      />
      <PlayIcon v-else @click="audio.resumeBed()" aria-label="Resume background audio" />
    </template>

    <!-- ✅ Thin crossfade progress line -->
    <div v-if="(bed.playing && nextCrossfadeTs) || messageHold" class="xfade">
      <div class="xfade-bar" :class="{ warn: isEndingSoon }" aria-hidden="true">
        <div
          class="xfade-fill"
          :class="{ warn: isEndingSoon }"
          :style="{ width: `${progress * 100}%` }"
        ></div>
      </div>
      <div class="xfade-meta">
        <span class="muted">Next crossfade</span>
        <span class="strong">{{ fmtRemaining(remainingMs) }}</span>
      </div>
    </div>

    <div class="grid">
      <div class="row">
        <span class="k">Status</span><span class="v">{{ bed.playing ? 'Playing' : 'Idle' }}</span>
      </div>
      <div class="row"><span class="k">Priority</span><span class="v">LOW</span></div>
      <div class="row">
        <span class="k">Output</span><span class="v">{{ outputDeviceLabel }}</span>
      </div>

      <div class="row">
        <span class="k">Duck on Safety</span
        ><span class="v">{{ policy.duckOnSafety ? 'ON' : 'OFF' }}</span>
      </div>
      <div class="row">
        <span class="k">Duck on Emergency</span
        ><span class="v">{{ policy.duckOnEmergency ? 'ON' : 'OFF' }}</span>
      </div>
      <div class="row">
        <span class="k">Crossfade</span><span class="v">{{ policy.crossfadeSeconds }}s</span>
      </div>
    </div>

    <div class="controls">
      <div class="tabs">
        <button
          v-for="f in ['calm', 'focus', 'push', 'recover']"
          :key="f"
          class="tab"
          :class="{ active: bed.playlist === f }"
          type="button"
          @click="setPlaylist(f as BedPlaylist)"
        >
          {{ f }}
        </button>
      </div>

      <button class="btn btn-secondary" type="button" @click="audio.crossfadeNow()">
        Crossfade Now
      </button>

      <div class="vol">
        <div class="k">Master Volume</div>
        <div class="v">{{ Math.round(masterVolume * 100) }}%</div>
      </div>
    </div>

    <div v-if="audio.lastError" class="err">
      {{ audio.lastError }}
    </div>

    <div class="hint policy">
      Background audio is always subordinate to Safety and Emergency announcements.
    </div>
  </CardFrame>
</template>

<style scoped>
/* ✅ thin progress line */
.xfade {
  margin: 6px 0 12px;
  display: grid;
  gap: 6px;
}
.xfade-bar {
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
}
.xfade-fill {
  height: 100%;
  width: 0%;
  background: rgba(0, 0, 0, 0.55);
  transition: width 160ms linear;
}
.xfade-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.muted {
  opacity: 0.65;
  font-weight: 700;
}
.strong {
  font-weight: 900;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 12px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.k {
  font-size: 12px;
  opacity: 0.75;
}
.v {
  font-size: 12px;
  font-weight: 800;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.8);
}
.tab {
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  color: rgba(12, 18, 28, 0.75);
}
.tab:hover {
  color: rgba(12, 18, 28, 0.95);
}
.tab.active {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.95);
  color: rgba(12, 18, 28, 0.95);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}
.vol {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.hint {
  font-size: 12px;
  opacity: 0.75;
}
.policy {
  font-style: italic;
  font-size: 12px;
  opacity: 0.75;
}
.err {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: rgba(120, 20, 20, 0.92);
  font-size: 12px;
}

.xfade-bar.warn {
  background: rgba(239, 68, 68, 0.14);
}

.xfade-fill.warn {
  /* background: rgba(239, 68, 68, 0.85);
   */
  background: var(--ok);
  animation: xfadePulse 0.8s ease-in-out infinite;
}

@keyframes xfadePulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
