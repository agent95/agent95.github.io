// src/composables/useCrossfadeBridge.ts
import { watch } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { useSafetyStore } from '@/stores/safety'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useDemoClockStore } from '@/stores/demoClock'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'

export function useCrossfadeBridge() {
  const audio = useAudioStore()
  const safety = useSafetyStore()
  const ann = useAnnouncementsStore()
  const clock = useDemoClockStore()
  const shift = useShiftTimelineStore()

  // whenever crossfade starts, attempt delivery (if policy says so)
  watch(
    () => audio.lastCrossfadeTs,
    () => {
      if (!audio.bed.playing) return
      ann.deliverDueOnCrossfade(clock.nowMin)
    },
  )

  // keep queue filled; scheduled delivery only happens on crossfade
  watch(
    () => clock.nowMin,
    () => {
      if (shift.started) {
        const deliveryMode = audio.bed.playing ? 'crossfade' : 'scheduled'
        ann.ensureSafetyQueue(clock.nowMin, safety.cadence, deliveryMode)
      }
      if (!audio.bed.playing) void ann.deliverDueImmediate(clock.nowMin)
    },
  )
}
