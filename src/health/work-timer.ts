export type Phase = 'work' | 'rest'
export type Status = 'playing' | 'paused'

export type RecentTimer = {
  id: string
  description: string
  workSeconds: number
  restSeconds: number
  lastPlayedAt: string
}

export type ActiveTimer = {
  timerId: string
  phase: Phase
  remainingSeconds: number
  status: Status
  updatedAt: string
}

export type WorkTimerState = {
  recent: RecentTimer[]
  active: ActiveTimer | null
}

export type MinuteParse =
  | { ok: true; minutes: number }
  | { ok: false; message: string }

export const DEFAULT_WORK_MINUTES = 30
export const DEFAULT_REST_MINUTES = 2
export const DEFAULT_WORK_SECONDS = 1800
export const DEFAULT_REST_SECONDS = 120
export const RECENT_LIMIT = 10
export const DESCRIPTION_LIMIT = 80
export const minuteError = 'Enter a whole number from 1 to 99.'
export const descriptionError = `Enter a description up to ${DESCRIPTION_LIMIT} characters.`
export const emptyActiveCopy = 'No timer playing.'
export const emptyRecentCopy = 'No recent timers.'
export const workPhaseLine = 'Focus on your work.'
export const restPhaseLine = 'Stand up and walk.'

export const emptyWorkTimer: WorkTimerState = { recent: [], active: null }

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function recentLabel(pair: { workSeconds: number; restSeconds: number }): string {
  return `${formatClock(pair.workSeconds)} work · ${formatClock(pair.restSeconds)} rest`
}

export function phaseName(phase: Phase): string {
  return phase === 'work' ? 'Work' : 'Rest'
}

export function phaseLine(phase: Phase): string {
  return phase === 'work' ? workPhaseLine : restPhaseLine
}

export function isWarning(remainingSeconds: number): boolean {
  return remainingSeconds === 1 || remainingSeconds === 2 || remainingSeconds === 3
}

export function clockShouldRun(status: Status | undefined, visibility: string): boolean {
  return status === 'playing' && visibility === 'visible'
}

export function keepRemaining(state: WorkTimerState): WorkTimerState {
  return state
}

export function parseMinutes(value: string): MinuteParse {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return { ok: false, message: minuteError }
  const minutes = Number(trimmed)
  if (minutes < 1 || minutes > 99) return { ok: false, message: minuteError }
  return { ok: true, minutes }
}

export function parseDescription(value: string): { ok: true; description: string } | { ok: false; message: string } {
  const description = value.trim()
  if (description.length > DESCRIPTION_LIMIT) return { ok: false, message: descriptionError }
  return { ok: true, description }
}

export function tick(
  active: ActiveTimer,
  pair: { workSeconds: number; restSeconds: number },
  now: string,
): ActiveTimer {
  if (active.status !== 'playing') return active
  if (active.remainingSeconds > 1) {
    return { ...active, remainingSeconds: active.remainingSeconds - 1, updatedAt: now }
  }
  if (active.phase === 'work') {
    return { ...active, phase: 'rest', remainingSeconds: pair.restSeconds, updatedAt: now }
  }
  return { ...active, phase: 'work', remainingSeconds: pair.workSeconds, updatedAt: now }
}

function removeOldest(rows: RecentTimer[]): RecentTimer[] {
  let oldestIndex = rows.length - 1
  for (let index = rows.length - 2; index >= 0; index -= 1) {
    if (rows[index].lastPlayedAt < rows[oldestIndex].lastPlayedAt) oldestIndex = index
  }
  return rows.filter((_, index) => index !== oldestIndex)
}

export function upsertRecent(
  recent: RecentTimer[],
  pair: { workSeconds: number; restSeconds: number; description?: string },
  now: string,
  createId: () => string = () => crypto.randomUUID(),
): RecentTimer[] {
  const existing = recent.find(
    (row) => row.workSeconds === pair.workSeconds && row.restSeconds === pair.restSeconds,
  )
  const description = pair.description !== undefined ? pair.description : (existing?.description ?? '')
  const nextRow: RecentTimer = existing
    ? { ...existing, description, lastPlayedAt: now }
    : {
        id: createId(),
        description,
        workSeconds: pair.workSeconds,
        restSeconds: pair.restSeconds,
        lastPlayedAt: now,
      }
  const combined = [nextRow, ...recent.filter((row) => row.id !== nextRow.id)]
  const capped = combined.length > RECENT_LIMIT ? removeOldest(combined) : combined
  return capped.sort((a, b) => (a.lastPlayedAt < b.lastPlayedAt ? 1 : a.lastPlayedAt > b.lastPlayedAt ? -1 : 0))
}

function activate(
  recent: RecentTimer[],
  timerId: string,
  workSeconds: number,
  now: string,
): WorkTimerState {
  return {
    recent,
    active: {
      timerId,
      phase: 'work',
      remainingSeconds: workSeconds,
      status: 'playing',
      updatedAt: now,
    },
  }
}

export function startPair(
  state: WorkTimerState,
  minutes: { workMinutes: number; restMinutes: number; description?: string },
  now: string,
  createId: () => string = () => crypto.randomUUID(),
): WorkTimerState {
  const workSeconds = minutes.workMinutes * 60
  const restSeconds = minutes.restMinutes * 60
  const recent = upsertRecent(
    state.recent,
    { workSeconds, restSeconds, description: minutes.description?.trim() ?? '' },
    now,
    createId,
  )
  const row = recent[0]
  return activate(recent, row.id, workSeconds, now)
}

export function playRecent(state: WorkTimerState, timerId: string, now: string): WorkTimerState {
  const row = state.recent.find((item) => item.id === timerId)
  if (!row) return state
  const recent = upsertRecent(state.recent, row, now, () => row.id)
  return activate(recent, row.id, row.workSeconds, now)
}

export function deleteRecent(state: WorkTimerState, timerId: string): WorkTimerState {
  if (!state.recent.some((row) => row.id === timerId)) return state
  return {
    recent: state.recent.filter((row) => row.id !== timerId),
    active: state.active?.timerId === timerId ? null : state.active,
  }
}

function fitRemaining(
  active: ActiveTimer,
  previous: { workSeconds: number; restSeconds: number },
  next: { workSeconds: number; restSeconds: number },
  now: string,
  timerId: string,
): ActiveTimer {
  const previousLength = phaseLength(active.phase, previous)
  const nextLength = phaseLength(active.phase, next)
  const remainingSeconds =
    active.remainingSeconds === previousLength || active.remainingSeconds > nextLength
      ? nextLength
      : active.remainingSeconds
  return { ...active, timerId, remainingSeconds, updatedAt: now }
}

export function editRecent(
  state: WorkTimerState,
  timerId: string,
  minutes: { workMinutes: number; restMinutes: number; description: string },
  now: string,
): WorkTimerState {
  const current = state.recent.find((row) => row.id === timerId)
  if (!current) return state
  const workSeconds = minutes.workMinutes * 60
  const restSeconds = minutes.restMinutes * 60
  const description = minutes.description.trim()
  const nextLengths = { workSeconds, restSeconds, description }
  const duplicate = state.recent.find(
    (row) => row.id !== timerId && row.workSeconds === workSeconds && row.restSeconds === restSeconds,
  )
  const recent = duplicate
    ? state.recent
        .filter((row) => row.id !== timerId)
        .map((row) => (row.id === duplicate.id ? { ...row, description } : row))
    : state.recent.map((row) => (row.id === timerId ? { ...row, ...nextLengths } : row))
  const active =
    state.active?.timerId === timerId
      ? fitRemaining(state.active, current, nextLengths, now, duplicate?.id ?? timerId)
      : state.active
  return { recent, active }
}

export function pause(state: WorkTimerState, now: string): WorkTimerState {
  if (!state.active || state.active.status !== 'playing') return state
  return { ...state, active: { ...state.active, status: 'paused', updatedAt: now } }
}

export function resume(state: WorkTimerState, now: string): WorkTimerState {
  if (!state.active || state.active.status !== 'paused') return state
  return { ...state, active: { ...state.active, status: 'playing', updatedAt: now } }
}

export function stop(state: WorkTimerState): WorkTimerState {
  return { ...state, active: null }
}

function phaseLength(
  phase: Phase,
  pair: { workSeconds: number; restSeconds: number },
): number {
  return phase === 'work' ? pair.workSeconds : pair.restSeconds
}

export function tryEdit(
  state: WorkTimerState,
  timerId: string,
  workValue: string,
  restValue: string,
  descriptionValue: string,
  now: string,
): { state: WorkTimerState; errors: { work: string; rest: string; description: string }; saved: boolean } {
  const work = parseMinutes(workValue)
  const rest = parseMinutes(restValue)
  const description = parseDescription(descriptionValue)
  const errors = {
    work: work.ok ? '' : work.message,
    rest: rest.ok ? '' : rest.message,
    description: description.ok ? '' : description.message,
  }
  if (!work.ok || !rest.ok || !description.ok) return { state, errors, saved: false }
  const current = state.recent.find((row) => row.id === timerId)
  if (!current) return { state, errors, saved: false }
  return {
    state: editRecent(
      state,
      timerId,
      { workMinutes: work.minutes, restMinutes: rest.minutes, description: description.description },
      now,
    ),
    errors,
    saved: true,
  }
}

export function restartPhase(state: WorkTimerState, now: string): WorkTimerState {
  if (!state.active) return state
  const pair = state.recent.find((row) => row.id === state.active?.timerId)
  if (!pair) return state
  return {
    ...state,
    active: {
      ...state.active,
      remainingSeconds: phaseLength(state.active.phase, pair),
      updatedAt: now,
    },
  }
}

export function nextPhase(state: WorkTimerState, now: string): WorkTimerState {
  if (!state.active) return state
  const pair = state.recent.find((row) => row.id === state.active?.timerId)
  if (!pair) return state
  const phase: Phase = state.active.phase === 'work' ? 'rest' : 'work'
  return {
    ...state,
    active: {
      ...state.active,
      phase,
      remainingSeconds: phaseLength(phase, pair),
      updatedAt: now,
    },
  }
}

export function tryStart(
  state: WorkTimerState,
  workValue: string,
  restValue: string,
  descriptionValue: string,
  now: string,
  createId: () => string = () => crypto.randomUUID(),
): { state: WorkTimerState; errors: { work: string; rest: string; description: string }; openScreen: boolean } {
  const work = parseMinutes(workValue)
  const rest = parseMinutes(restValue)
  const description = parseDescription(descriptionValue)
  const errors = {
    work: work.ok ? '' : work.message,
    rest: rest.ok ? '' : rest.message,
    description: description.ok ? '' : description.message,
  }
  if (!work.ok || !rest.ok || !description.ok) return { state, errors, openScreen: false }
  return {
    state: startPair(
      state,
      { workMinutes: work.minutes, restMinutes: rest.minutes, description: description.description },
      now,
      createId,
    ),
    errors,
    openScreen: true,
  }
}
