import { emptyWorkTimer, type ActiveTimer, type RecentTimer, type WorkTimerState } from './work-timer.ts'

export const WORK_TIMER_KEY = 'work-timer'

export type WorkTimerStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

function isRecent(value: unknown): value is RecentTimer {
  if (!value || typeof value !== 'object') return false
  const row = value as RecentTimer
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    Number.isInteger(row.workSeconds) &&
    row.workSeconds > 0 &&
    Number.isInteger(row.restSeconds) &&
    row.restSeconds > 0 &&
    typeof row.lastPlayedAt === 'string' &&
    isoTimestamp.test(row.lastPlayedAt)
  )
}

function isActive(value: unknown): value is ActiveTimer {
  if (!value || typeof value !== 'object') return false
  const active = value as ActiveTimer
  return (
    typeof active.timerId === 'string' &&
    active.timerId.length > 0 &&
    (active.phase === 'work' || active.phase === 'rest') &&
    Number.isInteger(active.remainingSeconds) &&
    active.remainingSeconds >= 0 &&
    (active.status === 'playing' || active.status === 'paused') &&
    typeof active.updatedAt === 'string' &&
    isoTimestamp.test(active.updatedAt)
  )
}

export function parseWorkTimer(raw: string | null): WorkTimerState {
  if (!raw) return emptyWorkTimer
  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== 'object') return emptyWorkTimer
    const record = value as { recent?: unknown; active?: unknown }
    if (!Array.isArray(record.recent) || !record.recent.every(isRecent)) return emptyWorkTimer
    if (record.active !== null && !isActive(record.active)) return emptyWorkTimer
    return { recent: record.recent, active: record.active }
  } catch {
    return emptyWorkTimer
  }
}

export function loadWorkTimer(storage: WorkTimerStorage): WorkTimerState {
  try {
    return parseWorkTimer(storage.getItem(WORK_TIMER_KEY))
  } catch {
    return emptyWorkTimer
  }
}

export function saveWorkTimer(storage: WorkTimerStorage, state: WorkTimerState) {
  storage.setItem(WORK_TIMER_KEY, JSON.stringify(state))
}
