import { describe, expect, it } from 'vitest'
import {
  loadWorkTimer,
  parseWorkTimer,
  saveWorkTimer,
  WORK_TIMER_KEY,
  type WorkTimerStorage,
} from './work-timer-storage.ts'
import {
  clockShouldRun,
  deleteRecent,
  descriptionError,
  editRecent,
  emptyWorkTimer,
  formatClock,
  isWarning,
  keepRemaining,
  minuteError,
  nextPhase,
  pause,
  playRecent,
  restartPhase,
  resume,
  startPair,
  stop,
  tick,
  tryEdit,
  tryStart,
  type ActiveTimer,
  type WorkTimerState,
} from './work-timer.ts'

const T0 = '2026-11-20T00:00:00.000Z'
const T1 = '2026-11-20T00:00:01.000Z'
const T2 = '2026-11-20T00:00:02.000Z'
const later = '2026-11-20T01:00:00.000Z'

function ids() {
  let n = 0
  return () => `id-${++n}`
}

function playing(overrides: Partial<ActiveTimer> = {}): ActiveTimer {
  return {
    timerId: 'id-1',
    phase: 'work',
    remainingSeconds: 5,
    status: 'playing',
    updatedAt: T0,
    ...overrides,
  }
}

function memory(initial: string | null = null): WorkTimerStorage & { raw(): string | null } {
  let value = initial
  return {
    getItem: (key) => (key === WORK_TIMER_KEY ? value : null),
    setItem: (key, next) => {
      if (key === WORK_TIMER_KEY) value = next
    },
    raw: () => value,
  }
}

describe('work timer rules', () => {
  it('formats the clock and warns only for the last three seconds', () => {
    expect(formatClock(3)).toBe('00:03')
    expect(formatClock(120)).toBe('02:00')
    expect(isWarning(4)).toBe(false)
    expect(isWarning(3)).toBe(true)
    expect(isWarning(2)).toBe(true)
    expect(isWarning(1)).toBe(true)
    expect(isWarning(0)).toBe(false)

    const next = tick(playing({ remainingSeconds: 5 }), { workSeconds: 1800, restSeconds: 120 }, T1)
    expect(next.remainingSeconds).toBe(4)
    expect(next.phase).toBe('work')
    expect(isWarning(next.remainingSeconds)).toBe(false)
  })

  it('switches phase at zero and keeps the pair lengths', () => {
    const rest = tick(playing({ remainingSeconds: 1 }), { workSeconds: 1800, restSeconds: 120 }, T1)
    expect(rest.phase).toBe('rest')
    expect(rest.remainingSeconds).toBe(120)
    expect(isWarning(rest.remainingSeconds)).toBe(false)

    const work = tick(
      playing({ phase: 'rest', remainingSeconds: 1 }),
      { workSeconds: 1800, restSeconds: 120 },
      T1,
    )
    expect(work.phase).toBe('work')
    expect(work.remainingSeconds).toBe(1800)
    expect(isWarning(work.remainingSeconds)).toBe(false)

    const custom = tick(
      playing({ remainingSeconds: 1 }),
      { workSeconds: 60, restSeconds: 60 },
      T1,
    )
    expect(custom.phase).toBe('rest')
    expect(custom.remainingSeconds).toBe(60)
  })

  it('pauses, resumes, and stops without dropping the recent row', () => {
    const started = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, T0, () => 'timer-id')
    expect(started.active).toMatchObject({
      phase: 'work',
      remainingSeconds: 1800,
      status: 'playing',
    })
    expect(started.recent[0]).toMatchObject({ workSeconds: 1800, restSeconds: 120 })

    const paused = pause(
      { ...started, active: { ...started.active!, remainingSeconds: 5 } },
      T1,
    )
    expect(paused.active).toMatchObject({ status: 'paused', remainingSeconds: 5 })
    expect(resume(paused, T2).active).toMatchObject({ status: 'playing', remainingSeconds: 5 })

    const stopped = stop(started)
    expect(stopped.active).toBeNull()
    expect(stopped.recent).toHaveLength(1)
  })

  it('restarts the current phase and moves to the other phase at full length', () => {
    const started = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, T0, () => 'timer-id')
    const midWork = {
      ...started,
      active: { ...started.active!, remainingSeconds: 40, status: 'paused' as const },
    }
    expect(restartPhase(midWork, T1).active).toMatchObject({
      phase: 'work',
      remainingSeconds: 1800,
      status: 'paused',
      updatedAt: T1,
    })

    const resting = {
      ...started,
      active: { ...started.active!, phase: 'rest' as const, remainingSeconds: 15, status: 'playing' as const },
    }
    expect(restartPhase(resting, T2).active).toMatchObject({
      phase: 'rest',
      remainingSeconds: 120,
      status: 'playing',
      updatedAt: T2,
    })

    expect(nextPhase(midWork, T1).active).toMatchObject({
      phase: 'rest',
      remainingSeconds: 120,
      status: 'paused',
      updatedAt: T1,
    })
    expect(nextPhase(resting, T2).active).toMatchObject({
      phase: 'work',
      remainingSeconds: 1800,
      status: 'playing',
      updatedAt: T2,
    })
    expect(restartPhase(started, T1).recent).toEqual(started.recent)
    expect(nextPhase({ recent: [], active: null }, T1)).toEqual({ recent: [], active: null })
  })

  it('deletes a recent row and edits its lengths', () => {
    let state = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, T0, () => 'timer-a')
    state = startPair(state, { workMinutes: 10, restMinutes: 1 }, T1, () => 'timer-b')
    const kept = deleteRecent(state, 'timer-a')
    expect(kept.recent.map((row) => row.id)).toEqual(['timer-b'])
    expect(kept.active?.timerId).toBe('timer-b')

    const cleared = deleteRecent(state, 'timer-b')
    expect(cleared.recent.map((row) => row.id)).toEqual(['timer-a'])
    expect(cleared.active).toBeNull()
    expect(deleteRecent(cleared, 'missing')).toEqual(cleared)

    const mid = {
      ...state,
      active: { ...state.active!, remainingSeconds: 100 },
    }
    const edited = editRecent(mid, 'timer-b', { workMinutes: 20, restMinutes: 3, description: 'Deep work' }, T2)
    expect(edited.recent[0]).toMatchObject({
      id: 'timer-b',
      description: 'Deep work',
      workSeconds: 1200,
      restSeconds: 180,
      lastPlayedAt: T1,
    })
    expect(edited.active).toMatchObject({
      timerId: 'timer-b',
      phase: 'work',
      remainingSeconds: 100,
      status: 'playing',
    })

    const shortened = editRecent(mid, 'timer-b', { workMinutes: 1, restMinutes: 1, description: '' }, T2)
    expect(shortened.active?.remainingSeconds).toBe(60)

    const fresh = editRecent(state, 'timer-b', { workMinutes: 25, restMinutes: 1, description: '' }, T2)
    expect(fresh.active).toMatchObject({ remainingSeconds: 1500, updatedAt: T2 })

    const merged = editRecent(state, 'timer-b', { workMinutes: 30, restMinutes: 2, description: 'Email' }, T2)
    expect(merged.recent).toHaveLength(1)
    expect(merged.recent[0].id).toBe('timer-a')
    expect(merged.recent[0].description).toBe('Email')
    expect(merged.active?.timerId).toBe('timer-a')

    const invalid = tryEdit(state, 'timer-b', '', '2', '', T2)
    expect(invalid.saved).toBe(false)
    expect(invalid.state).toEqual(state)
    expect(invalid.errors.work).toBe(minuteError)
  })

  it('stores a trimmed description and rejects one past the limit', () => {
    const started = startPair(
      emptyWorkTimer,
      { workMinutes: 30, restMinutes: 2, description: '  Deep work  ' },
      T0,
      () => 'timer-id',
    )
    expect(started.recent[0].description).toBe('Deep work')

    const blocked = tryStart(emptyWorkTimer, '30', '2', 'x'.repeat(81), T0, () => 'timer-id')
    expect(blocked.openScreen).toBe(false)
    expect(blocked.errors.description).toBe(descriptionError)
    expect(blocked.state).toEqual(emptyWorkTimer)
  })

  it('keeps one row per pair, newest first, capped at 10', () => {
    const createId = ids()
    let state = startPair(emptyWorkTimer, { workMinutes: 10, restMinutes: 1 }, T0, createId)
    state = startPair(state, { workMinutes: 20, restMinutes: 1 }, T1, createId)
    const older = state.recent[1]
    state = playRecent(state, older.id, T2)
    expect(state.recent).toHaveLength(2)
    expect(state.recent[0].id).toBe(older.id)
    expect(state.recent[0].lastPlayedAt).toBe(T2)
    expect(state.active).toMatchObject({
      timerId: older.id,
      phase: 'work',
      remainingSeconds: older.workSeconds,
      status: 'playing',
    })

    state = startPair(state, { workMinutes: 10, restMinutes: 1 }, later, ids())
    expect(state.recent.filter((row) => row.workSeconds === 600)).toHaveLength(1)
    expect(state.recent[0].workSeconds).toBe(600)
    expect(state.recent[0].id).toBe(older.id)

    let capped = emptyWorkTimer
    const nextId = ids()
    for (let minute = 1; minute <= 11; minute += 1) {
      const stamp = `2026-11-20T00:00:${String(minute).padStart(2, '0')}.000Z`
      capped = startPair(capped, { workMinutes: minute, restMinutes: 2 }, stamp, nextId)
    }
    expect(capped.recent).toHaveLength(10)
    expect(capped.recent.some((row) => row.workSeconds === 60)).toBe(false)
    expect(capped.recent[0].workSeconds).toBe(660)
  })

  it('does not run the clock while hidden and does not change a hidden remaining time', () => {
    expect(clockShouldRun('playing', 'visible')).toBe(true)
    expect(clockShouldRun('playing', 'hidden')).toBe(false)
    expect(clockShouldRun('paused', 'visible')).toBe(false)
    const state: WorkTimerState = {
      recent: [],
      active: playing({ remainingSeconds: 100, updatedAt: T0 }),
    }
    expect(keepRemaining(state).active?.remainingSeconds).toBe(100)
  })
})

describe('work timer storage', () => {
  it('round-trips a default start and restores the saved remaining time', () => {
    const started = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, T0, () => 'timer-id')
    const storage = memory()
    saveWorkTimer(storage, started)
    const loaded = loadWorkTimer(storage)
    expect(loaded.recent[0]).toMatchObject({
      id: 'timer-id',
      workSeconds: 1800,
      restSeconds: 120,
      lastPlayedAt: T0,
    })
    expect(loaded.active).toMatchObject({
      timerId: 'timer-id',
      phase: 'work',
      remainingSeconds: 1800,
      status: 'playing',
      updatedAt: T0,
    })

    const resting: WorkTimerState = {
      recent: loaded.recent,
      active: { ...loaded.active!, remainingSeconds: 100, updatedAt: T0 },
    }
    saveWorkTimer(storage, resting)
    expect(loadWorkTimer(storage).active?.remainingSeconds).toBe(100)
    expect(later > T0).toBe(true)

    const stopped = stop(resting)
    saveWorkTimer(storage, stopped)
    const afterStop = loadWorkTimer(storage)
    expect(afterStop.active).toBeNull()
    expect(afterStop.recent).toHaveLength(1)
  })

  it('starts empty when storage is missing or invalid', () => {
    expect(parseWorkTimer(null)).toEqual(emptyWorkTimer)
    expect(parseWorkTimer('{')).toEqual(emptyWorkTimer)
    expect(parseWorkTimer(JSON.stringify({ recent: {}, active: null }))).toEqual(emptyWorkTimer)
    const legacy = parseWorkTimer(
      JSON.stringify({
        recent: [{ id: 'timer-id', workSeconds: 1800, restSeconds: 120, lastPlayedAt: T0 }],
        active: null,
      }),
    )
    expect(legacy.recent[0].description).toBe('')
    expect(
      parseWorkTimer(
        JSON.stringify({
          recent: [{ id: 'timer-id', workSeconds: 1800, restSeconds: 120, lastPlayedAt: T0, description: 4 }],
          active: null,
        }),
      ),
    ).toEqual(emptyWorkTimer)
    expect(loadWorkTimer(memory())).toEqual(emptyWorkTimer)
    const throwing: WorkTimerStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {},
    }
    expect(loadWorkTimer(throwing)).toEqual(emptyWorkTimer)
  })
})
