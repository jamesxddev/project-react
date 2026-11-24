import type { PlayerId, RallySample } from './rally.ts'

export const signText = 'PICKLEBALL COURT'

const floor = '#6e7894'
const courtBlue = '#2f6fed'
const kitchenGreen = '#3eae6a'
const lineWhite = '#ffffff'
const netColor = '#d5dbe6'
const benchWood = '#c4a574'
const fenceGray = '#9aa3b5'
const plantGreen = '#3d9a4a'
const ballWhite = '#ffffff'
const ringOrange = '#f97316'
const signBoard = '#1f2937'
const signInk = '#ffffff'

const outfits: Record<PlayerId, { hair: string; shirt: string; pants: string; name: string; bun: boolean }> = {
  esemem: { hair: '#2b241c', shirt: '#3b6fd6', pants: '#2a2e38', name: 'Esemem', bun: true },
  esopi: { hair: '#8a5a32', shirt: '#f4f4f2', pants: '#2a2e38', name: 'Esopi', bun: false },
  davinci: { hair: '#241c16', shirt: '#f4f4f2', pants: '#2a2e38', name: 'DaVinci', bun: false },
  fern: { hair: '#3caa45', shirt: '#3b6fd6', pants: '#2a2e38', name: 'Fern', bun: false },
}

type Pt = { x: number; y: number }

function project(x: number, y: number, z: number, scale: number, width: number, height: number): Pt {
  const px = x * 0.92 + y * 0.28
  const py = -y * 0.48 + x * 0.18 - z * 1.15
  const fit = Math.min(width, height) / 58
  const size = fit * scale
  return { x: width / 2 + px * size, y: height * 0.52 + py * size }
}

function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * amount)
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`
}

function fillPoly(ctx: CanvasRenderingContext2D, points: Pt[], color: string) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function quad(
  ctx: CanvasRenderingContext2D,
  corners: Array<[number, number, number]>,
  color: string,
  scale: number,
  width: number,
  height: number,
) {
  fillPoly(
    ctx,
    corners.map(([x, y, z]) => project(x, y, z, scale, width, height)),
    color,
  )
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  color: string,
  scale: number,
  width: number,
  height: number,
) {
  const x0 = x - w / 2
  const x1 = x + w / 2
  const y0 = y - d / 2
  const y1 = y + d / 2
  const z1 = z + h
  quad(ctx, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, scale, width, height)
  quad(ctx, [[x0, y0, z], [x1, y0, z], [x1, y0, z1], [x0, y0, z1]], shade(color, 0.82), scale, width, height)
  quad(ctx, [[x1, y0, z], [x1, y1, z], [x1, y1, z1], [x1, y0, z1]], shade(color, 0.68), scale, width, height)
}

function stroke(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  scale: number,
  width: number,
  height: number,
) {
  const start = project(from[0], from[1], 0.04, scale, width, height)
  const end = project(to[0], to[1], 0.04, scale, width, height)
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.strokeStyle = lineWhite
  ctx.lineWidth = Math.max(1.5, (Math.min(width, height) / 240) * scale)
  ctx.stroke()
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  id: PlayerId,
  sample: RallySample,
  scale: number,
  width: number,
  height: number,
) {
  const pose = sample.players[id]
  const outfit = outfits[id]
  const swinging = sample.swinging && sample.hitter === id
  box(ctx, pose.x, pose.y, 0, 1.5, 1.15, 2.3, outfit.pants, scale, width, height)
  box(ctx, pose.x, pose.y, 2.3, 1.7, 1.25, 1.7, outfit.shirt, scale, width, height)
  box(ctx, pose.x, pose.y, 4, 1.15, 1, 1, '#f0c9a0', scale, width, height)
  box(ctx, pose.x, pose.y + (outfit.bun ? -0.08 : 0), 4.85, 1.25, 1.1, 0.55, outfit.hair, scale, width, height)
  if (outfit.bun) box(ctx, pose.x, pose.y - 0.2, 5.3, 0.55, 0.55, 0.55, outfit.hair, scale, width, height)
  const reach = swinging ? 2.4 : 1.3
  const paddleY = pose.y + (pose.y > 0 ? -reach : reach)
  box(ctx, pose.x + 1.05, paddleY, 2.6, 0.35, 1.15, 0.22, benchWood, scale, width, height)
  const head = project(pose.x, pose.y, 5.9, scale, width, height)
  const size = Math.max(11, (Math.min(width, height) / 52) * scale)
  ctx.font = `600 ${size}px sans-serif`
  ctx.textAlign = 'center'
  const labelWidth = ctx.measureText(outfit.name).width
  ctx.fillStyle = signBoard
  ctx.fillRect(head.x - labelWidth / 2 - 6, head.y - size, labelWidth + 12, size + 6)
  ctx.fillStyle = signInk
  ctx.fillText(outfit.name, head.x, head.y - 4)
}

export function drawCourt(
  ctx: CanvasRenderingContext2D,
  sample: RallySample,
  scale: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = floor
  ctx.fillRect(0, 0, width, height)
  quad(ctx, [[-28, -42, 0], [28, -42, 0], [28, 42, 0], [-28, 42, 0]], floor, scale, width, height)

  for (const [x, y, w, d] of [
    [-18, 0, 0.7, 52],
    [18, 0, 0.7, 52],
    [0, -30, 36, 0.7],
    [0, 30, 36, 0.7],
  ] as Array<[number, number, number, number]>) {
    box(ctx, x, y, 0, w, d, 1.8, fenceGray, scale, width, height)
  }

  for (const [x, y] of [
    [-14, -14],
    [-14, 10],
    [14, -10],
    [14, 16],
  ] as Array<[number, number]>) {
    box(ctx, x, y, 0, 1.6, 4.6, 0.9, benchWood, scale, width, height)
  }

  box(ctx, -15, -26, 0, 1.2, 1.2, 0.7, benchWood, scale, width, height)
  box(ctx, -15, -26, 0.7, 1.6, 1.6, 2.2, plantGreen, scale, width, height)
  box(ctx, 16, 24, 0, 1.2, 1.2, 0.7, benchWood, scale, width, height)
  box(ctx, 16, 24, 0.7, 1.6, 1.6, 2.2, plantGreen, scale, width, height)

  quad(ctx, [[-10, -22, 0], [10, -22, 0], [10, 22, 0], [-10, 22, 0]], courtBlue, scale, width, height)
  quad(ctx, [[-10, -7, 0.02], [10, -7, 0.02], [10, 7, 0.02], [-10, 7, 0.02]], kitchenGreen, scale, width, height)

  stroke(ctx, [-10, -22], [10, -22], scale, width, height)
  stroke(ctx, [-10, 22], [10, 22], scale, width, height)
  stroke(ctx, [-10, -22], [-10, 22], scale, width, height)
  stroke(ctx, [10, -22], [10, 22], scale, width, height)
  stroke(ctx, [-10, -7], [10, -7], scale, width, height)
  stroke(ctx, [-10, 7], [10, 7], scale, width, height)
  stroke(ctx, [0, -22], [0, -7], scale, width, height)
  stroke(ctx, [0, 7], [0, 22], scale, width, height)

  const shadow = project(sample.shadow.x, sample.shadow.y, 0, scale, width, height)
  const radius = Math.max(3, (Math.min(width, height) / 95) * scale)
  ctx.beginPath()
  ctx.ellipse(shadow.x, shadow.y, radius * 0.95, radius * 0.42, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(17, 24, 39, 0.35)'
  ctx.fill()

  if (sample.hitter) {
    const feet = sample.players[sample.hitter]
    const ring = project(feet.x, feet.y, 0.05, scale, width, height)
    ctx.beginPath()
    ctx.ellipse(ring.x, ring.y, radius * 1.7, radius * 0.7, 0, 0, Math.PI * 2)
    ctx.strokeStyle = ringOrange
    ctx.lineWidth = Math.max(2, radius * 0.35)
    ctx.stroke()
  }

  for (const id of ['esemem', 'esopi'] as const) drawPlayer(ctx, id, sample, scale, width, height)

  box(ctx, -10, 0, 0, 0.28, 0.28, 3, fenceGray, scale, width, height)
  box(ctx, 10, 0, 0, 0.28, 0.28, 3, fenceGray, scale, width, height)
  box(ctx, 0, 0, 2.75, 20, 0.16, 0.16, lineWhite, scale, width, height)
  for (const z of [0.7, 1.35, 2]) {
    box(ctx, 0, 0, z, 20, 0.08, 0.08, netColor, scale, width, height)
  }

  for (const id of ['davinci', 'fern'] as const) drawPlayer(ctx, id, sample, scale, width, height)

  const ball = project(sample.ball.x, sample.ball.y, sample.ball.z, scale, width, height)
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = ballWhite
  ctx.fill()

  const sign = project(16, 6, 2.2, scale, width, height)
  const fontSize = Math.max(13, (Math.min(width, height) / 46) * scale)
  ctx.font = `700 ${fontSize}px sans-serif`
  ctx.textAlign = 'left'
  const textWidth = ctx.measureText(signText).width
  ctx.fillStyle = signBoard
  ctx.fillRect(sign.x, sign.y - fontSize, textWidth + 16, fontSize + 10)
  ctx.fillStyle = signInk
  ctx.fillText(signText, sign.x + 8, sign.y)
}
