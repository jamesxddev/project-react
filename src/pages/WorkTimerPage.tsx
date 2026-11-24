import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Briefcase, ChevronLeft, Footprints, Pause, Pencil, Play, Plus, RotateCcw, SkipForward, Square, Trash2 } from 'lucide-react'
import {
  loadWorkTimer,
  saveWorkTimer,
  type WorkTimerStorage,
} from '../health/work-timer-storage.ts'
import {
  clockShouldRun,
  DEFAULT_REST_MINUTES,
  DEFAULT_WORK_MINUTES,
  deleteRecent,
  emptyActiveCopy,
  emptyRecentCopy,
  formatClock,
  isWarning,
  keepRemaining,
  nextPhase,
  pause,
  phaseLine,
  phaseName,
  playRecent,
  recentLabel,
  restartPhase,
  resume,
  stop,
  tick,
  tryEdit,
  tryStart,
  type Phase,
  type WorkTimerState,
} from '../health/work-timer.ts'

const browserStorage: WorkTimerStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
}

type FieldErrors = { work: string; rest: string }

const noErrors: FieldErrors = { work: '', rest: '' }

function minutesLabel(totalSeconds: number): string {
  return String(totalSeconds / 60)
}

export function WorkTimerPage({
  storage = browserStorage,
  initialFormOpen = false,
  initialView = 'list',
  initialEditingId = '',
  fieldErrors = noErrors,
}: {
  storage?: WorkTimerStorage
  initialFormOpen?: boolean
  initialView?: 'list' | 'screen'
  initialEditingId?: string
  fieldErrors?: FieldErrors
}) {
  const [state, setState] = useState(() => loadWorkTimer(storage))
  const [view, setView] = useState(initialView)
  const [editingId, setEditingId] = useState<string | null>(initialEditingId || null)
  const [formOpen, setFormOpen] = useState(initialFormOpen || Boolean(initialEditingId))
  const [workMinutes, setWorkMinutes] = useState(() => {
    const row = initialEditingId
      ? loadWorkTimer(storage).recent.find((item) => item.id === initialEditingId)
      : undefined
    return row ? minutesLabel(row.workSeconds) : String(DEFAULT_WORK_MINUTES)
  })
  const [restMinutes, setRestMinutes] = useState(() => {
    const row = initialEditingId
      ? loadWorkTimer(storage).recent.find((item) => item.id === initialEditingId)
      : undefined
    return row ? minutesLabel(row.restSeconds) : String(DEFAULT_REST_MINUTES)
  })
  const [errors, setErrors] = useState(fieldErrors)
  const [visibility, setVisibility] = useState('visible')
  const stateRef = useRef(state)
  const skipSave = useRef(true)
  stateRef.current = state

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveWorkTimer(storage, state)
  }, [state, storage])

  useEffect(() => {
    function onVisibility() {
      const nextVisibility = document.visibilityState
      setVisibility(nextVisibility)
      if (nextVisibility === 'hidden') {
        saveWorkTimer(storage, keepRemaining(stateRef.current))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [storage])

  useEffect(() => {
    if (!clockShouldRun(state.active?.status, visibility)) return
    const intervalId = window.setInterval(() => {
      setState((current) => {
        if (!current.active || !clockShouldRun(current.active.status, document.visibilityState)) {
          return current
        }
        const pair = current.recent.find((row) => row.id === current.active?.timerId)
        if (!pair) return current
        const next: WorkTimerState = {
          ...current,
          active: tick(current.active, pair, new Date().toISOString()),
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [state.active?.status, visibility, storage])

  function commit(next: WorkTimerState, screen: 'list' | 'screen') {
    setState(next)
    saveWorkTimer(storage, next)
    setView(screen)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setWorkMinutes(String(DEFAULT_WORK_MINUTES))
    setRestMinutes(String(DEFAULT_REST_MINUTES))
    setErrors(noErrors)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const now = new Date().toISOString()
    if (editingId) {
      const result = tryEdit(state, editingId, workMinutes, restMinutes, now)
      setErrors(result.errors)
      if (!result.saved) return
      closeForm()
      commit(result.state, 'list')
      return
    }
    const result = tryStart(state, workMinutes, restMinutes, now)
    setErrors(result.errors)
    if (!result.openScreen) return
    closeForm()
    commit(result.state, 'screen')
  }

  function onAdd() {
    setEditingId(null)
    setWorkMinutes(String(DEFAULT_WORK_MINUTES))
    setRestMinutes(String(DEFAULT_REST_MINUTES))
    setErrors(noErrors)
    setFormOpen(true)
  }

  function onEdit(timerId: string) {
    const row = state.recent.find((item) => item.id === timerId)
    if (!row) return
    setEditingId(timerId)
    setWorkMinutes(minutesLabel(row.workSeconds))
    setRestMinutes(minutesLabel(row.restSeconds))
    setErrors(noErrors)
    setFormOpen(true)
  }

  function onDelete(timerId: string) {
    if (editingId === timerId) closeForm()
    commit(deleteRecent(state, timerId), 'list')
  }

  if (view === 'screen' && state.active) {
    const active = state.active
    const warning = active.status === 'playing' && isWarning(active.remainingSeconds)
    const PhaseIcon = active.phase === 'work' ? Briefcase : Footprints
    return (
      <section
        className="timer-screen"
        data-phase={active.phase}
        data-warning={warning ? 'true' : 'false'}
      >
        {warning ? <span key={active.remainingSeconds} className="timer-flash" aria-hidden="true" /> : null}
        <button
          type="button"
          className="timer-control timer-back"
          aria-label="Back"
          onClick={() => setView('list')}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <PhaseIcon className="timer-phase-icon" aria-hidden="true" />
        <p className="timer-phase">{phaseName(active.phase)}</p>
        <p className="timer-line">{phaseLine(active.phase)}</p>
        <p className="timer-clock">{formatClock(active.remainingSeconds)}</p>
        {active.status === 'paused' ? <p className="timer-status">Paused</p> : null}
        <div className="timer-controls">
          {active.status === 'playing' ? (
            <button
              type="button"
              className="timer-control"
              aria-label="Pause"
              onClick={() => commit(pause(state, new Date().toISOString()), 'screen')}
            >
              <Pause aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="timer-control"
              aria-label="Resume"
              onClick={() => commit(resume(state, new Date().toISOString()), 'screen')}
            >
              <Play aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="timer-control"
            aria-label="Stop"
            onClick={() => commit(stop(state), 'list')}
          >
            <Square aria-hidden="true" />
          </button>
          <button
            type="button"
            className="timer-control"
            aria-label="Restart"
            onClick={() => commit(restartPhase(state, new Date().toISOString()), 'screen')}
          >
            <RotateCcw aria-hidden="true" />
          </button>
          <button
            type="button"
            className="timer-control"
            aria-label="Next"
            onClick={() => commit(nextPhase(state, new Date().toISOString()), 'screen')}
          >
            <SkipForward aria-hidden="true" />
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="work-timer">
      <button
        type="button"
        className="timer-add"
        aria-label="Add timer"
        onClick={onAdd}
      >
        <Plus aria-hidden="true" />
      </button>
      {formOpen ? (
        <form className="timer-form" onSubmit={onSubmit} noValidate>
          {editingId ? <h2>Edit timer</h2> : null}
          <Field
            id="work-minutes"
            label="Work minutes"
            value={workMinutes}
            error={errors.work}
            onChange={setWorkMinutes}
          />
          <Field
            id="rest-minutes"
            label="Rest minutes"
            value={restMinutes}
            error={errors.rest}
            onChange={setRestMinutes}
          />
          <div className="timer-form-actions">
            <button type="submit">{editingId ? 'Save' : 'Start'}</button>
            <button type="button" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <section className="timer-section">
        <h2>Active Timer</h2>
        {state.active ? (
          <button type="button" className="timer-active" onClick={() => setView('screen')}>
            <PhaseMark phase={state.active.phase} />
            <span>{phaseName(state.active.phase)}</span>
            <span>{formatClock(state.active.remainingSeconds)}</span>
            {state.active.status === 'paused' ? <span>Paused</span> : null}
          </button>
        ) : (
          <p className="timer-empty">{emptyActiveCopy}</p>
        )}
      </section>
      <section className="timer-section">
        <h2>Recent Timers</h2>
        {state.recent.length === 0 ? (
          <p className="timer-empty">{emptyRecentCopy}</p>
        ) : (
          <ul className="timer-recent">
            {state.recent.map((row) => (
              <li key={row.id} className="timer-row">
                <span>{recentLabel(row)}</span>
                <div className="timer-row-actions">
                  <button type="button" aria-label="Play" onClick={() => commit(playRecent(state, row.id, new Date().toISOString()), 'screen')}>
                    <Play aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Edit" onClick={() => onEdit(row.id)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Delete" onClick={() => onDelete(row.id)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

function PhaseMark({ phase }: { phase: Phase }) {
  const Icon = phase === 'work' ? Briefcase : Footprints
  return <Icon className="timer-phase-icon" aria-hidden="true" />
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  error: string
  onChange: (value: string) => void
}) {
  return (
    <label className="timer-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={99}
        step={1}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="timer-error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  )
}
