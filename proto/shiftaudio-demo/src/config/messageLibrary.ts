// src/config/messageLibrary.ts
import type { Priority } from '@/types/domain'

export type MessageKey =
  | 'shift_start'
  | 'shift_end'
  | 'safety_tip'
  | 'forklift_awareness'
  | 'emergency_stop'
  | 'break_start'
  | 'break_end'

export type MessageSpec = {
  key: MessageKey
  label: string
  priority: Priority

  /** Optional attention tone before message */
  toneUrl?: string

  /** Main audio file */
  audioUrl: string

  /** Optional follow-up audio file */
  followUpUrl?: string

  /** Volume 0..1 for message */
  volume?: number

  /** Duck level 0..1 (0.1 = heavy duck) */
  duckLevel?: number
}

export const messageLibrary: Record<MessageKey, MessageSpec> = {
  shift_start: {
    key: 'shift_start',
    label: 'Shift Start Safety Brief',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/safety/shift-start.wav',
    volume: 1,
    duckLevel: 0.25,
  },
  shift_end: {
    key: 'shift_end',
    label: 'Shift ended',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/shiftend/shift-end.wav',
    volume: 1,
    duckLevel: 0.25,
  },
  safety_tip: {
    key: 'safety_tip',
    label: 'Stay Hydrated',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/safety/stay-hydrated.wav',
    volume: 1,
    duckLevel: 0.25,
  },
  forklift_awareness: {
    key: 'forklift_awareness',
    label: 'Forklift Awareness',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/safety/forklift-awareness.wav',
    volume: 1,
    duckLevel: 0.25,
  },
  emergency_stop: {
    key: 'emergency_stop',
    label: 'Emergency Stop',
    priority: 'P0_EMERGENCY',

    // Step 1: attention tone
    toneUrl: '/messages/tones/attention.wav',

    // Step 2: emergency alarm tone
    audioUrl: '/messages/tones/emergency.wav',

    // Step 3: spoken emergency instruction
    followUpUrl: '/messages/emergency/emergency-stop.wav',

    volume: 1,
    duckLevel: 0.1,
  },
  break_start: {
    key: 'break_start',
    label: 'Break starting',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/break/break-start.wav',
    volume: 1,
    duckLevel: 0.25,
  },
  break_end: {
    key: 'break_end',
    label: 'Break ended',
    priority: 'P1_SAFETY',
    toneUrl: '/messages/tones/attention.wav',
    audioUrl: '/messages/break/break-end.wav',
    volume: 1,
    duckLevel: 0.25,
  },
}

/** Map Announcement IDs to message keys */
export const announcementIdToKey: Record<string, MessageKey> = {
  'a-shift-start': 'shift_start',
  'shift-end': 'shift_end',
  'a-forklift': 'forklift_awareness',
  'a-stay-hydrated': 'safety_tip',
  emergency: 'emergency_stop',
  'break-start': 'break_start',
  'break-end': 'break_end',
}
