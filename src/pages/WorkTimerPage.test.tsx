import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { saveWorkTimer, WORK_TIMER_KEY, type WorkTimerStorage } from '../health/work-timer-storage.ts'
import {
  emptyWorkTimer,
  keepRemaining,
  minuteError,
  pause,
  startPair,
  tryStart,
  workPhaseLine,
  restPhaseLine,
} from '../health/work-timer.ts'
import shellSource from '../shell/AppShell.tsx?raw'
import pageSource from './WorkTimerPage.tsx?raw'
import { WorkTimerPage } from './WorkTimerPage.tsx'

const NOW = '2026-11-20T00:00:00.000Z'

function memory(): WorkTimerStorage & { raw(): string | null } {
  let value: string | null = null
  return {
    getItem: (key) => (key === WORK_TIMER_KEY ? value : null),
    setItem: (key, next) => {
      if (key === WORK_TIMER_KEY) value = next
    },
    raw: () => value,
  }
}

describe('WorkTimerPage', () => {
  it('shows the add control, then the empty active and recent lines', () => {
    const html = renderToStaticMarkup(<WorkTimerPage storage={memory()} />)
    const add = html.indexOf('aria-label="Add timer"')
    const active = html.indexOf('Active Timer')
    const recent = html.indexOf('Recent Timers')

    expect(add).toBeGreaterThan(-1)
    expect(add).toBeLessThan(active)
    expect(active).toBeLessThan(recent)
    expect(html).toContain('No timer playing.')
    expect(html).toContain('No recent timers.')
    expect(html).not.toContain('timer-screen')
  })

  it('shows create defaults and does not store an invalid start', () => {
    const storage = memory()
    const html = renderToStaticMarkup(<WorkTimerPage storage={storage} initialFormOpen />)
    expect(html).toContain('value="30"')
    expect(html).toContain('value="2"')

    const blocked = tryStart(emptyWorkTimer, '', '2', NOW, () => 'timer-id')
    expect(blocked.openScreen).toBe(false)
    expect(blocked.state).toEqual(emptyWorkTimer)
    expect(blocked.errors.work).toBe(minuteError)
    expect(storage.raw()).toBeNull()

    const invalid = renderToStaticMarkup(
      <WorkTimerPage storage={storage} initialFormOpen fieldErrors={blocked.errors} />,
    )
    expect(invalid).toContain('aria-invalid="true"')
    expect(invalid).toContain(minuteError)
    expect(invalid).not.toContain('timer-screen')
    expect(storage.raw()).toBeNull()
  })

  it('shows the playing summary and the recent pair', () => {
    const storage = memory()
    const state = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, NOW, () => 'timer-id')
    saveWorkTimer(storage, state)
    const html = renderToStaticMarkup(<WorkTimerPage storage={storage} />)

    expect(html).toContain('Work')
    expect(html).toContain('30:00')
    expect(html).toContain('30:00 work · 02:00 rest')
    expect(html).toContain('aria-label="Play"')
    expect(pageSource).toContain('Briefcase')
    expect(pageSource).toContain('Footprints')
  })

  it('shows the work screen and a paused rest screen without a warning', () => {
    const playingStore = memory()
    saveWorkTimer(
      playingStore,
      startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, NOW, () => 'timer-id'),
    )
    const playing = renderToStaticMarkup(
      <WorkTimerPage storage={playingStore} initialView="screen" />,
    )
    expect(playing).toContain('timer-screen')
    expect(playing).toContain(workPhaseLine)
    expect(playing).toContain('30:00')
    expect(playing).toContain('aria-label="Pause"')
    expect(playing).toContain('aria-label="Stop"')
    expect(playing).not.toContain('aria-label="Resume"')

    const started = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, NOW, () => 'timer-id')
    const paused = pause(
      {
        ...started,
        active: { ...started.active!, phase: 'rest', remainingSeconds: 2 },
      },
      NOW,
    )
    const pausedStore = memory()
    saveWorkTimer(pausedStore, paused)
    const rest = renderToStaticMarkup(<WorkTimerPage storage={pausedStore} initialView="screen" />)
    expect(rest).toContain(restPhaseLine)
    expect(rest).toContain('00:02')
    expect(rest).toContain('Paused')
    expect(rest).toContain('aria-label="Resume"')
    expect(rest).toContain('aria-label="Stop"')
    expect(rest).not.toContain('aria-label="Pause"')
    expect(rest).toContain('data-warning="false"')
    expect(rest).not.toContain('timer-warning')
    expect(rest).not.toContain('timer-flash')
  })

  it('flashes once for each of the last three seconds', () => {
    function screenAt(remainingSeconds: number) {
      const started = startPair(emptyWorkTimer, { workMinutes: 30, restMinutes: 2 }, NOW, () => 'timer-id')
      const storage = memory()
      saveWorkTimer(storage, {
        ...started,
        active: { ...started.active!, remainingSeconds },
      })
      return renderToStaticMarkup(<WorkTimerPage storage={storage} initialView="screen" />)
    }

    expect(screenAt(4)).not.toContain('timer-flash')
    expect(screenAt(3)).toContain('timer-flash')
    expect(screenAt(2)).toContain('timer-flash')
    expect(screenAt(1)).toContain('timer-flash')
    expect(pageSource).toContain('key={active.remainingSeconds}')
  })

  it('keeps the clock on this page and does not catch up while hidden', () => {
    expect(pageSource).toContain('window.setInterval')
    expect(pageSource).toContain('1000')
    expect(pageSource).toContain('visibilitychange')
    expect(pageSource).toContain('return () => window.clearInterval(intervalId)')
    expect(pageSource).toContain('keepRemaining')
    expect(shellSource).not.toContain('setInterval')
    const hidden = keepRemaining({
      recent: [],
      active: {
        timerId: 'timer-id',
        phase: 'work',
        remainingSeconds: 100,
        status: 'playing',
        updatedAt: NOW,
      },
    })
    expect(hidden.active?.remainingSeconds).toBe(100)
  })

  it('defines phase colors, a one-second pulse, and reduced motion', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
    expect(css).toContain('--timer-work:')
    expect(css).toContain('--timer-rest:')
    expect(css).toContain('--timer-work-warn:')
    expect(css).toContain('--timer-rest-warn:')
    expect(css).toContain('--timer-text:')
    expect(css.match(/--timer-work:/g)?.length).toBeGreaterThanOrEqual(2)
    expect(css).toContain('--timer-work-warn: #1d4e89')
    expect(css).toContain('@keyframes timer-flash')
    expect(css).toContain('animation: timer-flash 1s ease-in-out 1 both')
    expect(css).toContain('opacity: 1')
    expect(css).not.toContain('opacity: 0.35')
    expect(css).not.toContain('timer-pulse-work')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('animation: none')
    expect(css).toContain('font-size: clamp(4.5rem, 16vw, 9rem)')
    const listRule = css.slice(css.indexOf('.work-timer {'), css.indexOf('.work-timer {') + 240)
    expect(listRule).toContain('var(--text)')
  })
})
