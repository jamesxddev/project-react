import { describe, expect, it } from 'vitest'
import {
  canZoomIn,
  canZoomOut,
  pinchZoom,
  resetZoom,
  zoomDefault,
  zoomFar,
  zoomFromPinch,
  zoomFromWheel,
  zoomIn,
  zoomNear,
  zoomOut,
} from './camera.ts'

describe('camera zoom', () => {
  it('starts at the default and stops at both limits', () => {
    expect(zoomDefault).toBe(1)
    expect(resetZoom()).toBe(1)
    expect(zoomIn(1)).toBeCloseTo(1.15)
    expect(zoomOut(1)).toBeCloseTo(0.85)
    expect(zoomIn(zoomNear)).toBe(zoomNear)
    expect(zoomOut(zoomFar)).toBe(zoomFar)
  })

  it('disables a step that would not change the scale', () => {
    expect(canZoomIn(zoomNear)).toBe(false)
    expect(canZoomOut(zoomNear)).toBe(true)
    expect(canZoomOut(zoomFar)).toBe(false)
    expect(canZoomIn(zoomFar)).toBe(true)
  })

  it('keeps a wheel or pinch ratio inside the same limits', () => {
    expect(zoomFromWheel(zoomNear, -120)).toBe(zoomNear)
    expect(zoomFromWheel(zoomFar, 120)).toBe(zoomFar)
    expect(zoomFromPinch(zoomNear, 4)).toBe(zoomNear)
    expect(zoomFromPinch(zoomFar, 0.2)).toBe(zoomFar)
    expect(pinchZoom(zoomNear, 40, 80)).toBe(zoomNear)
    expect(pinchZoom(zoomFar, 80, 20)).toBe(zoomFar)
    expect(zoomFromWheel(1, -10)).toBeGreaterThan(1)
    expect(zoomFromWheel(1, 10)).toBeLessThan(1)
  })
})