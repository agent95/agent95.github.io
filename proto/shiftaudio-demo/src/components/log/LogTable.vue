<!-- src/components/log/LogTable.vue -->
<script setup lang="ts">
import type { LogRow } from '@/types/domain'

defineProps<{ rows: LogRow[] }>()

function shortTs(iso: string) {
  // Local time HH:MM:SS
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
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
        <div class="meta">
          <span class="chip">{{ r.siteId }}</span>
          <span class="chip">{{ r.zoneId }}</span>
        </div>
        <div v-if="r.reason" class="reason">{{ r.reason }}</div>
      </div>

      <div class="p">{{ r.priority }}</div>
      <div class="d">{{ r.deliveryMode }}</div>
      <div class="r" :class="`res-${r.result.toLowerCase()}`">
        {{ r.result }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.res-delivered {
  color: rgba(12, 18, 28, 0.65);
  font-weight: 600;
}

.res-skipped,
.res-failed {
  color: var(--bad);
  font-weight: 800;
}
.table {
  display: grid;
  gap: 8px;
}
.hdr {
  display: grid;
  grid-template-columns: 70px 1fr 120px 90px 90px;
  gap: 10px;
  font-size: 11px;
  opacity: 0.7;
  padding: 0 6px;
}
.row {
  display: grid;
  grid-template-columns: 70px 1fr 120px 90px 90px;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.6);
  align-items: start;
}
.t {
  font-weight: 800;
  font-size: 12px;
}
.m {
  min-width: 0;
}
.msg {
  font-weight: 800;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  opacity: 0.85;
}
.reason {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}
.p,
.d,
.r {
  font-size: 12px;
  font-weight: 800;
}
.empty {
  opacity: 0.7;
  font-size: 13px;
  padding: 10px;
}

@media (max-width: 980px) {
  .hdr,
  .row {
    grid-template-columns: 60px 1fr 110px 80px 80px;
  }
}

@media (max-width: 640px) {
  .hdr {
    display: none;
  }

  .row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .t,
  .p,
  .d,
  .r {
    font-size: 11px;
  }

  .t {
    opacity: 0.75;
  }

  .msg {
    white-space: normal;
  }
}
</style>
