import { useEffect, useRef, useState } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { canZoomIn, canZoomOut, pinchZoom, resetZoom, zoomDefault, zoomIn, zoomOut } from '../pickleball/camera.ts'
import { drawCourt } from '../pickleball/draw.ts'
import { restFrame, sampleRally } from '../pickleball/rally.ts'
import { applyScale, isTypingTarget, watchRally, wheelZoom, zoomKey } from '../pickleball/stage.ts'

type Score = { far: number; near: number }

function fitCanvas(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement
  if (!parent) return
  const rect = parent.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(rect.width * dpr))
  canvas.height = Math.max(1, Math.floor(rect.height * dpr))
}

export function PickleballPage({ initialScale = zoomDefault }: { initialScale?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startRef = useRef(0)
  const scaleRef = useRef(initialScale)
  const [scale, setScale] = useState(initialScale)
  const [score, setScore] = useState<Score>({ far: 0, near: 0 })

  function updateScale(next: number) {
    const applied = applyScale({ startedAt: startRef.current, scale: scaleRef.current }, next)
    startRef.current = applied.startedAt
    scaleRef.current = applied.scale
    setScale(applied.scale)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let stop = () => {}
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchOrigin = { distance: 0, scale: scaleRef.current }

    const paint = (sample: ReturnType<typeof sampleRally>) => {
      drawCourt(context, sample, scaleRef.current, canvas.width, canvas.height)
      setScore((prev) => (prev.far === sample.score.far && prev.near === sample.score.near ? prev : sample.score))
    }

    const redraw = () => {
      fitCanvas(canvas)
      const elapsed = performance.now() - startRef.current
      paint(media.matches ? restFrame() : sampleRally(Math.max(0, elapsed)))
    }

    const arm = () => {
      stop()
      stop = watchRally({
        reduceMotion: media.matches,
        now: () => performance.now(),
        requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
        cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
        onFrame: (sample, startedAt) => {
          startRef.current = startedAt
          paint(sample)
        },
      })
    }

    startRef.current = performance.now()
    fitCanvas(canvas)
    arm()
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas.parentElement ?? canvas)
    const onChange = () => arm()
    media.addEventListener('change', onChange)

    const onWheel = (event: WheelEvent) => {
      updateScale(wheelZoom(event, scaleRef.current))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    const pointerDistance = () => {
      const points = [...pointers.values()]
      if (points.length < 2) return 0
      return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
    }
    const onPointerDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size === 2) pinchOrigin = { distance: pointerDistance(), scale: scaleRef.current }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size < 2) return
      updateScale(pinchZoom(pinchOrigin.scale, pinchOrigin.distance, pointerDistance()))
    }
    const onPointerEnd = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerEnd)
    canvas.addEventListener('pointercancel', onPointerEnd)

    const onKey = (event: KeyboardEvent) => {
      const next = zoomKey(
        event.key,
        { ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey },
        isTypingTarget(event.target),
        scaleRef.current,
      )
      if (next == null) return
      event.preventDefault()
      updateScale(next)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      stop()
      observer.disconnect()
      media.removeEventListener('change', onChange)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerEnd)
      canvas.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="pickleball">
      <canvas ref={canvasRef} className="pickleball-canvas" aria-hidden="true" />
      <p className="pickleball-score" aria-live="polite">
        <span>Esemem · Esopi <strong>{score.far}</strong></span>
        <span>DaVinci · Fern <strong>{score.near}</strong></span>
        <span className="visually-hidden">
          {score.far}–{score.near}
        </span>
      </p>
      <div className="pickleball-zoom">
        <button type="button" className="icon-button" aria-label="Zoom in" disabled={!canZoomIn(scale)} onClick={() => updateScale(zoomIn(scale))}>
          <ZoomIn className="player-icon" aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="Zoom out" disabled={!canZoomOut(scale)} onClick={() => updateScale(zoomOut(scale))}>
          <ZoomOut className="player-icon" aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="Reset" onClick={() => updateScale(resetZoom())}>
          <RotateCcw className="player-icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
