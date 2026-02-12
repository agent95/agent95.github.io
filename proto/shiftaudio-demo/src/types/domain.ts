// src/types/domain.ts
export type SystemStatus = "OPERATIONAL" | "DEGRADED" | "OFFLINE";
export type SafetyMode = "ACTIVE" | "PAUSED";
export type NetworkStatus = "OK" | "DEGRADED" | "LOST";
export type AudioEngineStatus = "READY" | "STARTING" | "ERROR";

export type Cadence = "low" | "standard" | "high";

export type Priority = "P0_EMERGENCY" | "P1_SAFETY" | "P2_OPS";
export type DeliveryMode = "crossfade" | "immediate" | "scheduled";
export type DeliveryState = "QUEUED" | "DUE" | "DELIVERING" | "DELIVERED" | "SKIPPED";

export type DemoScenario = "normal" | "scheduled" | "emergency" | "network";

export type BedPlaylist = "calm" | "focus" | "push" | "recover";

export type LogResult = "DELIVERED" | "SKIPPED" | "FAILED";

export interface Zone {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
}

export interface Announcement {
  id: string;
  name: string;
  priority: Priority;
  deliveryMode: DeliveryMode;
  scheduledAtMin: number; // minutes since midnight
  state: DeliveryState;
  reason?: string;
}

export interface LogRow {
  tsIso: string;
  siteId: string;
  zoneId: string;
  message: string;
  priority: Priority;
  deliveryMode: DeliveryMode;
  result: LogResult;
  reason?: string;
}
