// src/services/messageAudio.ts
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

// Single queue so tones + messages never overlap
let chain: Promise<void> = Promise.resolve()

async function playOnce(url: string, volume = 1, playbackRate = 1): Promise<void> {
  const a = new Audio(url)
  a.preload = 'auto'
  a.volume = clamp01(volume)
  a.playbackRate = Math.max(0.5, Math.min(2, playbackRate))

  await a.play()

  await new Promise<void>((resolve, reject) => {
    a.onended = () => resolve()
    a.onerror = () => reject(new Error(`Failed to play audio: ${url}`))
  })
}

/** Enqueue playback to prevent overlap */
export function enqueuePlayback(fn: () => Promise<void>): Promise<void> {
  chain = chain.then(fn).catch(() => fn()) // keep chain alive even on errors
  return chain
}

/** Play optional tone then message */
export async function playSequence(opts: {
  toneUrl?: string
  audioUrl: string
  followUpUrl?: string
  toneVolume?: number
  audioVolume?: number
  followUpVolume?: number
  toneRate?: number
  audioRate?: number
  followUpRate?: number
}): Promise<void> {
  return enqueuePlayback(async () => {
    if (opts.toneUrl) {
      await playOnce(opts.toneUrl, opts.toneVolume ?? 1, opts.toneRate ?? 1)
    }

    await playOnce(opts.audioUrl, opts.audioVolume ?? 1, opts.audioRate ?? 1)

    if (opts.followUpUrl) {
      await playOnce(opts.followUpUrl, opts.followUpVolume ?? 1, opts.followUpRate ?? 1)
    }
  })
}
