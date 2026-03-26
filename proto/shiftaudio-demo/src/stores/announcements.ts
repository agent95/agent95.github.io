// src/stores/announcements.ts
import { defineStore } from 'pinia'
import type { Announcement, Priority, DeliveryMode, Cadence } from '@/types/domain'
import { useSystemStore } from '@/stores/system'
import { useLogStore } from '@/stores/log'
import { useAudioStore } from '@/stores/audio'
import { useShiftTimelineStore } from '@/stores/shiftTimeline'
import { useSafetyStore } from '@/stores/safety'
import { useDemoClockStore } from '@/stores/demoClock'
import { playSequence } from '@/services/messageAudio'
import { announcementIdToKey, messageLibrary } from '@/config/messageLibrary'
import { safetyManifest } from '@/config/safetyManifest'

function isoNow(): string {
  return new Date().toISOString()
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isDue(scheduledAtMin: number, nowMin: number): boolean {
  return scheduledAtMin <= nowMin
}

function cadenceIntervalMin(cadence: Cadence): number {
  if (cadence === 'low') return 20
  if (cadence === 'high') return 5
  return 10
}

function addMin(base: number, delta: number): number {
  return (base + delta + 24 * 60) % (24 * 60)
}

type DeliveryResult = 'DELIVERED' | 'SKIPPED' | 'FAILED'
type AnnouncementSpec = {
  toneUrl?: string
  audioUrl?: string
  followUpUrl?: string
  volume?: number
  duckLevel?: number
}

function getAnnouncementSpec(ann: Announcement): AnnouncementSpec | null {
  const key = announcementIdToKey[ann.id]
  const safetyFile =
    !key && ann.id.startsWith('safety:') ? ann.id.replace('safety:', '') : null
  if (key) return messageLibrary[key] as AnnouncementSpec
  if (!safetyFile) return null
  return {
    key: 'safety_tip',
    label: ann.name,
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: `/messages/safety/${safetyFile}`,
    volume: 1,
    duckLevel: 0.25,
  } as AnnouncementSpec
}

export const useAnnouncementsStore = defineStore('announcements', {
  state: () => ({
    queue: [] as Announcement[],
    activeDeliveries: 0,
    loading: false,
    loadingProgress: 0,
    emergency: {
      active: false,
      lastTriggeredAtIso: '',
      lastEndedAtIso: '',
    },
    safety: {
      lastDeliveredAtIso: '',
      lastDeliveredName: '',
    },
  }),

  getters: {
    next(state): Announcement | null {
      return state.queue.length > 0 ? state.queue[0]! : null
    },
  },

  actions: {
    _getStores() {
      return {
        sys: useSystemStore(),
        log: useLogStore(),
        audio: useAudioStore(),
        shift: useShiftTimelineStore(),
      }
    },

    _logDelivery(
      ann: Announcement,
      deliveryMode: DeliveryMode,
      result: DeliveryResult,
      reason: string,
    ) {
      const { sys, log } = this._getStores()
      log.append({
        tsIso: isoNow(),
        siteId: sys.site.id,
        zoneId: sys.zoneId,
        message: ann.name,
        priority: ann.priority,
        deliveryMode,
        result,
        reason,
      })
    },

    async _performDelivery(
      ann: Announcement,
      deliveryMode: DeliveryMode,
      opts: { bedBehavior?: 'pause' | 'duck' | 'none' } = {},
    ) {
      const { audio } = this._getStores()

      this.activeDeliveries++
      const spec = getAnnouncementSpec(ann)

      const isEmergency = ann.priority === 'P0_EMERGENCY'
      const isSafety = ann.priority === 'P1_SAFETY'
      const safetyPolicy = { volumeBoost: 1, speechRate: 1, duckBed: true }
      const volumeBoost = isSafety ? safetyPolicy.volumeBoost : 1
      const speechRate = isSafety ? safetyPolicy.speechRate : 1

      // ✅ Only duck for NON-emergency. Emergency owns the bed separately.
      const shouldManageBed =
        !isEmergency &&
        isSafety &&
        safetyPolicy.duckBed &&
        audio.policy.duckOnSafety &&
        audio.bed.playing
      const bedBehavior = opts.bedBehavior ?? 'pause'
      const restore =
        shouldManageBed && bedBehavior === 'pause'
          ? await audio.pauseBedForMessage()
          : shouldManageBed && bedBehavior === 'duck'
            ? audio.duckBedWithFade(spec?.duckLevel ?? 0.25, 320)
            : null

      // ✅ Tone rules:
      // - Emergency: allow attention tone if configured (e.g. alarm sequence)
      // - Crossfade: include attention tone (if defined)
      // - Immediate: no attention tone (prevents “attention twice”)
      const shouldPlayAttentionTone = isEmergency || deliveryMode === 'crossfade'

      try {
        await playSequence({
          toneUrl: shouldPlayAttentionTone ? spec?.toneUrl : undefined,
          audioUrl: spec?.audioUrl ?? '/messages/speech.wav',
          followUpUrl: spec?.followUpUrl,
          audioVolume: clamp01((spec?.volume ?? 1) * volumeBoost),
          audioRate: speechRate,
        })

        // ✅ Update safety “Last delivered”
        if (ann.priority === 'P1_SAFETY') {
          this.safety.lastDeliveredAtIso = isoNow()
          this.safety.lastDeliveredName = ann.name
        }

        // ✅ Bed returns immediately after message (for non-emergency)
        if (restore) {
          if (bedBehavior === 'duck') await sleep(1000)
          await restore()
        }
      } catch (e: any) {
        if (restore) {
          if (bedBehavior === 'duck') await sleep(1000)
          await restore()
        }

        this._logDelivery(ann, deliveryMode, 'FAILED', e?.message ?? 'message_sequence_failed')
      } finally {
        this.activeDeliveries = Math.max(0, this.activeDeliveries - 1)
      }
    },

    scheduleOne(
      name: string,
      priority: Priority,
      deliveryMode: DeliveryMode,
      scheduledAtMin: number,
    ) {
      this.queue.push({
        id: crypto.randomUUID(),
        name,
        priority,
        deliveryMode,
        scheduledAtMin,
        state: 'QUEUED',
      })
      this.sortQueue()
    },

    sortQueue() {
      this.queue.sort((a, b) => a.scheduledAtMin - b.scheduledAtMin)
    },

    ensureSafetyQueue(nowMin: number, cadence: Cadence, deliveryMode: DeliveryMode) {
      const { shift } = this._getStores()
      if (this.loading) return
      const safetyIds = safetyManifest.map((item) => ({
        id: `safety:${item.file}`,
        name: item.label,
      }))

      const desired = 3
      if (!safetyIds.length) return
      if (this.queue.length >= desired) return

      const interval = cadenceIntervalMin(cadence)
      let nextAt =
        (this as any)._nextSafetyAtMin != null
          ? (this as any)._nextSafetyAtMin
          : addMin(shift.startMin, interval)

      let idx = (this as any)._safetyIdx ?? 0
      while (nextAt <= nowMin) {
        nextAt = addMin(nextAt, interval)
        idx++
      }
      let scheduledAt = nextAt

      while (this.queue.length < desired) {
        const item = safetyIds[idx % safetyIds.length]
        if (!item) break
        this.queue.push({
          id: item.id,
          name: item.name,
          priority: 'P1_SAFETY',
          deliveryMode,
          scheduledAtMin: scheduledAt,
          state: 'QUEUED',
        })
        idx++
        scheduledAt = (scheduledAt + interval) % (24 * 60)
      }

      ;(this as any)._safetyIdx = idx
      ;(this as any)._nextSafetyAtMin = scheduledAt
      this.sortQueue()
    },

    skipQueue(id: string, nowMin: number) {
      const idx = this.queue.findIndex((a) => a.id === id)
      if (idx < 0) return

      const ann = this.queue[idx]
      if (!ann) return

      ann.scheduledAtMin = (nowMin + 1) % (24 * 60)
      ann.state = 'QUEUED'
      this.sortQueue()
    },

    // Backward-compatible alias (older UI calls)
    jumpToNext(id: string, nowMin: number) {
      this.skipQueue(id, nowMin)
    },

    _canDeliver(ann: Announcement, deliveryMode: DeliveryMode, allowDuringBreak = false): boolean {
      if (this.emergency.active) return false
      if (this._shouldBlockMotivation(ann, deliveryMode)) return false
      if (this._shouldHoldForBreak(ann, allowDuringBreak)) return false
      return true
    },

    async deliverImmediate(
      id: string,
      reason = 'manual_announce_now',
      opts: { allowDuringBreak?: boolean } = {},
    ) {
      const ann = this.queue.find((a) => a.id === id)
      if (!ann) return
      if (!this._canDeliver(ann, 'immediate', opts.allowDuringBreak)) return

      ann.state = 'DELIVERING'
      ann.state = 'DELIVERED'

      this._logDelivery(ann, 'immediate', 'DELIVERED', reason)
      const bedBehavior = reason === 'manual_announce_now' ? 'duck' : undefined
      await this._performDelivery(ann, 'immediate', { bedBehavior })

      this.queue = this.queue.filter((a) => a.id !== id)
    },

    async deliverDueOnCrossfade(nowMin: number) {
      if (this.activeDeliveries > 0) return
      const next = this.queue[0]
      if (!next) return
      if (!isDue(next.scheduledAtMin, nowMin)) return
      if (!this._canDeliver(next, 'crossfade')) return

      next.state = 'DELIVERING'
      next.state = 'DELIVERED'

      this._logDelivery(next, 'crossfade', 'DELIVERED', 'delivered_on_crossfade')
      await this._performDelivery(next, 'crossfade')

      this.queue.shift()
    },

    async deliverDueImmediate(nowMin: number) {
      if (this.activeDeliveries > 0) return
      const next = this.queue[0]
      if (!next) return
      if (next.scheduledAtMin > nowMin) return
      if (!this._canDeliver(next, 'immediate')) return

      if (next.scheduledAtMin < nowMin) {
        next.state = 'SKIPPED'
        this._logDelivery(next, 'scheduled', 'SKIPPED', 'missed_scheduled_time')
        this.queue.shift()
        return
      }

      next.state = 'DELIVERING'
      next.state = 'DELIVERED'

      this._logDelivery(next, 'scheduled', 'DELIVERED', 'delivered_when_due')
      await this._performDelivery(next, 'scheduled')

      this.queue.shift()
    },

    /* ---------------------------------------------------------
     * Emergency override (P0)
     * -------------------------------------------------------*/
    async triggerEmergency(message = 'Emergency Stop') {
      const { audio } = this._getStores()

      // Mark emergency active
      this.emergency.active = true
      this.emergency.lastTriggeredAtIso = isoNow()

      // ✅ Emergency behaviour: fade out + pause bed (do NOT duckBed here)
      await audio.emergencyPauseBed(250)

      const emergencyAnn: Announcement = {
        id: 'emergency',
        name: message,
        priority: 'P0_EMERGENCY',
        deliveryMode: 'immediate',
        scheduledAtMin: 0,
        state: 'DELIVERED',
      }

      this._logDelivery(emergencyAnn, 'immediate', 'DELIVERED', 'emergency_override')

      // 🔊 Play emergency sequence twice
      await this._performDelivery(emergencyAnn, 'immediate')
      await this._performDelivery(emergencyAnn, 'immediate')
    },

    async endEmergency() {
      if (!this.emergency.active) return

      const { audio, log, sys } = this._getStores()

      this.emergency.active = false
      this.emergency.lastEndedAtIso = isoNow()

      // ✅ Resume only if bed was playing before emergency
      await audio.resumeBed(180)

      log.append({
        tsIso: isoNow(),
        siteId: sys.site.id,
        zoneId: sys.zoneId,
        message: 'Music resumed after emergency',
        priority: 'P0_EMERGENCY',
        deliveryMode: 'immediate',
        result: 'DELIVERED',
        reason: 'bed_hard_restart_on_end_emergency',
      })
    },

    skip(id: string, reason = 'skipped_by_policy') {
      const ann = this.queue.find((a) => a.id === id)
      if (!ann) return

      ann.state = 'SKIPPED'
      this._logDelivery(ann, ann.deliveryMode, 'SKIPPED', reason)
      this.queue = this.queue.filter((a) => a.id !== id)
    },

    _shouldBlockMotivation(_ann: Announcement, _deliveryMode: DeliveryMode): boolean {
      return false
    },

    _shouldHoldForBreak(ann: Announcement, allowDuringBreak = false): boolean {
      if (ann.priority === 'P0_EMERGENCY') return false

      const { shift } = this._getStores()
      if (!shift.breakActive) return false
      if (allowDuringBreak) return false

      return true
    },

    clearAll() {
      this.queue = []
      ;(this as any)._safetyIdx = 0
      ;(this as any)._nextSafetyAtMin = undefined
    },

    startLoading(durationMs = 3000) {
      this.loading = true
      this.loadingProgress = 0

      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        this.loadingProgress = Math.min(1, elapsed / durationMs)
        if (elapsed >= durationMs) {
          this.loading = false
          this.loadingProgress = 0
          const safety = useSafetyStore()
          const clock = useDemoClockStore()
          const audio = useAudioStore()
          const deliveryMode = audio.bed.playing ? 'crossfade' : 'scheduled'
          this.ensureSafetyQueue(clock.nowMin, safety.cadence, deliveryMode)
          return
        }
        setTimeout(tick, 120)
      }
      tick()
    },
  },
})
