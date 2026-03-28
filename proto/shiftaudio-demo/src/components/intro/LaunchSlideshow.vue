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
    image: '/assets/intro-slideshow/overview-placeholder.svg',
    imageAlt: 'Warehouse problem placeholder artwork',
    mediaTag: 'Context image',
    voiceover: '/audio/intro/intro-01.mp3',
  },
  {
    eyebrow: 'Solution',
    title: 'ShiftAudio delivers safety at the right moment.',
    body: 'ShiftAudio adds a managed safety messaging layer to the shift, so communication stays clear, timely, and operationally controlled.',
    caption: 'A product walkthrough of how messaging fits into the workflow',
    image: '/assets/intro-slideshow/feature-screenshot-announcements.svg',
    imageAlt:
      'ShiftAudio screenshot showing announcements queue, shift timeline, and background audio controls',
    mediaTag: 'ShiftAudio screenshot',
    voiceover: '/audio/intro/intro-02.mp3',
  },
  {
    eyebrow: 'Feature',
    title: 'Announcements can play immediately or on the next crossfade.',
    body: 'ShiftAudio can deliver messages right away when needed, or wait for the next background-audio crossfade so routine communication lands more naturally.',
    caption: 'Delivery logic adapts to the live audio environment',
    image: '/assets/intro-slideshow/feature-screenshot-timeline.svg',
    imageAlt:
      'ShiftAudio screenshot showing shift timeline, break windows, and scheduled delivery controls',
    mediaTag: 'ShiftAudio screenshot',
    voiceover: '/audio/intro/intro-03.mp3',
  },
  {
    eyebrow: 'Feature',
    title: 'Phase music mapping lets the audio bed support the work.',
    body: 'Background audio can be mapped by phase to support focus, recovery, or short push periods, while always staying subordinate to safety messaging.',
    caption: 'Audio control is designed to support pace without competing with safety',
    image: '/assets/intro-slideshow/feature-screenshot-phase-music.svg',
    imageAlt:
      'ShiftAudio screenshot showing phase music mapping, playlist guidance, and background bed controls',
    mediaTag: 'ShiftAudio screenshot',
    voiceover: '/audio/intro/intro-04.mp3',
  },
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
    image: '/assets/intro-slideshow/overview-placeholder.svg',
    imageAlt: 'ShiftAudio closing placeholder artwork',
    mediaTag: 'Closing image',
    voiceover: '/audio/intro/intro-06.mp3',
  },
  {
    eyebrow: 'Value',
    title: 'Better compliance. Less disruption. Clearer communication.',
    body: 'The value is simple: clearer communication for teams on the floor and more consistent safety delivery for site leaders.',
    caption: 'Operational value that is easy to see in the workflow',
    image: '/assets/intro-slideshow/compliance-placeholder.svg',
    imageAlt: 'Compliance value placeholder artwork',
    mediaTag: 'Value image',
    voiceover: '/audio/intro/intro-07.mp3',
  },
]

const isOpen = ref(true)
const hasStartedAudio = ref(false)
const activeIndex = ref(0)
const autoplayProgress = ref(0)
let backgroundAudio: HTMLAudioElement | null = null
let voiceoverAudio: HTMLAudioElement | null = null
let autoplayTimer: number | null = null
let autoplayProgressTimer: number | null = null
const fallbackAutoplayMs = 15000

const activeSlide = computed(() => slides[activeIndex.value])
const canGoBack = computed(() => activeIndex.value > 0)
const canGoForward = computed(() => activeIndex.value < slides.length - 1)

async function startAudioExperience() {
  hasStartedAudio.value = true

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
    return
  }

  autoplayProgress.value = 0

  const startedAt = Date.now()
  autoplayProgressTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt
    autoplayProgress.value = Math.max(0, Math.min(1, elapsed / durationMs))
  }, 100)

  autoplayTimer = window.setTimeout(() => {
    autoplayProgress.value = 1
    stopAutoplayTimers()
    goNext()
  }, durationMs)
}

async function playVoiceoverForActiveSlide() {
  stopAutoplayTimers()
  autoplayProgress.value = 0
  voiceoverAudio?.pause()
  if (voiceoverAudio) voiceoverAudio.currentTime = 0
  startFallbackAutoplay()

  const src = activeSlide.value.voiceover
  if (!src || !isOpen.value || !hasStartedAudio.value) return

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
  stopAutoplayTimers()
  backgroundAudio?.pause()
  voiceoverAudio?.pause()
  if (voiceoverAudio) voiceoverAudio.currentTime = 0
}

function reopenSlideshow() {
  activeIndex.value = 0
  isOpen.value = true
  void startAudioExperience()
}

function startGuide() {
  closeSlideshow()
  emit('start-guide')
}

watch(activeIndex, () => {
  void playVoiceoverForActiveSlide()
})

watch(isOpen, (open) => {
  if (!open) {
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

  if (isOpen.value) {
    void startAudioExperience()
  }
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
          <h1>{{ activeSlide.title }}</h1>
          <p class="intro-slideshow__body">{{ activeSlide.body }}</p>
          <p class="intro-slideshow__caption">{{ activeSlide.caption }}</p>

          <div class="intro-slideshow__meta">
            <span class="chip">Slide {{ activeIndex + 1 }} of {{ slides.length }}</span>
            <!-- <span class="chip">Feature screenshots on key slides</span>
            <span class="chip">Placeholder voiceover + music</span> -->
          </div>

          <div class="intro-slideshow__progress" aria-hidden="true">
            <div
              class="intro-slideshow__progress-fill"
              :style="{ width: `${autoplayProgress * 100}%` }"
            ></div>
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
              v-if="!canGoForward"
              class="btn"
              type="button"
              @click="startGuide"
            >
              Start walkthrough guide
            </button>
            <!-- <button class="btn" type="button" @click="startAudioExperience">Replay audio</button> -->
            <button class="btn intro-slideshow__primary" type="button" @click="goNext">
              {{ canGoForward ? 'Next slide' : 'Launch ShiftAudio' }}
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
}

.intro-slideshow__media-tag {
  position: absolute;
  left: 24px;
  bottom: 24px;
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--text);
  border: 1px solid var(--border);
  background: var(--surface-strong);
  backdrop-filter: blur(10px);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
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
  background: rgba(255, 255, 255, 0.82);
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

.intro-slideshow__body {
  margin: 0;
  color: var(--muted);
  font-size: 1.08rem;
  line-height: 1.7;
}

.intro-slideshow__caption {
  margin: -6px 0 0;
  color: rgba(3, 105, 161, 0.88);
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
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.intro-slideshow__progress-fill {
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: rgba(56, 189, 248, 0.82);
  transition: width 100ms linear;
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
  color: #0f172a;
  border-color: var(--border);
  background: var(--surface-strong);
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
    padding: 7px 10px;
    font-size: 0.68rem;
  }

  .intro-slideshow__body {
    font-size: 0.96rem;
    line-height: 1.55;
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
    height: 5px;
  }
}
</style>
