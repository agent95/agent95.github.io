// src/stores/demoClock.ts
import { defineStore } from "pinia";

function nowMinReal(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export const useDemoClockStore = defineStore("demoClock", {
  state: () => ({
    mode: "prod" as "demo" | "prod",
    simNowMin: nowMinReal(),
    realNowMin: nowMinReal(),
    realNowTick: Date.now(),
  }),
  getters: {
    nowMin(state) {
      return state.mode === "demo" ? state.simNowMin : state.realNowMin;
    },
  },
  actions: {
    setMode(mode: "demo" | "prod") {
      this.mode = mode;
    },
    tickSim(deltaMin = 1) {
      if (this.mode !== "demo") return;
      this.simNowMin = (this.simNowMin + deltaMin) % (24 * 60);
    },
    setSimNowMin(v: number) {
      this.simNowMin = Math.max(0, Math.min(24 * 60 - 1, v));
    },
    tickReal() {
      this.realNowMin = nowMinReal();
      this.realNowTick = Date.now();
    },
  },
});
