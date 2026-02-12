<script setup lang="ts">
import { computed, ref } from 'vue'
import CardFrame from './CardFrame.vue'
import { storeToRefs } from 'pinia'
import { useLogStore } from '@/stores/log'
import { playSequence } from '@/services/messageAudio'

const log = useLogStore()
const { rows } = storeToRefs(log)

// simple local debug state
const showSkipped = computed({
  get: () => (log as any)._debugShowSkipped ?? false,
  set: (v: boolean) => {
    ;(log as any)._debugShowSkipped = v
  },
})

const debugRows = computed(() => {
  if (!showSkipped.value) return rows.value.slice(0, 15)
  return rows.value.filter((r) => r.result === 'SKIPPED').slice(0, 15)
})

// error capture for native handler crashes
const lastError = ref<string>('')

async function testMessage() {
  await playSequence({
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/speech.wav',
  })
}

// async function testSpeech() {
//   lastError.value = ''

//   try {
//     // MUST be called from a user click, so do it here:
//     announceEngine.enableFromUserGesture()
//     await announceEngine.speak('Test announcement. ShiftAudio safety first.', {
//       volume: 1,
//       rate: 1,
//     })
//   } catch (e: any) {
//     lastError.value = e?.message ?? String(e)
//     // Also log it so it shows in your log table:
//     log.append({
//       tsIso: new Date().toISOString(),
//       siteId: 'demo-site',
//       zoneId: 'packing-a',
//       message: 'Test announcement',
//       priority: 'P1_SAFETY',
//       deliveryMode: 'immediate',
//       result: 'FAILED',
//       reason: lastError.value,
//     })
//   }
// }
</script>

<template>
  <CardFrame title="Debug Panel" subtitle="Engineering signals (demo)">
    <div class="row">
      <label class="toggle">
        <input type="checkbox" v-model="showSkipped" />
        <span>Show skipped messages</span>
      </label>

      <button class="btn" @click="testMessage">Test Message Audio</button>
    </div>

    <div v-if="lastError" class="err">
      {{ lastError }}
    </div>

    <div class="feed">
      <div v-for="r in debugRows" :key="r.tsIso + r.message" class="ev">
        <div class="top">
          <span class="ts">{{ r.tsIso }}</span>
          <span class="res">{{ r.result }}</span>
        </div>
        <div class="msg">{{ r.message }}</div>
        <div v-if="r.reason" class="reason">{{ r.reason }}</div>
      </div>

      <div v-if="!debugRows.length" class="empty">No debug events.</div>
    </div>
  </CardFrame>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  user-select: none;
}
.feed {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}
.ev {
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.6);
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  opacity: 0.8;
}
.msg {
  font-weight: 800;
  font-size: 12px;
  margin-top: 2px;
}
.reason {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}
.empty {
  opacity: 0.7;
  font-size: 13px;
}
.err {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: rgba(120, 20, 20, 0.92);
  font-size: 12px;
}
</style>
