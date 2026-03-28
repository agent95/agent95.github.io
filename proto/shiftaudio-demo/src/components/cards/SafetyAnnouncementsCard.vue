<!-- src/components/cards/SafetyAnnouncementsCard.vue (UPDATED to include queue mini list) -->
<script setup lang="ts">
import CardFrame from './CardFrame.vue'
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useAudioStore } from '@/stores/audio'
import { useDemoClockStore } from '@/stores/demoClock'
import { minToTime, useNowLabel } from '@/composables/useNowLabel'
import { ref } from 'vue'
import CadenceSelect from '@/components/controls/CadenceSelect.vue'
import { useSafetyStore } from '@/stores/safety'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'

const annStore = useAnnouncementsStore()
const audio = useAudioStore()
const clock = useDemoClockStore()
const safety = useSafetyStore()
const shift = useShiftTimelineStore()
const { next, queue, loading, loadingProgress } = storeToRefs(annStore)
const { cadence } = storeToRefs(safety)

const nowLabel = computed(() => {
  void clock.realNowTick
  return useNowLabel(clock.mode, clock.nowMin)
})

const queuePreview = computed(() => queue.value.slice(1, 4))

const deliveryLabel = computed(() => {
  if (!next.value) return '—'
  if (next.value.deliveryMode === 'immediate') return 'immediate'
  return audio.bed.playing ? 'crossfade' : 'scheduled'
})

function scheduledLabel(min: number) {
  return minToTime(min)
}

function countdownLabel(targetMin: number) {
  if (loading.value || !shift.started) return 'Pending'

  const nowMin = clock.nowMin
  const rawDiff = targetMin - nowMin

  if (rawDiff <= 0) {
    return 'Due now'
  }

  const diff = (targetMin - nowMin + 24 * 60) % (24 * 60)

  if (diff === 0) return 'Due now'
  if (diff < 60) return `In ${diff}m`

  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return mins === 0 ? `In ${hours}h` : `In ${hours}h ${mins}m`
}

const uiError = ref('')

watch(
  () => cadence.value,
  () => {
    annStore.clearAll()
    annStore.startLoading()
  },
)

async function onDeliver(id: string) {
  uiError.value = ''
  try {
    await annStore.deliverImmediate(id)
  } catch (e: any) {
    uiError.value = e?.message ?? String(e)
  }
}
</script>

<template>
  <CardFrame title="Safety Announcements" subtitle="Deterministic delivery with priority rules">
    <template #actions>
      <CadenceSelect v-model="cadence" />
    </template>
    <div class="row">
      <div class="k">Now</div>
      <div class="v">{{ nowLabel }}</div>
    </div>

    <div v-if="loading" class="panel hero loading">
      <div class="hero-title">Loading schedule…</div>
      <div class="bar">
        <div class="fill" :style="{ width: `${Math.round(loadingProgress * 100)}%` }"></div>
      </div>
    </div>

    <div v-else-if="next" class="panel hero">
      <div class="hero-title">{{ next.name }}</div>

      <div class="hero-meta">
        <div>
          <span class="k">Priority</span><span class="v">{{ next.priority }}</span>
        </div>
        <div>
          <span class="k">Delivery</span><span class="v">{{ deliveryLabel }}</span>
        </div>
        <div>
          <span class="k">Scheduled</span
          ><span class="v">{{ scheduledLabel(next.scheduledAtMin) }}</span>
        </div>
        <div>
          <span class="k">Countdown</span>
          <span class="v" :class="{ due: countdownLabel(next.scheduledAtMin) === 'Due now' }">
            {{ countdownLabel(next.scheduledAtMin) }}
          </span>
        </div>
      </div>

      <button class="btn btn-secondary" @click="onDeliver(next.id)">Deliver Immediately</button>
      <div v-if="uiError" class="err">{{ uiError }}</div>
    </div>

    <div class="queue">
      <div class="qtbar">
        <div class="qt">Queue</div>
        <!-- <button class="qrefresh" @click="annStore.clearAll(); annStore.startLoading()">
          Refresh
        </button> -->
      </div>
      <div v-if="queuePreview.length" class="qlist">
        <div v-for="a in queuePreview" :key="a.id" class="qrow">
          <div class="qtop">
            <div class="qn">{{ a.name }}</div>
            <button class="qbtn" @click="annStore.skipQueue(a.id, clock.nowMin)">
              Skip Queue
            </button>
          </div>
          <div class="qm">
            <span :class="{ due: countdownLabel(a.scheduledAtMin) === 'Due now' }">
              {{ countdownLabel(a.scheduledAtMin) }}
            </span>
            • {{ scheduledLabel(a.scheduledAtMin) }} • {{ a.priority }}
          </div>
        </div>
      </div>
      <div v-else class="muted">
        <span v-if="!shift.started" class="notice">Shift not started. Click Start Shift.</span>
        <span v-else>No queued announcements.</span>
      </div>
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
  margin-right: 10px;
}
.v {
  font-weight: 800;
  font-size: 12px;
}
:deep(.due),
.due {
  color: var(--ok);
}
.panel {
  margin-top: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.18);
}
.hero {
  min-height: 142px;
}
.btn {
  margin-top: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: white;
  cursor: pointer;
  font-weight: 800;
}
.queue {
  margin-top: 12px;
  min-height: 180px;
}
.qtbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.qlist {
  display: grid;
  gap: 6px;
  grid-auto-rows: minmax(48px, auto);
  min-height: 156px;
}
.qt {
  font-weight: 800;
  font-size: 12px;
}
.qrefresh {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 2px 4px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(12, 18, 28, 0.8);
}
.qrefresh:hover {
  color: rgba(12, 18, 28, 1);
}
.qrow {
  min-height: 48px;
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.6);
}
.qtop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.qn {
  font-weight: 800;
  font-size: 12px;
  line-height: 1.2;
}
.qbtn {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.qbtn:hover {
  border-color: rgba(0, 0, 0, 0.3);
}
.qm {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 1px;
}
.muted {
  min-height: 156px;
  display: flex;
  align-items: center;
  opacity: 0.7;
  font-size: 13px;
}
.notice {
  display: inline-block;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  font-weight: 700;
}
.hero {
  border-style: solid;
  background: rgba(255, 255, 255, 0.85);
}

.hero-title {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.loading .bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-top: 6px;
}
.loading .fill {
  height: 100%;
  width: 0%;
  background: rgba(0, 0, 0, 0.6);
  transition: width 120ms linear;
}

.hero-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin-bottom: 10px;
}
</style>
