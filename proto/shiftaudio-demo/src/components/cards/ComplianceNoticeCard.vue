<!-- src/components/cards/ComplianceNoticeCard.vue -->
<script setup lang="ts">
import CardFrame from "./CardFrame.vue";
</script>

<template>
  <CardFrame title="Compliance Notice">
    <div class="txt">
      ShiftAudio supports workplace communication and does not replace emergency alarms
      or evacuation systems.
    </div>
  </CardFrame>
</template>

<style scoped>
.txt{ font-size: 13px; line-height: 1.35; opacity: .9; }
</style>