import { zoomFromWheel, zoomIn, zoomOut } from './camera.ts'
import { restFrame, sampleRally, type RallySample } from './rally.ts'

export function applyScale(clock: { startedAt: number; scale: number }, scale: number) {
  return { startedAt: clock.startedAt, scale }
}

export function wheelZoom(event: { deltaY: number; preventDefault: () => void }, scale: number) {
  event.preventDefault()
  return zoomFromWheel(scale, event.deltaY)
}

export function zoomKey(
  key: string,
  modifiers: { ctrl: boolean; meta: boolean; alt: boolean },
  typing: boolean,
  scale: number,
): number | null {
  if (typing || modifiers.ctrl || modifiers.meta || modifiers.alt) return null
  if (key === '+' || key === '=') return zoomIn(scale)
  if (key === '-' || key === '_') return zoomOut(scale)
  return null
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function watchRally(options: {
  reduceMotion: boolean
  now: () => number
  requestAnimationFrame: (callback: (time: number) => void) => number
  cancelAnimationFrame: (id: number) => void
  onFrame: (sample: RallySample, startedAt: number) => void
}): () => void {
  const startedAt = options.now()
  if (options.reduceMotion) {
    options.onFrame(restFrame(), startedAt)
    return () => {}
  }
  let frame = 0
  const tick = (now: number) => {
    options.onFrame(sampleRally(now - startedAt), startedAt)
    frame = options.requestAnimationFrame(tick)
  }
  options.onFrame(sampleRally(0), startedAt)
  frame = options.requestAnimationFrame(tick)
  return () => options.cancelAnimationFrame(frame)
}
