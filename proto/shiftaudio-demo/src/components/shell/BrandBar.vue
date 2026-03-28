<!-- src/components/shell/BrandBar.vue -->
<script setup lang="ts">
import TimeModeToggle from '@/components/controls/TimeModeToggle.vue'
import ClockBadge from '@/components/status/ClockBadge.vue'
import { storeToRefs } from 'pinia'
import { useAudioStore } from '@/stores/audio'
import { useDemoClockStore } from '@/stores/demoClock'

const audio = useAudioStore()
const clock = useDemoClockStore()
const { bed } = storeToRefs(audio)
const { mode } = storeToRefs(clock)

const idleSvg = '/assets/svg/logo.svg'
const playingSvg = '/assets/svg/animated.svg'

</script>

<template>
  <div class="bar" data-guide-scope>
    <div class="brand">
      <img class="logo" :src="bed.playing ? playingSvg : idleSvg" alt="ShiftAudio" />
      <div class="text">
        <div class="name">ShiftAudio</div>
        <div class="tagline">Safety First</div>
      </div>
    </div>

    <div class="right">
      <ClockBadge :mode="mode" />
      <div data-guide="time-mode">
        <TimeModeToggle v-model="mode" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  width: 50px;
}
.name {
  font-weight: 800;
  line-height: 1;
}
.tagline {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
