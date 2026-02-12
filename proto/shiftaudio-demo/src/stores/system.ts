// src/stores/system.ts
import { defineStore } from 'pinia'
import type {
  SystemStatus,
  SafetyMode,
  NetworkStatus,
  AudioEngineStatus,
  Site,
  Zone,
} from '@/types/domain'

export const useSystemStore = defineStore('system', {
  state: () => ({
    status: 'OPERATIONAL' as SystemStatus,
    safetyMode: 'ACTIVE' as SafetyMode,
    network: 'OK' as NetworkStatus,
    audioEngine: 'READY' as AudioEngineStatus,

    site: { id: 'demo-site', name: 'Demo Warehouse' } as Site,
    zones: [{ id: 'main', name: 'Main Zone' }] as Zone[],
    zoneId: 'main',
  }),

  getters: {
    zone(state) {
      return state.zones.find((z) => z.id === state.zoneId) ?? state.zones[0]
    },
  },

  actions: {
    setZone(zoneId: string) {
      this.zoneId = zoneId
    },
    setDegraded(reason?: string) {
      this.status = 'DEGRADED'
      void reason
    },
  },
})
