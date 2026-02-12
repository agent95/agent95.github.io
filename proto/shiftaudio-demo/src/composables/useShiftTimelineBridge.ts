// src/composables/useShiftTimelineBridge.ts
import { watch } from 'vue'
import { useDemoClockStore } from '@/stores/demoClock'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'

export function useShiftTimelineBridge() {
  const clock = useDemoClockStore()
  const shift = useShiftTimelineStore()

  // Sync demo clock to shift start on init
  if (clock.mode === 'demo') shift.snapClockToShiftStart()

  watch(
    () => clock.nowMin,
    (nowMin) => {
      void shift.handleTick(nowMin)
    },
    { immediate: true },
  )
}
