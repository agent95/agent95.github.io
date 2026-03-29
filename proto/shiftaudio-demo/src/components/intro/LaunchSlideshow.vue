<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'start-guide'): void
}>()

type Slide = {
  eyebrow: string
  title: string
  body: string
  caption: string
  image: string
  imageAlt: string
  mediaTag: string
  voiceover?: string
}

const slides: Slide[] = [
  {
    eyebrow: 'Problem',
    title: 'Busy floor. High noise. Critical messages get missed.',
    body: 'On a busy warehouse floor, routine safety messages can be missed, delayed, or drowned out by the operating environment.',
    caption: 'The communication problem ShiftAudio is designed to solve',
    image: '/assets/intro-slideshow/busy-warehouse.png',
    imageAlt: 'Warehouse problem placeholder artwork',
    mediaTag: 'Busy warehouse',
    voiceover: '/audio/intro/intro-01.mp3',
  },
  {
    eyebrow: 'Solution',
    title: 'ShiftAudio delivers safety at the right moment.',
    body: 'ShiftAudio adds a managed safety messaging layer to the shift, so communication stays clear, timely, and operationally controlled.',
    caption: 'A product walkthrough of how messaging fits into the workflow',
    image: '/assets/intro-slideshow/feature-screenshot-timeline.png',
    imageAlt:
      'ShiftAudio screenshot showing announcements queue, shift timeline, and background audio controls',
    mediaTag: 'Screenshot',
    voiceover: '/audio/intro/intro-02.mp3',
  },
  /*{
    eyebrow: 'Feature',
    title: 'Announcements can play immediately or on the next crossfade.',
    body: 'Messages wait for the next background-audio crossfade so routine communication lands more naturally.',
    caption: 'Delivery logic adapts to the live audio environment',
    image: '/assets/intro-slideshow/feature-screenshot-timeline.png',
    imageAlt:
      'ShiftAudio screenshot showing shift timeline, break windows, and scheduled delivery controls',
    mediaTag: 'Screenshot',
    voiceover: '/audio/intro/intro-03.mp3',
  },
  {
    eyebrow: 'Feature',
    title: 'Phase music mapping lets the audio bed support the work.',
    body: 'Background audio can be mapped by phase to support focus, recovery, or short push periods, while always staying subordinate to safety messaging.',
    caption: 'Audio control is designed to support pace without competing with safety',
    image: '/assets/intro-slideshow/feature-screenshot-phase-music.png',
    imageAlt:
      'ShiftAudio screenshot showing phase music mapping, playlist guidance, and background bed controls',
    mediaTag: 'Screenshot',
    voiceover: '/audio/intro/intro-04.mp3',
  },
  */
  // {
  //   eyebrow: 'Why It Works',
  //   title: 'Timed delivery. Break-aware. Emergency-first.',
  //   body: 'ShiftAudio coordinates playback around live audio, pauses routine messaging during breaks, and gives emergency alerts immediate priority.',
  //   caption: 'The system stays controlled even when operating conditions change',
  //   image: '/assets/intro-slideshow/feature-screenshot-emergency.svg',
  //   imageAlt:
  //     'ShiftAudio screenshot showing emergency override, live audio timing, and system health states',
  //   mediaTag: 'ShiftAudio screenshot',
  //   voiceover: '/audio/intro/intro-05.mp3',
  // },
  {
    eyebrow: 'Safety First',
    title: 'In an emergency, all other audio stops.',
    body: 'When something critical happens, ShiftAudio stops background audio and gives urgent messaging immediate priority.',
    caption: 'Emergency communication overrides the normal audio flow',
    image: '/assets/intro-slideshow/feature-screenshot-emergency.png',
    imageAlt: 'ShiftAudio closing placeholder artwork',
    mediaTag: 'Screenshot',
    voiceover: '/audio/intro/intro-06.mp3',
  },
  {
    eyebrow: 'Value',
    title: 'Better compliance. Less disruption. Clearer communication.',
    body: 'The value is simple: clearer communication for teams on the floor and more consistent safety delivery for site leaders.',
    caption: 'Operational value that is easy to see in the workflow',
    image: '/assets/intro-slideshow/feature-screenshot-logs.png',
    imageAlt: 'Compliance value placeholder artwork',
    mediaTag: 'Screenshot',
    voiceover: '/audio/intro/intro-07.mp3',
  },
]

const isOpen = ref(true)
const hasStartedAudio = ref(false)
const isPaused = ref(false)
const activeIndex = ref(0)
const autoplayProgress = ref(0)
let backgroundAudio: HTMLAudioElement | null = null
let voiceoverAudio: HTMLAudioElement | null = null
let autoplayTimer: number | null = null
let autoplayProgressTimer: number | null = null
const fallbackAutoplayMs = 15000
let autoplayStartedAt = 0
let autoplayRemainingMs = fallbackAutoplayMs

const activeSlide = computed(() => slides[activeIndex.value])
const canGoBack = computed(() => activeIndex.value > 0)
const canGoForward = computed(() => activeIndex.value < slides.length - 1)

async function startAudioExperience() {
  hasStartedAudio.value = true
  isPaused.value = false

  try {
    await backgroundAudio?.play()
  } catch {
    // Autoplay may be blocked until the first explicit user gesture.
  }

  await playVoiceoverForActiveSlide()
}

function stopAutoplayTimers() {
  if (autoplayTimer != null) {
    window.clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
  if (autoplayProgressTimer != null) {
    window.clearInterval(autoplayProgressTimer)
    autoplayProgressTimer = null
  }
}

function startFallbackAutoplay(durationMs = fallbackAutoplayMs) {
  stopAutoplayTimers()

  if (!canGoForward.value) {
    autoplayProgress.value = 1
    autoplayRemainingMs = fallbackAutoplayMs
    return
  }

  autoplayRemainingMs = durationMs
  autoplayStartedAt = Date.now()
  const progressBase = Math.max(0, Math.min(1, 1 - durationMs / fallbackAutoplayMs))
  autoplayProgress.value = progressBase

  autoplayProgressTimer = window.setInterval(() => {
    const elapsed = Date.now() - autoplayStartedAt
    const progressSpan = Math.max(0, Math.min(1, durationMs / fallbackAutoplayMs))
    autoplayProgress.value = Math.max(
      progressBase,
      Math.min(1, progressBase + (elapsed / durationMs) * progressSpan),
    )
  }, 100)

  autoplayTimer = window.setTimeout(() => {
    autoplayProgress.value = 1
    autoplayRemainingMs = fallbackAutoplayMs
    stopAutoplayTimers()
    goNext()
  }, durationMs)
}

async function playVoiceoverForActiveSlide() {
  stopAutoplayTimers()
  autoplayProgress.value = 0
  autoplayRemainingMs = fallbackAutoplayMs
  voiceoverAudio?.pause()
  if (voiceoverAudio) voiceoverAudio.currentTime = 0

  const src = activeSlide.value.voiceover
  if (!src || !isOpen.value || !hasStartedAudio.value || isPaused.value) return

  startFallbackAutoplay()

  if (!voiceoverAudio) return

  voiceoverAudio.src = src

  try {
    voiceoverAudio.ontimeupdate = null
    voiceoverAudio.onended = null
    await voiceoverAudio.play()
  } catch {
    // If playback is blocked, the timer-based autoplay still keeps the slideshow moving.
  }
}

function pauseAutoplay() {
  if (!hasStartedAudio.value || isPaused.value) return

  if (autoplayTimer != null) {
    autoplayRemainingMs = Math.max(0, autoplayRemainingMs - (Date.now() - autoplayStartedAt))
  }

  isPaused.value = true
  stopAutoplayTimers()
  voiceoverAudio?.pause()
  backgroundAudio?.pause()
}

async function resumeAutoplay() {
  if (!hasStartedAudio.value || !isPaused.value) return

  isPaused.value = false

  try {
    await backgroundAudio?.play()
  } catch {
    // Resume still works without background audio if playback is blocked.
  }

  try {
    await voiceoverAudio?.play()
  } catch {
    // Timer-based autoplay still resumes even if voiceover playback is blocked.
  }

  if (canGoForward.value) {
    startFallbackAutoplay(Math.max(autoplayRemainingMs, 250))
  } else {
    autoplayProgress.value = 1
  }
}

function togglePause() {
  if (isPaused.value) {
    void resumeAutoplay()
    return
  }

  pauseAutoplay()
}

async function replaySlide() {
  if (!hasStartedAudio.value) return

  isPaused.value = false

  try {
    await backgroundAudio?.play()
  } catch {
    // Replay still proceeds even if background playback is blocked.
  }

  await playVoiceoverForActiveSlide()
}

function goToSlide(index: number) {
  activeIndex.value = index
}

function goNext() {
  if (canGoForward.value) {
    activeIndex.value += 1
    return
  }
  closeSlideshow()
}

function goBack() {
  if (canGoBack.value) activeIndex.value -= 1
}

function closeSlideshow() {
  isOpen.value = false
  isPaused.value = false
  stopAutoplayTimers()
  backgroundAudio?.pause()
  voiceoverAudio?.pause()
  if (voiceoverAudio) voiceoverAudio.currentTime = 0
}

function reopenSlideshow() {
  activeIndex.value = 0
  isOpen.value = true
  hasStartedAudio.value = false
  isPaused.value = false
  autoplayProgress.value = 0
  autoplayRemainingMs = fallbackAutoplayMs
  stopAutoplayTimers()
  backgroundAudio?.pause()
  voiceoverAudio?.pause()
  if (voiceoverAudio) voiceoverAudio.currentTime = 0
}

function startGuide() {
  closeSlideshow()
  emit('start-guide')
}

watch(activeIndex, () => {
  if (!hasStartedAudio.value) {
    stopAutoplayTimers()
    autoplayProgress.value = 0
    voiceoverAudio?.pause()
    if (voiceoverAudio) voiceoverAudio.currentTime = 0
    return
  }
  isPaused.value = false
  void playVoiceoverForActiveSlide()
})

watch(isOpen, (open) => {
  if (!open) {
    isPaused.value = false
    stopAutoplayTimers()
    backgroundAudio?.pause()
    voiceoverAudio?.pause()
  }
})

onMounted(() => {
  backgroundAudio = new window.Audio('/audio/intro/intro-background.mp3')
  backgroundAudio.loop = true
  backgroundAudio.volume = 0.18

  voiceoverAudio = new window.Audio()
  voiceoverAudio.volume = 1
})

onBeforeUnmount(() => {
  stopAutoplayTimers()
  backgroundAudio?.pause()
  voiceoverAudio?.pause()
})

defineExpose({
  reopenSlideshow,
})
</script>

<template>
  <transition name="intro-fade">
    <section v-if="isOpen" class="intro-slideshow" aria-label="ShiftAudio introduction slideshow">
      <div class="intro-slideshow__backdrop" @click="closeSlideshow" />
      <div class="intro-slideshow__panel" role="dialog" aria-modal="true">
        <button
          class="intro-slideshow__close"
          type="button"
          @click="closeSlideshow"
          aria-label="Close introduction"
        >
          Skip intro
        </button>

        <div class="intro-slideshow__media">
          <img :src="activeSlide.image" :alt="activeSlide.imageAlt" />
          <span class="intro-slideshow__media-tag">{{ activeSlide.mediaTag }}</span>
        </div>

        <div class="intro-slideshow__content">
          <p class="intro-slideshow__eyebrow">{{ activeSlide.eyebrow }}</p>
          <h1 class="intro-slideshow__title">"{{ activeSlide.title }}"</h1>
          <div class="intro-slideshow__meta">
            <span class="chip">Slide {{ activeIndex + 1 }} of {{ slides.length }}</span>
            <!-- <span class="chip">Feature screenshots on key slides</span>
            <span class="chip">Placeholder voiceover + music</span> -->
          </div>

          <div class="intro-slideshow__progress-row">
            <div class="intro-slideshow__progress" aria-hidden="true">
              <div
                class="intro-slideshow__progress-fill"
                :style="{ width: `${autoplayProgress * 100}%` }"
              ></div>
            </div>
            <button
              class="intro-slideshow__pause"
              type="button"
              :disabled="!hasStartedAudio"
              aria-label="Replay slide"
              title="Replay slide"
              @click="replaySlide"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="intro-slideshow__pause-icon">
                <path
                  d="M12 5a7 7 0 1 1-6.74 8.9 1 1 0 1 1 1.92-.56A5 5 0 1 0 8.38 8H11a1 1 0 1 1 0 2H5.75a.75.75 0 0 1-.75-.75V4a1 1 0 1 1 2 0v2.14A6.96 6.96 0 0 1 12 5Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              class="intro-slideshow__pause"
              type="button"
              :disabled="!hasStartedAudio"
              :aria-pressed="isPaused"
              :aria-label="isPaused ? 'Resume autoplay' : 'Pause autoplay'"
              :title="isPaused ? 'Resume autoplay' : 'Pause autoplay'"
              @click="togglePause"
            >
              <svg
                v-if="isPaused"
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="intro-slideshow__pause-icon"
              >
                <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="intro-slideshow__pause-icon"
              >
                <path
                  d="M8.5 6.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Zm7 0a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <div class="intro-slideshow__timeline" aria-label="Slide selector">
            <button
              v-for="(slide, index) in slides"
              :key="slide.title"
              class="intro-slideshow__dot"
              :class="{ 'is-active': index === activeIndex }"
              type="button"
              :aria-label="`Go to slide ${index + 1}`"
              @click="goToSlide(index)"
            />
          </div>

          <div class="intro-slideshow__actions">
            <button class="btn btn-secondary" type="button" :disabled="!canGoBack" @click="goBack">
              Back
            </button>
            <button
              v-if="activeIndex === 0 && !hasStartedAudio"
              class="btn intro-slideshow__primary"
              type="button"
              @click="startAudioExperience"
            >
              Start presentation
            </button>
            <button
              v-if="!canGoForward"
              class="btn intro-slideshow__primary"
              type="button"
              @click="startGuide"
            >
              Start walkthrough guide
            </button>
            <!-- <button class="btn" type="button" @click="startAudioExperience">Replay audio</button> -->
            <button
              v-if="canGoForward && (hasStartedAudio || activeIndex !== 0)"
              class="btn intro-slideshow__primary"
              type="button"
              @click="goNext"
            >
              Next slide
            </button>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<style scoped>
.intro-slideshow {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: 24px;
}

.intro-slideshow__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(246, 247, 251, 0.82);
  backdrop-filter: blur(18px);
}

.intro-slideshow__panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  width: min(1240px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  min-height: min(760px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: var(--surface);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14);
}

.intro-slideshow__close {
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 2;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 10px 14px;
  color: var(--text);
  background: var(--surface-strong);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  cursor: pointer;
}

.intro-slideshow__media {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 100%;
  background: rgba(255, 255, 255, 0.7);
}

.intro-slideshow__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
}

.intro-slideshow__media-tag {
  position: absolute;
  left: 24px;
  bottom: 24px;
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 8px;
  color: #fff;
  border: 1px solid rgba(15, 23, 42, 0.48);
  background: rgba(51, 65, 85, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.intro-slideshow__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
  padding: 64px 54px 48px;
  overflow-y: auto;
  color: var(--text);
  background: rgba(249, 250, 252, 0.94);
}

.intro-slideshow__eyebrow {
  margin: 0;
  color: rgba(3, 105, 161, 0.9);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.4rem, 3.4vw, 4rem);
  line-height: 0.98;
}

.intro-slideshow__title {
  font-style: italic;
}

.intro-slideshow__body {
  margin: 0;
  color: rgba(15, 23, 42, 0.88);
  font-size: 1.08rem;
  line-height: 1.5;
}

.intro-slideshow__caption {
  margin: -6px 0 0;
  color: rgba(12, 74, 110, 0.92);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.intro-slideshow__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.intro-slideshow__meta :deep(.chip) {
  color: var(--text);
  border-color: var(--border);
  background: var(--surface-strong);
}

.intro-slideshow__progress {
  flex: 1;
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.intro-slideshow__progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.intro-slideshow__progress-fill {
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: rgba(56, 189, 248, 0.82);
  transition: width 100ms linear;
}

.intro-slideshow__pause {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  width: 38px;
  height: 38px;
  padding: 0;
  color: var(--text);
  background: var(--surface-strong);
  font: inherit;
  cursor: pointer;
}

.intro-slideshow__pause:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.intro-slideshow__pause-icon {
  width: 16px;
  height: 16px;
}

.intro-slideshow__timeline {
  display: flex;
  gap: 10px;
}

.intro-slideshow__dot {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
  cursor: pointer;
}

.intro-slideshow__dot.is-active {
  width: 34px;
  border-color: rgba(14, 116, 144, 0.18);
  background: rgba(56, 189, 248, 0.78);
}

.intro-slideshow__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.intro-slideshow__actions .btn {
  min-width: 136px;
}

.intro-slideshow__primary {
  color: #fff;
  border-color: rgba(194, 65, 12, 0.28);
  background: #ea580c;
}

.intro-slideshow__primary:hover {
  border-color: rgba(194, 65, 12, 0.4);
  background: #c2410c;
}

.intro-fade-enter-active,
.intro-fade-leave-active {
  transition: opacity 180ms ease;
}

.intro-fade-enter-from,
.intro-fade-leave-to {
  opacity: 0;
}

@media (max-width: 980px) {
  .intro-slideshow {
    padding: 10px;
  }

  .intro-slideshow__panel {
    grid-template-columns: 1fr;
    width: min(100vw - 20px, 720px);
    max-height: calc(100vh - 20px);
    min-height: auto;
  }

  .intro-slideshow__media {
    min-height: 180px;
    max-height: 28vh;
  }

  .intro-slideshow__content {
    gap: 16px;
    padding: 20px 16px 16px;
  }

  h1 {
    font-size: clamp(1.5rem, 7vw, 2.2rem);
    line-height: 1.05;
  }

  .intro-slideshow__close {
    top: 12px;
    right: 12px;
    padding: 8px 12px;
    font-size: 12px;
  }

  .intro-slideshow__media-tag {
    left: 12px;
    bottom: 12px;
    padding: 6px 9px;
    font-size: 0.64rem;
  }

  .intro-slideshow__body {
    font-size: 0.96rem;
    line-height: 1.42;
  }

  .intro-slideshow__caption {
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .intro-slideshow__actions {
    gap: 8px;
  }

  .intro-slideshow__actions .btn {
    min-width: 0;
    flex: 1 1 140px;
    padding: 10px;
  }

  .intro-slideshow__timeline {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 640px) {
  .intro-slideshow__meta {
    gap: 6px;
  }

  .intro-slideshow__meta :deep(.chip) {
    font-size: 11px;
    padding: 6px 8px;
  }

  .intro-slideshow__progress {
    height: 2px;
  }

  .intro-slideshow__progress-row {
    gap: 8px;
  }

  .intro-slideshow__pause {
    width: 34px;
    height: 34px;
  }

  .intro-slideshow__pause-icon {
    width: 14px;
    height: 14px;
  }
}
</style>
