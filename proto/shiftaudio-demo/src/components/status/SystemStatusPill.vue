<!-- src/components/status/SystemStatusPill.vue -->
<script setup lang="ts">
import type { SystemStatus, SafetyMode } from '@/types/domain'

const props = defineProps<{
  status: SystemStatus
  safetyMode: SafetyMode
}>()

function tone() {
  if (props.status === 'OFFLINE') return 'bad'
  if (props.status === 'DEGRADED') return 'warn'
  return 'ok'
}
</script>

<template>
  <div class="pill" :data-tone="tone()">
    <span class="dot" />
    <span class="txt">System: {{ status }}</span>
    <span class="sep">•</span>
    <span class="txt">Safety: {{ safetyMode }}</span>
  </div>
</template>

<style scoped>
.pill {
  display: flex;
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
  width: 9px;
  height: 9px;
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
.sep {
  opacity: 0.5;
}
</style>
