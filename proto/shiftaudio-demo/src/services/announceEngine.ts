// src/services/announceEngine.ts
export type AnnounceOptions = {
  volume?: number
  rate?: number
  pitch?: number
  voiceNameIncludes?: string
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

class AnnounceEngine {
  private unlocked = false
  private voicesReady: Promise<void> | null = null

  /** Call this from a USER CLICK (Play button / Test button) */
  enableFromUserGesture() {
    this.unlocked = true

    // Safari/iOS: warm up speech engine
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      window.speechSynthesis.speak(u)
      window.speechSynthesis.cancel()
    } catch {}
  }

  private async ensureVoices(): Promise<void> {
    if (this.voicesReady) return this.voicesReady

    this.voicesReady = new Promise<void>((resolve) => {
      const synth = window.speechSynthesis

      const done = () => resolve()

      // Already loaded?
      const v = synth.getVoices?.() ?? []
      if (v.length) return done()

      // Wait for voiceschanged
      const handler = () => {
        synth.removeEventListener?.('voiceschanged', handler)
        done()
      }
      synth.addEventListener?.('voiceschanged', handler)

      // Fallback timer
      setTimeout(done, 800)
    })

    return this.voicesReady
  }

  async speak(text: string, opts: AnnounceOptions = {}): Promise<void> {
    if (!this.unlocked) {
      throw new Error('Speech blocked until enabled by a user action (click Play once).')
    }

    await this.ensureVoices()

    // Clear any stuck queue
    try {
      window.speechSynthesis.cancel()
    } catch {}
    await sleep(50)

    const utter = new SpeechSynthesisUtterance(text)
    utter.volume = clamp01(opts.volume ?? 1)
    utter.rate = opts.rate ?? 1
    utter.pitch = opts.pitch ?? 1

    // Pick a voice if possible (optional)
    const voices = window.speechSynthesis.getVoices?.() ?? []
    if (voices.length) {
      if (opts.voiceNameIncludes) {
        const hit = voices.find((v) =>
          v.name.toLowerCase().includes(opts.voiceNameIncludes!.toLowerCase()),
        )
        if (hit) utter.voice = hit
      } else {
        // Prefer an English voice if present (common case)
        const en = voices.find((v) => (v.lang || '').toLowerCase().startsWith('en'))
        if (en) utter.voice = en
      }
    }

    await new Promise<void>((resolve, reject) => {
      utter.onend = () => resolve()
      utter.onerror = () => reject(new Error('Speech synthesis failed or is blocked.'))
      window.speechSynthesis.speak(utter)
    })
  }
}

export const announceEngine = new AnnounceEngine()
