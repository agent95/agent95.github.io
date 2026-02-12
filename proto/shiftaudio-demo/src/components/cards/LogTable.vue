<!-- src/components/log/LogTable.vue -->
<script setup lang="ts">
import type { LogRow } from "@/types/domain";

defineProps<{ rows: LogRow[] }>();

function shortTs(iso: string) {
  // "HH:MM:SS" (local)
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
</script>

<template>
  <div class="table">
    <div class="hdr">
      <div>Time</div>
      <div>Message</div>
      <div>Priority</div>
      <div>Delivery</div>
      <div>Result</div>
    </div>

    <div v-if="!rows.length" class="empty">No log entries yet.</div>

    <div v-for="r in rows" :key="r.tsIso + r.message" class="row">
      <div class="t">{{ shortTs(r.tsIso) }}</div>
      <div class="m">
        <div class="msg">{{ r.message }}</div>
        <div v-if="r.reason" class="reason">{{ r.reason }}</div>
      </div>
      <div class="p">{{ r.priority }}</div>
      <div class="d">{{ r.deliveryMode }}</div>
      <div class="r">{{ r.result }}</div>
    </div>
  </div>
</template>

<style scoped>
.table{ display:grid; gap: 8px; }
.hdr{
  display:grid;
  grid-template-columns: 70px 1fr 110px 90px 90px;
  gap: 10px;
  font-size: 11px;
  opacity:.7;
  padding: 0 6px;
}
.row{
  display:grid;
  grid-template-columns: 70px 1fr 110px 90px 90px;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.10);
  background: rgba(255,255,255,.6);
  align-items:start;
}
.t{ font-weight: 800; font-size: 12px; }
.msg{ font-weight: 700; font-size: 12px; }
.reason{ font-size: 11px; opacity:.7; margin-top: 2px; }
.p,.d,.r{ font-size: 12px; font-weight: 700; }
.empty{ opacity:.7; font-size: 13px; padding: 10px; }
@media (max-width: 980px){
  .hdr,.row{ grid-template-columns: 60px 1fr 100px 90px 80px; }
}
</style>