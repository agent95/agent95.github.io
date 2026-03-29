<!-- src/components/cards/CardFrame.vue -->
<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="card">
    <header class="hdr">
      <div>
        <div class="title">{{ title }}</div>
        <div v-if="subtitle" class="sub">{{ subtitle }}</div>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </header>
    <div class="body"><slot /></div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 14px;
  background: var(--surface);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow);
}

.hdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  margin-bottom: 12px;
}

.title {
  font-weight: 900;
  letter-spacing: -0.02em;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.actions :deep(button) {
  /* let buttons look consistent if you used local styles elsewhere */
  border-radius: 12px;
}
.body {
  display: block;
}

@media (max-width: 640px) {
  .card {
    padding: 12px;
  }

  .hdr {
    flex-wrap: wrap;
  }

  .actions {
    width: 100%;
  }
}
</style>
