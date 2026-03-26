// src/services/audioEngine.ts
import type { BedPlaylist } from '@/types/domain'

type Manifest = { tracks: string[] }

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const ai = a[i]
    const aj = a[j]
    if (ai === undefined || aj === undefined) continue
    a[i] = aj
    a[j] = ai
  }
  return a
}

export class AudioEngine {
  private a = new Audio()
  private b = new Audio()
  private active: 'a' | 'b' = 'a'
  private trackList: string[] = []
  private trackIndex = 0

  private playlist: BedPlaylist = 'calm'
  private crossfadeMs = 8000

  private master = 0.7
  private isStarted = false
  private isStopped = true
  private aRel = 0
  private bRel = 0

  private nextCrossfadeTimeout: number | null = null
  private isCrossfading = false // ✅ NEW: mutex

  onCrossfadeScheduled?: (nextTs: number) => void
  onCrossfadeStart?: () => void

  constructor() {
    // iOS/Safari friendliness
    this.a.preload = 'auto'
    this.b.preload = 'auto'
    this.a.loop = false
    this.b.loop = false

    // ended is a fallback; scheduling is primary
    this.a.addEventListener('ended', () => void this.queueNext())
    this.b.addEventListener('ended', () => void this.queueNext())
  }

  private clearNextTimer() {
    if (this.nextCrossfadeTimeout != null) {
      clearTimeout(this.nextCrossfadeTimeout)
      this.nextCrossfadeTimeout = null
    }
  }

  private scheduleNextCrossfade(fromEl: HTMLAudioElement) {
    this.clearNextTimer()
    if (this.isStopped) return

    const plan = () => {
      if (this.isStopped) return
      if (!isFinite(fromEl.duration) || fromEl.duration <= 0) return

      const cfSec = this.crossfadeMs / 1000
      const startAt = Math.max(0, fromEl.duration - Math.max(cfSec, 3))
      const msUntil = Math.max(0, (startAt - fromEl.currentTime) * 1000)

      const nextTs = Date.now() + msUntil
      this.onCrossfadeScheduled?.(nextTs)

      this.nextCrossfadeTimeout = window.setTimeout(() => {
        void this.crossfadeToNext()
      }, msUntil)
    }

    if (isFinite(fromEl.duration) && fromEl.duration > 0) plan()
    else fromEl.addEventListener('loadedmetadata', plan, { once: true })
  }

  setMasterVolume(v: number) {
    this.master = clamp01(v)
    this.a.volume = clamp01(this.aRel) * this.master
    this.b.volume = clamp01(this.bRel) * this.master
  }

  setCrossfadeSeconds(seconds: number) {
    this.crossfadeMs = Math.max(2000, seconds * 1000)
  }

  async setPlaylist(playlist: BedPlaylist) {
    this.playlist = playlist
    await this.loadManifest()
    this.trackIndex = 0
  }

  async crossfadeToPlaylist(playlist: BedPlaylist) {
    this.playlist = playlist
    await this.loadManifest()
    this.trackIndex = 0
    if (this.isStopped) return
    await this.crossfadeToNext()
  }

  async start() {
    this.isStopped = false

    if (!this.isStarted) {
      this.isStarted = true
      await this.loadManifest()
    }

    const nextUrl = this.nextTrackUrl()
    await this.playOn(this.currentEl(), nextUrl, 1)
    this.scheduleNextCrossfade(this.currentEl())
  }

  stop() {
    this.isStopped = true
    this.safePause(this.a)
    this.safePause(this.b)
    this.clearNextTimer()
    this.isCrossfading = false
  }

  getCurrentTrackName(): string {
    const url = this.currentEl().src
    try {
      return decodeURIComponent(url.split('/').pop() || '')
    } catch {
      return url.split('/').pop() || ''
    }
  }

  /* ---------------- internals ---------------- */

  private async loadManifest() {
    const res = await fetch(`/audio/${this.playlist}/manifest.json`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Missing manifest: /audio/${this.playlist}/manifest.json`)
    const json = (await res.json()) as Manifest
    if (!json.tracks?.length) throw new Error(`Empty manifest for playlist ${this.playlist}`)

    this.trackList = shuffle(json.tracks).map((f) => `/audio/${this.playlist}/${f}`)
  }

  private nextTrackUrl(): string {
    if (!this.trackList.length) throw new Error('Playlist not loaded')
    const idx = this.trackIndex % this.trackList.length
    const url = this.trackList[idx]
    if (!url) throw new Error('Track URL missing in playlist')
    this.trackIndex++
    return url
  }

  private currentEl(): HTMLAudioElement {
    return this.active === 'a' ? this.a : this.b
  }
  private otherEl(): HTMLAudioElement {
    return this.active === 'a' ? this.b : this.a
  }

  private async queueNext() {
    if (this.isStopped) return
    if (this.isCrossfading) return

    // ✅ If a scheduled crossfade exists, ended-trigger should do nothing.
    if (this.nextCrossfadeTimeout != null) return

    await this.crossfadeToNext()
  }

  private async crossfadeToNext() {
    if (this.isStopped) return
    if (this.isCrossfading) return

    this.isCrossfading = true
    this.clearNextTimer() // ✅ stop timer from firing mid-crossfade

    try {
      const from = this.currentEl()
      const to = this.otherEl()

      const nextUrl = this.nextTrackUrl()

      this.onCrossfadeStart?.()
      await this.playOn(to, nextUrl, 0)

      const steps = 30
      const stepMs = Math.max(16, Math.floor(this.crossfadeMs / steps))

      for (let i = 0; i <= steps; i++) {
        if (this.isStopped) return
        const t = i / steps

        // ✅ Equal-power crossfade curve (prevents “double loudness”)
        const toRel = Math.sin(t * Math.PI * 0.5)
        const fromRel = Math.cos(t * Math.PI * 0.5)

        if (to === this.a) this.aRel = toRel
        else this.bRel = toRel

        if (from === this.a) this.aRel = fromRel
        else this.bRel = fromRel

        to.volume = toRel * this.master
        from.volume = fromRel * this.master

        await new Promise((r) => setTimeout(r, stepMs))
      }

      this.safePause(from)
      from.currentTime = 0

      this.active = this.active === 'a' ? 'b' : 'a'
      this.scheduleNextCrossfade(this.currentEl())
    } finally {
      this.isCrossfading = false
    }
  }

  /** Force an immediate crossfade to the next track (demo control). */
  async forceCrossfadeNow() {
    await this.crossfadeToNext()
  }

  private async playOn(el: HTMLAudioElement, url: string, volume01: number) {
    el.src = url
    el.currentTime = 0

    const rel = clamp01(volume01)
    if (el === this.a) this.aRel = rel
    else this.bRel = rel

    el.volume = rel * this.master

    await el.play()
  }

  private safePause(el: HTMLAudioElement) {
    try {
      el.pause()
    } catch {}
  }

  pause() {
    this.safePause(this.a)
    this.safePause(this.b)
    this.clearNextTimer()
  }

  resume() {
    const el = this.currentEl()
    void el.play()
    this.scheduleNextCrossfade(el)
  }
}
