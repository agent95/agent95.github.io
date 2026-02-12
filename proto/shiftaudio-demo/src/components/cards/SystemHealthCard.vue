<!-- src/components/cards/SystemHealthCard.vue -->
<script setup lang="ts">
import CardFrame from './CardFrame.vue'
import { storeToRefs } from 'pinia'
import { useSystemStore } from '@/stores/system'

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
    window.location.reload()
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
  margin-top: 12px;
}
.reset {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.reset:hover {
  border-color: rgba(0, 0, 0, 0.3);
}
</style>
