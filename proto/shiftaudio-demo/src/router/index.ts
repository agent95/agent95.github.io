// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import DemoView from "@/views/DemoView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", name: "demo", component: DemoView }],
});