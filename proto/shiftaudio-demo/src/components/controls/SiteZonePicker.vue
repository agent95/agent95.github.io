<!-- src/components/controls/SiteZonePicker.vue -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSystemStore } from "@/stores/system";

const system = useSystemStore();
const { site, zones, zoneId } = storeToRefs(system);

function onZoneChange(e: Event) {
  system.setZone((e.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="wrap">
    <div class="site">{{ site.name }}</div>
    <div class="sep">/</div>
    <label class="lbl">
      Zone
      <select class="sel" :value="zoneId" @change="onZoneChange">
        <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.wrap{ display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }
.site{ font-weight: 700; }
.sep{ opacity: .45; }
.lbl{ display:flex; align-items:center; gap: 6px; font-size: 12px; opacity:.9; }
.sel{
  padding: 6px 8px; border-radius: 10px;
  border: 1px solid rgba(0,0,0,.18);
  background: rgba(255,255,255,.9);
}
</style>