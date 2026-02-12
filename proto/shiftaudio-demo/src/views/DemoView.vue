<!-- src/views/DemoView.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import BrandBar from '@/components/shell/BrandBar.vue'
import TopBar from '@/components/shell/TopBar.vue'
import MainGrid from '@/components/shell/MainGrid.vue'

import SafetyAnnouncementsCard from '@/components/cards/SafetyAnnouncementsCard.vue'
import EmergencyOverrideCard from '@/components/cards/EmergencyOverrideCard.vue'
import SystemHealthCard from '@/components/cards/SystemHealthCard.vue'

import AnnouncementLogCard from '@/components/cards/AnnouncementLogCard.vue'
import BackgroundAudioCard from '@/components/cards/BackgroundAudioCard.vue'
import PhaseMusicGraphCard from '@/components/cards/PhaseMusicGraphCard.vue'
import ShiftTimelineCard from '@/components/cards/ShiftTimelineCard.vue'
import ComplianceNoticeCard from '@/components/cards/ComplianceNoticeCard.vue'
import DebugPanel from '@/components/cards/DebugPanel.vue'

import { useDemoClockStore } from '@/stores/demoClock'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import { useAnnounceParam } from '@/composables/useAnnounceParam'
import { useCrossfadeBridge } from '@/composables/useCrossfadeBridge'
import { useShiftTimelineBridge } from '@/composables/useShiftTimelineBridge'
import DemoModeBanner from '@/components/demo/DemoModeBanner.vue'

const clock = useDemoClockStore()
const ann = useAnnouncementsStore()
const shift = useShiftTimelineStore()

useAnnounceParam()
useCrossfadeBridge()
useShiftTimelineBridge()

let timer: number | undefined
let prodTimer: number | undefined

function startDemoClock() {
  if (timer) return
  if (clock.mode !== 'demo') return
  timer = window.setInterval(() => clock.tickSim(1), 1000)
}
function stopDemoClock() {
  if (!timer) return
  window.clearInterval(timer)
  timer = undefined
}
function startProdClock() {
  if (prodTimer) return
  if (clock.mode !== 'prod') return
  prodTimer = window.setInterval(() => clock.tickReal(), 1000)
}
function stopProdClock() {
  if (!prodTimer) return
  window.clearInterval(prodTimer)
  prodTimer = undefined
}

onMounted(() => {
  // demo clock ticks every second = 1 simulated minute (tune as you like)
  if (shift.started) startDemoClock()
  if (clock.mode === 'prod') startProdClock()
})

watch(
  () => shift.started,
  (started) => {
    if (started) startDemoClock()
    else stopDemoClock()
  },
)

watch(
  () => clock.mode,
  (mode) => {
    if (shift.started) shift.stopShift()
    if (mode === 'demo' && shift.started) startDemoClock()
    if (mode === 'prod') {
      stopDemoClock()
      startProdClock()
    } else {
      stopProdClock()
    }
  },
)

onUnmounted(() => {
  stopDemoClock()
  stopProdClock()
})
</script>

<template>
  <AppShell>
    <template #brandbar>
      <BrandBar />
    </template>

    <template #topbar>
      <TopBar />
    </template>

    <!-- <DemoModeBanner /> -->

    <MainGrid>
      <template #left>
        <SafetyAnnouncementsCard />
        <EmergencyOverrideCard />
        <SystemHealthCard />
        <!-- <DebugPanel /> -->
        <ComplianceNoticeCard />
      </template>

      <template #right>
        <ShiftTimelineCard />
        <BackgroundAudioCard />
        <PhaseMusicGraphCard />
        <AnnouncementLogCard />
      </template>
    </MainGrid>
  </AppShell>
</template>
