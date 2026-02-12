<!-- src/components/shell/TopBar.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'

import ConnectivityIndicator from '@/components/status/ConnectivityIndicator.vue'

import { useSystemStore } from '@/stores/system'
import { useAnnouncementsStore } from '@/stores/announcements'

const system = useSystemStore()
const announcements = useAnnouncementsStore()

const { network, audioEngine } = storeToRefs(system)
const { safety: safetyStatus } = storeToRefs(announcements)

function fmtTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="bar">
    <div class="left">
      <!-- <ConnectivityIndicator :network="network" :audioEngine="audioEngine" /> -->
    </div>

    <div class="right">
      <div class="chip chip-primary" :title="safetyStatus.lastDeliveredName || ''">
        <span class="k">Last Safety</span>
        <span class="v">
          {{ safetyStatus.lastDeliveredAtIso ? fmtTime(safetyStatus.lastDeliveredAtIso) : '—' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px; /* tighter */
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(12px);
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 8px; /* tighter */
  flex-wrap: wrap;
}

.sep {
  width: 1px;
  height: 18px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 2px; /* subtle visual grouping without spacing bloat */
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px; /* tighter */
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.68);
  line-height: 1;
}

.chip-primary {
  border-color: rgba(0, 160, 80, 0.32);
  background: rgba(0, 160, 80, 0.075);
}

.k {
  font-size: 11px; /* tighter */
  opacity: 0.75;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.v {
  font-size: 12px;
  font-weight: 900;
}
</style>
