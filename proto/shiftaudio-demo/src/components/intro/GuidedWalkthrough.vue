<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type WalkthroughStep = {
  selector: string
  title: string
  body: string
  actionLabel?: string
  actionBody?: string
  panelPosition?: 'auto' | 'top-left' | 'top-right'
}

const props = defineProps<{
  active: boolean
  steps: WalkthroughStep[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeIndex = ref(0)
const targetRect = ref<DOMRect | null>(null)
const viewportWidth = ref(typeof window === 'undefined' ? 0 : window.innerWidth)
const viewportHeight = ref(typeof window === 'undefined' ? 0 : window.innerHeight)
let activeTarget: HTMLElement | null = null
let activeScope: HTMLElement | null = null

const activeStep = computed(() => props.steps[activeIndex.value] ?? null)
const canGoBack = computed(() => activeIndex.value > 0)
const canGoForward = computed(() => activeIndex.value < props.steps.length - 1)
const isMobile = computed(() => viewportWidth.value < 980)
const panelStyle = computed(() => {
  const panelWidth = Math.min(360, Math.max(280, viewportWidth.value - 48))
  const margin = 24
  const gap = 18
  const panelHeight = 220

  if (activeStep.value?.panelPosition === 'top-left') {
    return {
      left: `${margin}px`,
      top: `${margin}px`,
    }
  }

  if (activeStep.value?.panelPosition === 'top-right') {
    return {
      left: `${Math.max(margin, viewportWidth.value - panelWidth - margin)}px`,
      top: `${margin}px`,
    }
  }

  if (!targetRect.value || isMobile.value) {
    return {
      left: '10px',
      right: '10px',
      bottom: '10px',
      top: 'auto',
    }
  }

  const rect = targetRect.value
  const fitsRight = rect.right + gap + panelWidth <= viewportWidth.value - margin
  const fitsLeft = rect.left - gap - panelWidth >= margin
  const topAligned = Math.min(
    viewportHeight.value - panelHeight - margin,
    Math.max(margin, rect.top),
  )

  if (fitsRight) {
    return {
      left: `${rect.right + gap}px`,
      top: `${topAligned}px`,
    }
  }

  if (fitsLeft) {
    return {
      left: `${rect.left - panelWidth - gap}px`,
      top: `${topAligned}px`,
    }
  }

  const fitsBelow = rect.bottom + gap + panelHeight <= viewportHeight.value - margin
  if (fitsBelow) {
    return {
      left: `${Math.min(viewportWidth.value - panelWidth - margin, Math.max(margin, rect.left))}px`,
      top: `${rect.bottom + gap}px`,
    }
  }

  return {
    left: `${Math.min(viewportWidth.value - panelWidth - margin, Math.max(margin, rect.left))}px`,
    top: `${Math.max(margin, rect.top - panelHeight - gap)}px`,
  }
})

function updateViewport() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

function updateTargetRect() {
  updateViewport()
  if (!props.active || !activeStep.value) {
    if (activeTarget) {
      activeTarget.removeAttribute('data-guide-active')
      activeTarget = null
    }
    if (activeScope) {
      activeScope.removeAttribute('data-guide-scope-active')
      activeScope = null
    }
    targetRect.value = null
    return
  }

  const target = document.querySelector(activeStep.value.selector) as HTMLElement | null
  if (!target) {
    if (activeTarget) {
      activeTarget.removeAttribute('data-guide-active')
      activeTarget = null
    }
    if (activeScope) {
      activeScope.removeAttribute('data-guide-scope-active')
      activeScope = null
    }
    targetRect.value = null
    return
  }

  if (activeTarget && activeTarget !== target) {
    activeTarget.removeAttribute('data-guide-active')
  }
  activeTarget = target
  activeTarget.setAttribute('data-guide-active', 'true')

  const nextScope = target.closest('[data-guide-scope]') as HTMLElement | null
  if (activeScope && activeScope !== nextScope) {
    activeScope.removeAttribute('data-guide-scope-active')
  }
  activeScope = nextScope
  activeScope?.setAttribute('data-guide-scope-active', 'true')

  target.scrollIntoView({
    behavior: 'smooth',
    block: isMobile.value ? 'start' : 'center',
    inline: 'nearest',
  })
  targetRect.value = target.getBoundingClientRect()
}

function closeGuide() {
  if (activeTarget) {
    activeTarget.removeAttribute('data-guide-active')
    activeTarget = null
  }
  if (activeScope) {
    activeScope.removeAttribute('data-guide-scope-active')
    activeScope = null
  }
  targetRect.value = null
  emit('close')
}

function goNext() {
  if (canGoForward.value) {
    activeIndex.value += 1
    return
  }
  closeGuide()
}

function goBack() {
  if (canGoBack.value) activeIndex.value -= 1
}

watch(
  () => props.active,
  (active) => {
    if (!active) return
    activeIndex.value = 0
    requestAnimationFrame(updateTargetRect)
  },
)

watch(activeIndex, () => {
  requestAnimationFrame(updateTargetRect)
})

onMounted(() => {
  window.addEventListener('resize', updateTargetRect)
  window.addEventListener('scroll', updateTargetRect, true)
  if (props.active) requestAnimationFrame(updateTargetRect)
})

onBeforeUnmount(() => {
  if (activeTarget) {
    activeTarget.removeAttribute('data-guide-active')
    activeTarget = null
  }
  if (activeScope) {
    activeScope.removeAttribute('data-guide-scope-active')
    activeScope = null
  }
  window.removeEventListener('resize', updateTargetRect)
  window.removeEventListener('scroll', updateTargetRect, true)
})
</script>

<template>
  <transition name="guide-fade">
    <section
      v-if="active"
      class="guide"
      :class="{ 'is-mobile': isMobile }"
      aria-label="ShiftAudio walkthrough guide"
    >
      <div class="guide__backdrop" />

      <div
        class="guide__panel"
        :style="panelStyle"
      >
        <div class="guide__eyebrow">
          Walkthrough {{ activeIndex + 1 }} of {{ steps.length }}
        </div>
        <h2>{{ activeStep?.title }}</h2>
        <p>{{ activeStep?.body }}</p>
        <div v-if="activeStep?.actionLabel && activeStep?.actionBody" class="guide__action-note">
          <div class="guide__action-label">{{ activeStep.actionLabel }}</div>
          <div class="guide__action-body">{{ activeStep.actionBody }}</div>
        </div>

        <div class="guide__actions">
          <button class="btn btn-secondary" type="button" :disabled="!canGoBack" @click="goBack">
            Back
          </button>
          <button class="btn" type="button" @click="closeGuide">Close</button>
          <button class="btn guide__primary" type="button" @click="goNext">
            {{ canGoForward ? 'Next step' : 'Finish walkthrough' }}
          </button>
        </div>
      </div>
    </section>
  </transition>
</template>

<style scoped>
.guide {
  position: fixed;
  inset: 0;
  z-index: 500;
}

.guide__backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(4px);
}

.guide__panel {
  position: fixed;
  z-index: 3;
  width: min(360px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px;
  background: var(--surface-strong);
  box-shadow: var(--shadow);
  overflow-y: auto;
}

.guide__eyebrow {
  margin-bottom: 8px;
  color: rgba(3, 105, 161, 0.88);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.guide__action-note {
  margin-top: 14px;
  padding: 12px 13px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 14px;
  background: rgba(240, 249, 255, 0.9);
}

.guide__action-label {
  margin-bottom: 4px;
  color: rgba(3, 105, 161, 0.9);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.guide__action-body {
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}

.guide__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.guide__primary {
  background: var(--surface-strong);
}

.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity 160ms ease;
}

.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}

:global([data-guide-active='true']) {
  position: relative;
  z-index: 501;
  border-radius: 22px;
  box-shadow:
    0 0 0 3px rgba(56, 189, 248, 0.92),
    0 16px 32px rgba(15, 23, 42, 0.16);
}

:global([data-guide-scope-active='true']) {
  position: relative;
  z-index: 501;
}

@media (max-width: 980px) {
  .guide__backdrop {
    background: rgba(15, 23, 42, 0.16);
    backdrop-filter: none;
  }

  .guide__panel {
    width: auto;
    max-height: min(48vh, 420px);
    border-radius: 16px;
    padding: 16px;
  }

  h2 {
    font-size: 1.05rem;
  }

  p {
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .guide__actions {
    gap: 8px;
  }

  .guide__actions .btn {
    flex: 1 1 120px;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .guide__panel {
    width: auto;
    max-height: min(50vh, 420px);
    padding: 14px;
  }

  .guide__action-note {
    padding: 10px 11px;
  }

  .guide__action-body {
    font-size: 13px;
  }

  :global([data-guide-active='true']) {
    border-radius: 16px;
    box-shadow:
      0 0 0 2px rgba(56, 189, 248, 0.88),
      0 10px 18px rgba(15, 23, 42, 0.1);
  }
}
</style>
