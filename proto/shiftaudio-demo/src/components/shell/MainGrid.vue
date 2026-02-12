<!-- src/components/shell/MainGrid.vue -->
<template>
  <div class="grid">
    <section class="col"><slot name="left" /></section>
    <section class="col"><slot name="right" /></section>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr; /* left slightly bigger */
  gap: 16px;
  align-items: start;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.col {
  display: grid;
  gap: 16px;
}
</style>
