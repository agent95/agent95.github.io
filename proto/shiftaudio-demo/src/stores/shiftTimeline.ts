// src/stores/shiftTimeline.ts
import { defineStore } from 'pinia'
import { useAudioStore } from '@/stores/audio'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useDemoClockStore } from '@/stores/demoClock'
import type { BedPlaylist } from '@/types/domain'

const defaultPhaseMusic: Record<'ON' | 'PRE' | 'BREAK' | 'POST' | 'END', BedPlaylist> = {
  ON: 'focus',
  PRE: 'calm',
  BREAK: 'calm',
  POST: 'recover',
  END: 'push',
}

function clampMin(v: number) {
  return Math.max(0, Math.min(24 * 60 - 1, v))
}

function isBetween(now: number, start: number, end: number): boolean {
  if (start === end) return true
  if (start < end) return now >= start && now < end
  return now >= start || now < end
}

function addMin(base: number, delta: number): number {
  return (base + delta + 24 * 60) % (24 * 60)
}

function nowMinReal(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export const useShiftTimelineStore = defineStore('shiftTimeline', {
  state: () => ({
    startMin: nowMinReal(),
    breakStartMin: addMin(nowMinReal(), 180), // +3h
    breakDurationMin: 20,
    endMin: addMin(nowMinReal(), 360), // +6h
    _nowMin: nowMinReal(),
    breakActive: false,
    lastPhase: 'OFF' as 'PRE' | 'BREAK' | 'POST' | 'END' | 'ON' | 'OFF',
    started: false,
    phaseMusic: { ...defaultPhaseMusic },
  }),
  getters: {
    breakEndMin(state): number {
      return (state.breakStartMin + state.breakDurationMin) % (24 * 60)
    },
    isInShift(state): boolean {
      return isBetween(state._nowMin, state.startMin, state.endMin)
    },
  },
  actions: {
    setStartMin(v: number) {
      this.startMin = clampMin(v)
      this.snapClockToShiftStart()
    },
    setBreakStartMin(v: number) {
      this.breakStartMin = clampMin(v)
    },
    setBreakDurationMin(v: number) {
      this.breakDurationMin = Math.max(5, Math.min(180, v))
    },
    setEndMin(v: number) {
      this.endMin = clampMin(v)
    },
    snapClockToShiftStart() {
      const clock = useDemoClockStore()
      if (clock.mode !== 'demo') return
      clock.setSimNowMin(this.startMin)
    },
    startShift() {
      this.started = true
      this.snapClockToShiftStart()
      const ann = useAnnouncementsStore()
      ann.clearAll()
      ann.startLoading()
    },
    stopShift() {
      this.started = false
      this.breakActive = false
      this.lastPhase = 'OFF'
      const audio = useAudioStore()
      audio.pauseBed()
      const ann = useAnnouncementsStore()
      ann.clearAll()
    },
    getPhase(nowMin: number): 'PRE' | 'BREAK' | 'POST' | 'END' | 'ON' | 'OFF' {
      if (!isBetween(nowMin, this.startMin, this.endMin)) return 'OFF'

      const breakEndMin = addMin(this.breakStartMin, this.breakDurationMin)
      if (isBetween(nowMin, this.breakStartMin, breakEndMin)) return 'BREAK'

      const preStart = addMin(this.breakStartMin, -15)
      const postEnd = addMin(breakEndMin, 15)

      if (isBetween(nowMin, preStart, this.breakStartMin)) return 'PRE'
      if (isBetween(nowMin, breakEndMin, postEnd)) return 'POST'
      if (isBetween(nowMin, postEnd, this.endMin)) return 'END'
      return 'ON'
    },
    async handleTick(nowMin: number) {
      this._nowMin = nowMin
      if (this.started && !isBetween(nowMin, this.startMin, this.endMin)) {
        await this.announceShiftEnded()
        this.stopShift()
        return
      }
      const phase = this.getPhase(nowMin)
      const breakActive = phase === 'BREAK'
      const wasBreakActive = this.breakActive

      this.breakActive = breakActive

      if (!wasBreakActive && breakActive) {
        await this.announceBreak('Break starting')
      } else if (wasBreakActive && !breakActive) {
        await this.announceBreak('Break ended')
      }

      if (phase !== this.lastPhase) {
        this.lastPhase = phase
        this.applyMusicPhase(phase)
      }
    },
    applyMusicPhase(phase: 'PRE' | 'BREAK' | 'POST' | 'END' | 'ON' | 'OFF') {
      if (phase === 'OFF') return
      const audio = useAudioStore()
      const playlist = this.phaseMusic[phase]
      if (!playlist) return
      audio.setBedPlaylist(playlist)
    },

    setPhaseMusic(phase: 'PRE' | 'BREAK' | 'POST' | 'END' | 'ON', playlist: BedPlaylist) {
      this.phaseMusic[phase] = playlist
      if (this.lastPhase === phase) this.applyMusicPhase(phase)
    },
    resetPhaseMusic() {
      this.phaseMusic = { ...defaultPhaseMusic }
      if (this.lastPhase !== 'OFF') this.applyMusicPhase(this.lastPhase)
    },
    async announceBreak(label: 'Break starting' | 'Break ended') {
      const ann = useAnnouncementsStore()
      const id = label === 'Break starting' ? 'break-start' : 'break-end'
      ann.queue.push({
        id,
        name: label,
        priority: 'P1_SAFETY',
        deliveryMode: 'immediate',
        scheduledAtMin: this._nowMin,
        state: 'QUEUED',
      })
      ann.sortQueue()
      await ann.deliverImmediate(id, 'shift_break_event', { allowDuringBreak: true })
    },
    async announceShiftEnded() {
      const ann = useAnnouncementsStore()
      ann.queue.push({
        id: 'shift-end',
        name: 'Shift ended',
        priority: 'P1_SAFETY',
        deliveryMode: 'immediate',
        scheduledAtMin: this._nowMin,
        state: 'QUEUED',
      })
      ann.sortQueue()
      await ann.deliverImmediate('shift-end', 'shift_end_event', { allowDuringBreak: true })
    },
  },
})
