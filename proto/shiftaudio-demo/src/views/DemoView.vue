<!-- src/views/DemoView.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
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
import LaunchSlideshow from '@/components/intro/LaunchSlideshow.vue'
import GuidedWalkthrough from '@/components/intro/GuidedWalkthrough.vue'

import { useDemoClockStore } from '@/stores/demoClock'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import { useAnnounceParam } from '@/composables/useAnnounceParam'
import { useCrossfadeBridge } from '@/composables/useCrossfadeBridge'
import { useShiftTimelineBridge } from '@/composables/useShiftTimelineBridge'
import DemoModeBanner from '@/components/demo/DemoModeBanner.vue'
import type LaunchSlideshowComponent from '@/components/intro/LaunchSlideshow.vue'

const clock = useDemoClockStore()
const ann = useAnnouncementsStore()
const shift = useShiftTimelineStore()
const showGuide = ref(false)
const guideSteps = [
  {
    selector: '[data-guide="shift-timeline"]',
    title: 'Shift Timeline',
    body: 'The walkthrough starts in Demo mode so the clock is simulated. Start the shift here, adjust the timing, and see how ShiftAudio follows the operating window and break periods.',
    actionLabel: 'Try this',
    actionBody: 'Click Start Shift to begin the demo flow and activate the shift timeline.',
  },
  {
    selector: '[data-guide="announcements"]',
    title: 'Safety Announcements',
    body: 'This card shows the current message, the next messages in queue, and how routine safety communication is managed through the shift.',
    actionLabel: 'Try this',
    actionBody:
      'After starting the shift, watch the queue fill and see how the next messages are staged.',
  },
  {
    selector: '[data-guide="background-audio"]',
    title: 'Background Audio',
    body: 'Background audio can keep playing, crossfade naturally, and remain subordinate to safety and emergency messages.',
    actionLabel: 'Try this',
    actionBody:
      'Press play, then use Crossfade Now to see how routine delivery can fit around live audio.',
  },
  {
    selector: '[data-guide="phase-music"]',
    title: 'Phase Music',
    body: 'Map playlists to shift phases so the audio bed can support focus, recovery, or short push periods without fighting the workflow.',
    actionLabel: 'Try this',
    actionBody:
      'Click a different phase level to change the playlist mapping and watch the bed behavior update.',
  },
  {
    selector: '[data-guide="emergency-override"]',
    title: 'Emergency Override',
    body: 'This is the fastest path for urgent communication. In an emergency, ShiftAudio stops background audio and gives the override message immediate priority.',
    actionLabel: 'Try this',
    actionBody:
      'Trigger the emergency override to see normal audio yield immediately to urgent messaging.',
  },
  {
    selector: '[data-guide="announcement-log"]',
    title: 'Announcement Log',
    body: 'The log shows what was delivered, how it was delivered, and what happened, giving the demo a simple audit trail.',
    actionLabel: 'Look for',
    actionBody:
      'As messages play, check the log to see the delivery mode and result recorded for each event.',
    panelPosition: 'top-left',
  },
  {
    selector: '[data-guide="system-health"]',
    title: 'System Health',
    body: 'Operational signals stay visible here, along with quick controls such as replaying the intro when you want to restart the presentation.',
    actionLabel: 'Try this',
    actionBody:
      'Use Replay Intro if you want to restart the presentation, or monitor system state while the demo runs.',
  },
]

useAnnounceParam()
useCrossfadeBridge()
useShiftTimelineBridge()

let timer: number | undefined
let prodTimer: number | undefined
const launchSlideshow = ref<InstanceType<typeof LaunchSlideshowComponent> | null>(null)

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

function replayDemoView() {
  showGuide.value = false
  if (shift.started) {
    shift.stopShift()
  }
  launchSlideshow.value?.reopenSlideshow()
}

function startGuide() {
  if (clock.mode !== 'demo') {
    clock.mode = 'demo'
  }
  showGuide.value = true
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
    <LaunchSlideshow ref="launchSlideshow" @start-guide="startGuide" />
    <GuidedWalkthrough :active="showGuide" :steps="guideSteps" @close="showGuide = false" />

    <template #brandbar>
      <BrandBar />
    </template>

    <template #topbar>
      <TopBar />
    </template>

    <!-- <DemoModeBanner /> -->

    <MainGrid>
      <template #left>
        <div data-guide="announcements">
          <SafetyAnnouncementsCard />
        </div>
        <div data-guide="emergency-override">
          <EmergencyOverrideCard />
        </div>
        <div data-guide="system-health">
          <SystemHealthCard :on-replay-intro="replayDemoView" />
        </div>
        <!-- <DebugPanel /> -->
        <ComplianceNoticeCard />
      </template>

      <template #right>
        <div data-guide="shift-timeline">
          <ShiftTimelineCard />
        </div>
        <div data-guide="background-audio">
          <BackgroundAudioCard />
        </div>
        <div data-guide="phase-music">
          <PhaseMusicGraphCard />
        </div>
        <div data-guide="announcement-log">
          <AnnouncementLogCard />
        </div>
      </template>
    </MainGrid>
  </AppShell>
</template>
