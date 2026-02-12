<!-- src/components/cards/AnnouncementLogCard.vue -->
<script setup lang="ts">
import CardFrame from './CardFrame.vue'
import LogTable from '@/components/log/LogTable.vue'
import { storeToRefs } from 'pinia'
import { useLogStore } from '@/stores/log'

const log = useLogStore()
const { filtered, filter } = storeToRefs(log)

function exportCsv() {
  const rows = filtered.value
  const header = [
    'tsIso',
    'siteId',
    'zoneId',
    'message',
    'priority',
    'deliveryMode',
    'result',
    'reason',
  ]
  const csv = [
    header.join(','),
    ...rows.map((r) => header.map((k) => JSON.stringify((r as any)[k] ?? '')).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shiftaudio-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <CardFrame
    title="Announcement Log"
    subtitle="Auditable record of delivery outcomes • Retention: 30 days"
  >
    <template #actions>
      <button class="btn" @click="exportCsv">Export CSV</button>
    </template>

    <div class="filters">
      <label class="lbl">
        Result
        <select
          class="sel"
          :value="filter.result"
          @change="log.setResultFilter(($event.target as HTMLSelectElement).value as any)"
        >
          <option value="ALL">All</option>
          <option value="DELIVERED">Delivered</option>
          <option value="SKIPPED">Skipped</option>
          <option value="FAILED">Failed</option>
        </select>
      </label>

      <input
        class="search"
        type="text"
        :value="filter.query"
        @input="log.setQuery(($event.target as HTMLInputElement).value)"
        placeholder="Search message / reason…"
      />
    </div>

    <LogTable :rows="filtered" />
  </CardFrame>
</template>

<style scoped>
.btn {
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}
.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.lbl {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.sel {
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
}
.search {
  flex: 1;
  min-width: 180px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.9);
}
</style>
