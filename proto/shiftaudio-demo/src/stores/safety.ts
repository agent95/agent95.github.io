// src/stores/safety.ts
import { defineStore } from "pinia";
import type { Cadence } from "@/types/domain";

export const useSafetyStore = defineStore("safety", {
  state: () => ({
    cadence: "standard" as Cadence,
    safetyOnCrossfade: true,
  }),
  actions: {
    setCadence(v: Cadence) {
      this.cadence = v;
    },
    setSafetyOnCrossfade(v: boolean) {
      this.safetyOnCrossfade = v;
    },
  },
});