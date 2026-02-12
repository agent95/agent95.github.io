// src/stores/log.ts
import { defineStore } from "pinia";
import type { LogRow, LogResult } from "@/types/domain";

export const useLogStore = defineStore("log", {
  state: () => ({
    rows: [] as LogRow[],
    filter: {
      result: "ALL" as "ALL" | LogResult,
      query: "",
    },
  }),
  getters: {
    filtered(state): LogRow[] {
      const q = state.filter.query.trim().toLowerCase();
      return state.rows.filter(r => {
        const okResult = state.filter.result === "ALL" ? true : r.result === state.filter.result;
        const okQuery =
          !q ||
          r.message.toLowerCase().includes(q) ||
          r.priority.toLowerCase().includes(q) ||
          r.deliveryMode.toLowerCase().includes(q) ||
          (r.reason ?? "").toLowerCase().includes(q);
        return okResult && okQuery;
      });
    },
  },
  actions: {
    append(row: LogRow) {
      this.rows.unshift(row);
      if (this.rows.length > 500) this.rows.pop();
    },
    setResultFilter(v: "ALL" | LogResult) {
      this.filter.result = v;
    },
    setQuery(v: string) {
      this.filter.query = v;
    },
  },
});