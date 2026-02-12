<script setup lang="ts">
import { ref } from 'vue'

const open = ref(true)

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <div class="demo" :class="{ closed: !open }">
    <div class="header">
      <div class="title">
        <span class="badge">DEMO MODE</span>
        <span class="label">How to run this demo</span>
      </div>

      <button class="toggle" @click="toggle">
        {{ open ? 'Hide' : 'Show' }}
      </button>
    </div>

    <div v-if="open" class="steps">
      <div class="step">
        <span class="n">1</span>
        <span>Click <b>Play</b> to start background audio</span>
      </div>

      <div class="step">
        <span class="n">2</span>
        <span>Use <b>Deliver Immediately</b> to play a safety message</span>
      </div>

      <div class="step">
        <span class="n">3</span>
        <span>Enable <b>Crossfade</b> to hear scheduled delivery</span>
      </div>

      <div class="step">
        <span class="n danger">!</span>
        <span>Press <b>Emergency Announce</b> to trigger override</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(10px);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
}

.label {
  font-size: 13px;
  font-weight: 700;
}

.toggle {
  font-size: 12px;
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
}

.toggle:hover {
  opacity: 1;
}

.steps {
  display: grid;
  gap: 8px;
  padding: 0 16px 12px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.n {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
}

.n.danger {
  background: rgba(255, 0, 0, 0.15);
  color: #a00000;
}

.closed .steps {
  display: none;
}
</style>
