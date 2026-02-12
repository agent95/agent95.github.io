<!-- src/components/status/ClockBadge.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useDemoClockStore } from "@/stores/demoClock";
import { useNowLabel } from "@/composables/useNowLabel";

const props = defineProps<{ mode: "demo" | "prod" }>();
const clock = useDemoClockStore();
const { nowMin, realNowTick } = storeToRefs(clock);

const label = computed(() => {
  void realNowTick.value;
  return useNowLabel(props.mode, nowMin.value);
});
</script>

<template>
  <div class="chip">
    <span class="k">Clock</span>
    <span class="v">{{ label }}</span>
  </div>
</template>

<style scoped>
.chip{
  display:flex; align-items:center; gap: 8px;
  padding: 6px 10px; border-radius: 999px;
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(255,255,255,.75);
  font-size: 12px;
}
.k{ opacity:.7; }
.v{ font-weight: 700; }
</style>
