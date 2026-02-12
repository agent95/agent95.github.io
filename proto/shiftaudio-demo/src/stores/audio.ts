// src/stores/audio.ts
import { defineStore } from 'pinia'
import type { BedPlaylist } from '@/types/domain'
import { AudioEngine } from '@/services/audioEngine'

let engine: AudioEngine | null = null

export const useAudioStore = defineStore('audio', {
  state: () => ({
    bed: {
      playlist: 'calm' as BedPlaylist,
      playing: false,
      paused: false,
      trackName: '',
    },
    policy: {
      crossfadeSeconds: 8,
      duckOnSafety: true,
      duckOnEmergency: true,
    },
    masterVolume: 0.7,
    outputDeviceLabel: 'PA Speaker (Wired)',

    lastCrossfadeTs: 0,
    lastError: '' as string,
    nextCrossfadeTs: 0,
    crossfadeWindowStartTs: 0,
    messageHold: false,
    messageHoldRemainingMs: 0,
    messageHoldWindowMs: 0,
  }),

  actions: {
    duckBed(duckLevel = 0.25) {
      // NEVER allow 0; it can strand the engine at silence
      const level = Math.max(0.05, Math.min(1, duckLevel))

      const base = (this as any)._baseMaster ?? this.masterVolume
      const ducked = Math.max(0, Math.min(1, base * level))

      // Apply duck WITHOUT overwriting base preference
      this.masterVolume = ducked
      if (engine) engine.setMasterVolume(ducked)

      return () => {
        const restoreTo = (this as any)._baseMaster ?? base
        this.masterVolume = restoreTo
        if (engine) engine.setMasterVolume(restoreTo)
      }
    },

    duckBedWithFade(duckLevel = 0.25, fadeMs = 260) {
      const level = Math.max(0.05, Math.min(1, duckLevel))

      const base = (this as any)._baseMaster ?? this.masterVolume
      const ducked = Math.max(0, Math.min(1, base * level))

      this.masterVolume = ducked
      if (engine) engine.setMasterVolume(ducked)

      return async () => {
        const restoreTo = (this as any)._baseMaster ?? base
        await this.fadeMasterTo(restoreTo, fadeMs)
      }
    },

    fadeTo(volume: number, ms = 200) {
      const start = this.masterVolume
      const end = Math.max(0, Math.min(1, volume))
      const steps = 12
      const stepMs = Math.max(16, Math.floor(ms / steps))

      let i = 0
      const tick = () => {
        i++
        const t = i / steps
        const v = start + (end - start) * t

        // ✅ fade the live output, but do not change base preference
        this.setMasterVolume(v, { asBase: false })

        if (i < steps) setTimeout(tick, stepMs)
      }
      tick()
    },

    fadeMasterTo(volume: number, ms = 180) {
      const start = this.masterVolume
      const end = Math.max(0, Math.min(1, volume))
      const steps = 12
      const stepMs = Math.max(16, Math.floor(ms / steps))

      return new Promise<void>((resolve) => {
        let i = 0
        const tick = () => {
          i++
          const t = i / steps
          const v = start + (end - start) * t
          this.setMasterVolume(v, { asBase: false })
          if (i < steps) setTimeout(tick, stepMs)
          else resolve()
        }
        tick()
      })
    },

    async pauseBedForMessage(fadeOutMs = 120) {
      if (!engine || !this.bed.playing) {
        return async () => {}
      }

      const now = Date.now()
      const remaining = Math.max(0, this.nextCrossfadeTs - now)
      const windowMs =
        this.crossfadeWindowStartTs && this.nextCrossfadeTs > this.crossfadeWindowStartTs
          ? this.nextCrossfadeTs - this.crossfadeWindowStartTs
          : 0
      this.messageHold = true
      this.messageHoldRemainingMs = remaining
      this.messageHoldWindowMs = windowMs

      const base =
        (this as any)._baseMaster ?? (this as any)._emergencyBaseMaster ?? this.masterVolume

      await this.fadeMasterTo(0, fadeOutMs)

      engine.pause()
      this.bed.paused = true
      this.bed.playing = false
      document.body.classList.remove('is-playing')

      // Keep base ready for later (do NOT change base preference)
      this.setMasterVolume(base, { asBase: false })

      return async () => {
        await this.hardRestartBed(180)
        this.messageHold = false
        this.messageHoldRemainingMs = 0
        this.messageHoldWindowMs = 0
      }
    },

    ensureEngine() {
      if (engine) return engine

      engine = new AudioEngine()
      engine.setMasterVolume(this.masterVolume)
      engine.setCrossfadeSeconds(this.policy.crossfadeSeconds)

      engine.onCrossfadeStart = () => this.onCrossfadeStart()

      engine.onCrossfadeScheduled = (ts: number) => {
        this.crossfadeWindowStartTs = Date.now() // ✅ START of progress window
        this.nextCrossfadeTs = ts
      }

      return engine
    },

    async crossfadeNow() {
      if (!engine) return
      await engine.forceCrossfadeNow()
    },

    async startBed() {
      this.lastError = ''
      try {
        await this.hardRestartBed(180)
      } catch (e: any) {
        this.lastError = e?.message ?? String(e)
      }
    },

    async emergencyPauseBed(fadeMs = 250) {
      const base = (this as any)._baseMaster ?? this.masterVolume
      ;(this as any)._emergencyBaseMaster = base
      ;(this as any)._wasPlayingBeforeEmergency = this.bed.playing

      await this.fadeMasterTo(0, fadeMs)

      if (engine) engine.pause()
      this.bed.paused = true
      this.bed.playing = false
      document.body.classList.remove('is-playing')

      // Keep base ready for later (do NOT change base preference)
      this.setMasterVolume(base, { asBase: false })
    },

    stopBed() {
      this.lastError = ''
      if (!engine) return
      engine.stop()
      this.bed.playing = false
      document.body.classList.remove('is-playing')
    },

    pauseBed() {
      if (!engine) return
      engine.pause?.() // we'll add this below
      this.bed.paused = true
      this.bed.playing = false
    },

    async resumeBed(fadeMs = 180) {
      if (!engine) return

      const shouldResume = (this as any)._wasPlayingBeforeEmergency
      if (!shouldResume) return

      const base =
        (this as any)._emergencyBaseMaster ?? (this as any)._baseMaster ?? this.masterVolume

      try {
        // Start silently, then fade in
        this.setMasterVolume(0, { asBase: false })
        await engine.start()

        this.bed.paused = false
        this.bed.playing = true
        document.body.classList.add('is-playing')

        await this.fadeMasterTo(base, fadeMs)
      } catch (e: any) {
        // ✅ If play() was blocked or failed, you will see it now
        this.lastError = e?.message ?? String(e)
        this.bed.paused = true
        this.bed.playing = false
        document.body.classList.remove('is-playing')
        throw e
      }
    },

    async hardRestartBed(fadeInMs = 180) {
      this.lastError = ''

      // remember the user's preferred volume
      const base = (this as any)._baseMaster ?? this.masterVolume

      // stop + discard the current engine completely
      try {
        if (engine) engine.stop()
      } catch {}
      engine = null

      // reset UI flags
      this.bed.playing = false
      this.bed.paused = false
      document.body.classList.remove('is-playing')

      // recreate engine
      const eng = this.ensureEngine()

      try {
        // start silently then fade in
        this.setMasterVolume(0, { asBase: false })
        await eng.setPlaylist(this.bed.playlist)
        await eng.start()

        this.bed.playing = true
        this.bed.trackName = eng.getCurrentTrackName()
        document.body.classList.add('is-playing')

        await this.fadeMasterTo(base, fadeInMs)
      } catch (e: any) {
        this.lastError = e?.message ?? String(e)
        this.bed.playing = false
        document.body.classList.remove('is-playing')
        throw e
      }
    },

    async setBedPlaylist(playlist: BedPlaylist) {
      this.bed.playlist = playlist
      this.lastError = ''
      if (!engine) return

      try {
        if (this.bed.playing) {
          await engine.crossfadeToPlaylist(playlist)
          this.bed.trackName = engine.getCurrentTrackName()
        } else {
          await engine.setPlaylist(playlist)
        }
      } catch (e: any) {
        this.lastError = e?.message ?? String(e)
      }
    },

    setMasterVolume(v: number, { asBase = true }: { asBase?: boolean } = {}) {
      this.masterVolume = Math.max(0, Math.min(1, v))

      if (asBase) {
        ;(this as any)._baseMaster = this.masterVolume
      }

      if (engine) engine.setMasterVolume(this.masterVolume)
    },

    setCrossfadeSeconds(v: number) {
      this.policy.crossfadeSeconds = v
      if (engine) engine.setCrossfadeSeconds(v)
    },

    onCrossfadeStart() {
      this.lastCrossfadeTs = Date.now()
    },
  },
})
