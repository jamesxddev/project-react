import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { zoomFar, zoomNear } from '../pickleball/camera.ts'
import drawSource from '../pickleball/draw.ts?raw'
import { applyScale, watchRally, wheelZoom, zoomKey } from '../pickleball/stage.ts'
import shellSource from '../shell/AppShell.tsx?raw'
import { PickleballPage } from './PickleballPage.tsx'
import pageSource from './PickleballPage.tsx?raw'

function buttonTag(html: string, label: string) {
  const start = html.indexOf(`aria-label="${label}"`)
  return html.slice(start, start + 64)
}

describe('PickleballPage', () => {
  it('shows both teams, a hidden canvas, and no social chrome', () => {
    const html = renderToStaticMarkup(<PickleballPage />)
    expect(html).toContain('Esemem · Esopi')
    expect(html).toContain('DaVinci · Fern')
    expect(html).toContain('0–0')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('aria-label="Zoom in"')
    expect(html).toContain('aria-label="Zoom out"')
    expect(html).toContain('aria-label="Reset"')
    expect(html).not.toContain('598')
    expect(html).not.toContain('likes')
    expect(drawSource).toContain('#2f6fed')
    expect(drawSource).toContain('#3eae6a')
    expect(drawSource).toContain('#ffffff')
    expect(drawSource).toContain('#c4a574')
    expect(drawSource).toContain('#9aa3b5')
    expect(drawSource).toContain('#3d9a4a')
    expect(drawSource).toContain('PICKLEBALL COURT')
    expect(drawSource).toContain('drawCourt')
  })

  it('cancels the scheduled frame on unmount and does not run the rally from the shell', () => {
    let pending = 0
    const stop = watchRally({
      reduceMotion: false,
      now: () => 1000,
      requestAnimationFrame: () => {
        pending += 1
        return pending
      },
      cancelAnimationFrame: () => {
        pending = 0
      },
      onFrame: () => {},
    })
    expect(pending).toBe(1)
    stop()
    expect(pending).toBe(0)
    expect(pageSource).toContain('return () =>')
    expect(pageSource).toContain('stop()')
    expect(pageSource).toContain('ResizeObserver')
    expect(shellSource).not.toContain('sampleRally')
    expect(shellSource).not.toContain('requestAnimationFrame')
    expect(renderToStaticMarkup(<PickleballPage />)).toContain('0–0')
  })

  it('disables the extra zoom step, resets, and keeps the rally start', () => {
    const near = renderToStaticMarkup(<PickleballPage initialScale={zoomNear} />)
    const far = renderToStaticMarkup(<PickleballPage initialScale={zoomFar} />)
    expect(buttonTag(near, 'Zoom in')).toContain('disabled')
    expect(buttonTag(far, 'Zoom out')).toContain('disabled')
    expect(buttonTag(near, 'Zoom out')).not.toContain('disabled')
    const clock = { startedAt: 400, scale: 1.4 }
    expect(applyScale(clock, 1)).toEqual({ startedAt: 400, scale: 1 })
    let prevented = 0
    const zoomed = wheelZoom({ deltaY: -30, preventDefault: () => { prevented += 1 } }, 1)
    expect(prevented).toBe(1)
    expect(zoomed).toBeGreaterThan(1)
    expect(wheelZoom({ deltaY: 30, preventDefault: () => {} }, zoomFar)).toBe(zoomFar)
    expect(pageSource).toContain('passive: false')
    expect(pageSource).toContain('applyScale')
    expect(zoomKey('+', { ctrl: false, meta: false, alt: false }, false, 1)).toBeGreaterThan(1)
    expect(zoomKey('-', { ctrl: true, meta: false, alt: false }, false, 1)).toBeNull()
    expect(zoomKey('+', { ctrl: false, meta: false, alt: false }, true, 1)).toBeNull()
  })

  it('draws the ready court and does not schedule a frame when reduced motion matches', () => {
    let calls = 0
    let score = { far: 4, near: 2 }
    let height = 0
    watchRally({
      reduceMotion: true,
      now: () => 50,
      requestAnimationFrame: () => {
        calls += 1
        return 1
      },
      cancelAnimationFrame: () => {},
      onFrame: (sample) => {
        score = sample.score
        height = sample.ball.z
      },
    })
    expect(calls).toBe(0)
    expect(score).toEqual({ far: 0, near: 0 })
    expect(height).toBeGreaterThan(0)
    expect(pageSource).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(pageSource).toContain('restFrame')
    expect(pageSource).toContain("addEventListener('change'")
    expect(renderToStaticMarkup(<PickleballPage />)).toContain('0–0')
  })
})
