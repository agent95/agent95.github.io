<!-- src/components/cards/SystemHealthCard.vue -->
<script setup lang="ts">
import CardFrame from './CardFrame.vue'
import { storeToRefs } from 'pinia'
import { useSystemStore } from '@/stores/system'

defineProps<{
  onReplayIntro?: () => void
  onStartGuide?: () => void
}>()

const system = useSystemStore()
const { status, network, audioEngine, safetyMode } = storeToRefs(system)

function tone(v: string) {
  if (v === 'OFFLINE' || v === 'LOST' || v === 'ERROR') return 'bad'
  if (v === 'DEGRADED' || v === 'STARTING') return 'warn'
  return 'ok'
}

async function resetPwaCache() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }

    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.delete('intro')
    window.location.replace(nextUrl.toString())
  } catch (e) {
    console.warn('[PWA] reset failed', e)
  }
}
</script>

<template>
  <CardFrame title="System Health" subtitle="Operational signals for the demo">
    <div class="pills">
      <div class="pill" :data-tone="tone(status)">
        <span class="dot" />
        <span class="txt">System: {{ status }}</span>
      </div>

      <div class="pill" :data-tone="tone(safetyMode)">
        <span class="dot" />
        <span class="txt">Safety: {{ safetyMode }}</span>
      </div>

      <div class="pill" :data-tone="tone(network)">
        <span class="dot" />
        <span class="txt">Network: {{ network }}</span>
      </div>

      <div class="pill" :data-tone="tone(audioEngine)">
        <span class="dot" />
        <span class="txt">Audio: {{ audioEngine }}</span>
      </div>
    </div>

    <div class="actions">
      <div class="intro-controls">
        <div class="intro-badge" aria-label="Intro loaded">
          <span class="intro-badge-dot" />
          <span>Intro Loaded</span>
        </div>
        <button class="intro-replay" type="button" @click="onReplayIntro?.()">Replay Intro</button>
        <button class="guide-launch" type="button" @click="onStartGuide?.()">
          Guided Walkthrough
        </button>
      </div>
      <button class="reset" type="button" @click="resetPwaCache">Reset PWA Cache</button>
    </div>
  </CardFrame>
</template>

<style scoped>
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  backdrop-filter: blur(12px);
  font-size: 12px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ok);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

[data-tone='warn'] .dot {
  background: var(--warn);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.14);
}
[data-tone='bad'] .dot {
  background: var(--bad);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}
.txt {
  font-weight: 700;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.intro-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.intro-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(22, 163, 74, 0.18);
  border-radius: 999px;
  color: #0f172a;
  background: rgba(240, 253, 244, 0.95);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.intro-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ok);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}
.intro-replay,
.guide-launch,
.reset {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.intro-replay {
  border-color: rgba(14, 116, 144, 0.24);
  color: #082f49;
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.95), rgba(56, 189, 248, 0.88));
  box-shadow: 0 12px 24px rgba(14, 116, 144, 0.16);
}
.intro-replay:hover,
.guide-launch:hover,
.reset:hover {
  border-color: rgba(0, 0, 0, 0.3);
}
.intro-replay:hover {
  border-color: rgba(14, 116, 144, 0.38);
}

.guide-launch {
  border-color: rgba(194, 65, 12, 0.28);
  color: #7c2d12;
  background: rgba(255, 237, 213, 0.94);
}

.guide-launch:hover {
  border-color: rgba(194, 65, 12, 0.4);
}
</style>
