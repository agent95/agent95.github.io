<!-- src/components/shell/AppShell.vue -->
<template>
  <div class="app-shell">
    <div class="brandbar"><slot name="brandbar" /></div>
    <!-- <div class="topbar"><slot name="topbar" /></div> -->
    <main class="main"><slot /></main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.brandbar,
.topbar {
  position: sticky;
  z-index: 50;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
}

.brandbar {
  top: 0;
}
.topbar {
  top: 70px;
} /* adjust to your BrandBar height */

.main {
  padding: 18px;
  max-width: 1280px;
  margin: 0 auto;
}
</style>
