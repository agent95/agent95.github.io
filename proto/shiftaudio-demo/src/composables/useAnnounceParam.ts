// src/composables/useAnnounceParam.ts
import { watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useDemoClockStore } from '@/stores/demoClock'

export function useAnnounceParam() {
  const route = useRoute()
  const router = useRouter()
  const ann = useAnnouncementsStore()
  const clock = useDemoClockStore()

  watchEffect(() => {
    const v = route.query.announce
    if (v !== 'crossfade' && v !== 'immediate') return

    // demo payload: schedule a message "now"
    const nowMin = clock.nowMin

    if (v === 'immediate') {
      ann.scheduleOne('Demo Announcement (Immediate)', 'P1_SAFETY', 'immediate', nowMin)
      const next = ann.queue[ann.queue.length - 1]
      ann.deliverImmediate(next.id, 'url_param_immediate')
    } else {
      // crossfade → schedule it due now, but it will deliver on next crossfade bridge
      ann.scheduleOne('Demo Announcement (Crossfade)', 'P1_SAFETY', 'crossfade', nowMin)
    }

    // clear param after handling
    router.replace({ query: { ...route.query, announce: undefined } })
  })
}
