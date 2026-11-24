export const zoomDefault = 1
export const zoomNear = 2
export const zoomFar = 0.7
export const zoomStep = 0.15

export function clampZoom(scale: number): number {
  return Math.min(zoomNear, Math.max(zoomFar, scale))
}

export function zoomIn(scale: number): number {
  return clampZoom(scale + zoomStep)
}

export function zoomOut(scale: number): number {
  return clampZoom(scale - zoomStep)
}

export function resetZoom(): number {
  return zoomDefault
}

export function canZoomIn(scale: number): boolean {
  return zoomIn(scale) > scale + 1e-9
}

export function canZoomOut(scale: number): boolean {
  return zoomOut(scale) < scale - 1e-9
}

export function zoomFromWheel(scale: number, deltaY: number): number {
  return clampZoom(scale * (deltaY < 0 ? 1.12 : 0.9))
}

export function zoomFromPinch(scale: number, ratio: number): number {
  return clampZoom(scale * ratio)
}

export function pinchZoom(startScale: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return clampZoom(startScale)
  return zoomFromPinch(startScale, distance / startDistance)
}
