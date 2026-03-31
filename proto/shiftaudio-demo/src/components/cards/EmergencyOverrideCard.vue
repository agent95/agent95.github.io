<!-- src/components/cards/EmergencyOverrideCard.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import CardFrame from './CardFrame.vue'
import { useAnnouncementsStore } from '@/stores/announcements'
import { useSystemStore } from '@/stores/system'

const ann = useAnnouncementsStore()
const system = useSystemStore()
const { emergency, activeDeliveries } = storeToRefs(ann)

const isBusy = ref(false)
const lastError = ref<string>('')

const zoneLabel = computed(() => {
  return system.zone?.name ?? system.zoneId ?? '—'
})

async function onEmergencyClick() {
  if (isBusy.value) return
  if (emergency.value.active && activeDeliveries.value > 0) return
  isBusy.value = true
  lastError.value = ''

  try {
    if (emergency.value.active) {
      await ann.endEmergency()
    } else {
      await ann.triggerEmergency('Emergency Stop')
    }
  } catch (e: any) {
    lastError.value = e?.message ?? 'Emergency action failed.'
    console.error('[EmergencyOverrideCard]', e)
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <CardFrame title="Emergency Override" subtitle="Immediate audio override for critical incidents">
    <button
      class="btn btn-danger"
      :class="{ active: emergency.active }"
      :disabled="isBusy || (emergency.active && activeDeliveries > 0)"
      @click="onEmergencyClick"
    >
      <span v-if="isBusy">SENDING…</span>
      <span v-else-if="emergency.active && activeDeliveries > 0">EMERGENCY PLAYING…</span>
      <span v-else>
        {{ emergency.active ? 'END EMERGENCY' : 'ANNOUNCE EMERGENCY' }}
      </span>
    </button>

    <p v-if="lastError" class="err">
      {{ lastError }}
    </p>

    <div class="meta">
      <div class="row">
        <div class="k">Zone</div>
        <div class="v">{{ zoneLabel }}</div>
      </div>

      <div class="row">
        <div class="k">
          {{ emergency.active ? 'Emergency Started' : 'Last Emergency' }}
        </div>
        <div class="v">
          {{ emergency.lastTriggeredAtIso || '—' }}
        </div>
      </div>
    </div>
  </CardFrame>
</template>

<style scoped>
.btn {
  width: 100%;
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.22);
  background: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.btn:hover {
  border-color: rgba(0, 0, 0, 0.35);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Emergency emphasis */
.btn-danger {
  background: rgba(255, 0, 0, 0.08);
  border-color: rgba(255, 0, 0, 0.35);
}

.btn-danger.active {
  background: rgba(255, 0, 0, 0.18);
  border-color: rgba(255, 0, 0, 0.55);
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.45);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(255, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
}

.meta {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.k {
  font-size: 12px;
  opacity: 0.75;
}

.v {
  font-weight: 800;
  font-size: 12px;
}

.err {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 0, 0, 0.08);
  border: 1px solid rgba(255, 0, 0, 0.18);
}
</style>
