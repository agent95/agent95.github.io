<!-- src/components/controls/CadenceSelect.vue -->
<script setup lang="ts">
import type { Cadence } from "@/types/domain";

const model = defineModel<Cadence>({ required: true });

const cadenceLabel: Record<Cadence, string> = {
  low: "Low (20 min)",
  standard: "Standard (10 min)",
  high: "High (5 min)",
};
</script>

<template>
  <label class="lbl">
    Cadence
    <select class="sel" v-model="model">
      <option value="low">{{ cadenceLabel.low }}</option>
      <option value="standard">{{ cadenceLabel.standard }}</option>
      <option value="high">{{ cadenceLabel.high }}</option>
    </select>
  </label>
</template>

<style scoped>
.lbl{ display:flex; align-items:center; gap: 6px; font-size: 12px; }
.sel{
  padding: 6px 8px; border-radius: 10px;
  border: 1px solid rgba(0,0,0,.18);
  background: rgba(255,255,255,.9);
}
</style>
