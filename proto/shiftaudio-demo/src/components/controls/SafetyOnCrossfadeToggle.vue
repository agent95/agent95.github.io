<!-- src/components/controls/SafetyOnCrossfadeToggle.vue -->
<script setup lang="ts">
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="toggle">
    <input type="checkbox" v-model="model" />
    <span>Deliver safety on crossfade</span>
  </label>
</template>

<style scoped>
.toggle{ display:flex; align-items:center; gap: 8px; font-size: 12px; user-select:none; }
input{ width: 16px; height: 16px; }
</style>