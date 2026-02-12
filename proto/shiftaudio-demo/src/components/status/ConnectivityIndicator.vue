<!-- src/components/status/ConnectivityIndicator.vue -->
<script setup lang="ts">
import type { NetworkStatus, AudioEngineStatus } from "@/types/domain";

defineProps<{
  network: NetworkStatus;
  audioEngine: AudioEngineStatus;
}>();

function dotTone(v: string) {
  if (v === "LOST" || v === "ERROR") return "bad";
  if (v === "DEGRADED" || v === "STARTING") return "warn";
  return "ok";
}
</script>

<template>
  <div class="wrap">
    <div class="chip">
      <span class="dot" :data-tone="dotTone(network)" />
      <span>Network: {{ network }}</span>
    </div>
    <div class="chip">
      <span class="dot" :data-tone="dotTone(audioEngine)" />
      <span>Audio: {{ audioEngine }}</span>
    </div>
  </div>
</template>

<style scoped>
.wrap{ display:flex; gap: 8px; flex-wrap: wrap; }
.chip{
  display:flex; align-items:center; gap: 6px;
  padding: 6px 8px; border-radius: 999px;
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(255,255,255,.75);
  font-size: 12px;
}
.dot{ width: 8px; height: 8px; border-radius: 999px; background: #2a7; }
[data-tone="warn"]{ background:#db0; }
[data-tone="bad"]{ background:#d44; }
</style>