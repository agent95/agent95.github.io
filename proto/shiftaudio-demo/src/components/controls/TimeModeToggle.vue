<!-- src/components/controls/TimeModeToggle.vue -->
<script setup lang="ts">
const model = defineModel<'demo' | 'prod'>({ required: true })
</script>

<template>
  <div class="tabs">
    <button
      class="tab"
      :class="{ active: model === 'prod' }"
      type="button"
      @click="model = 'prod'"
    >
      Realtime
    </button>
    <button
      class="tab"
      :class="{ active: model === 'demo' }"
      type="button"
      @click="model = 'demo'"
    >
      Demo
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.8);
}
.tab {
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  color: rgba(12, 18, 28, 0.75);
}
.tab:hover {
  color: rgba(12, 18, 28, 0.95);
}
.tab.active {
  border-color: rgba(0, 0, 0, 0.9);
  background: rgba(0, 0, 0, 0.92);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}
</style>
