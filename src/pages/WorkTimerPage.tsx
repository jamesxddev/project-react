import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Briefcase, Footprints, Pause, Play, Plus, Square } from 'lucide-react'
import {
  loadWorkTimer,
  saveWorkTimer,
  type WorkTimerStorage,
} from '../health/work-timer-storage.ts'
import {
  clockShouldRun,
  DEFAULT_REST_MINUTES,
  DEFAULT_WORK_MINUTES,
  emptyActiveCopy,
  emptyRecentCopy,
  formatClock,
  isWarning,
  keepRemaining,
  pause,
  phaseLine,
  phaseName,
  playRecent,
  recentLabel,
  resume,
  stop,
  tick,
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

export function WorkTimerPage({
  storage = browserStorage,
  initialFormOpen = false,
  initialView = 'list',
  fieldErrors = noErrors,
}: {
  storage?: WorkTimerStorage
  initialFormOpen?: boolean
  initialView?: 'list' | 'screen'
  fieldErrors?: FieldErrors
}) {
  const [state, setState] = useState(() => loadWorkTimer(storage))
  const [view, setView] = useState(initialView)
  const [formOpen, setFormOpen] = useState(initialFormOpen)
  const [workMinutes, setWorkMinutes] = useState(String(DEFAULT_WORK_MINUTES))
  const [restMinutes, setRestMinutes] = useState(String(DEFAULT_REST_MINUTES))
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

  function onStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = tryStart(state, workMinutes, restMinutes, new Date().toISOString())
    setErrors(result.errors)
    if (!result.openScreen) return
    setFormOpen(false)
    commit(result.state, 'screen')
  }

  function onCancel() {
    setFormOpen(false)
    setWorkMinutes(String(DEFAULT_WORK_MINUTES))
    setRestMinutes(String(DEFAULT_REST_MINUTES))
    setErrors(noErrors)
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
        onClick={() => setFormOpen(true)}
      >
        <Plus aria-hidden="true" />
      </button>
      {formOpen ? (
        <form className="timer-form" onSubmit={onStart} noValidate>
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
            <button type="submit">Start</button>
            <button type="button" onClick={onCancel}>
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
                <button type="button" aria-label="Play" onClick={() => commit(playRecent(state, row.id, new Date().toISOString()), 'screen')}>
                  <Play aria-hidden="true" />
                </button>
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
