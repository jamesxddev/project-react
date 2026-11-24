export const court = {
  halfWidth: 10,
  baseline: 22,
  kitchen: 7,
}

export const beats = ['serve', 'return', 'approach', 'dink1', 'dink2', 'winner', 'reset'] as const
export type BeatName = (typeof beats)[number]

export const beatDuration: Record<BeatName, number> = {
  serve: 1600,
  return: 1600,
  approach: 1600,
  dink1: 1200,
  dink2: 1200,
  winner: 2000,
  reset: 2000,
}

export const DINK_BOUNCE = 0.7
export const WINNER_FIRST_BOUNCE = 0.45
export const WINNER_SECOND_BOUNCE = 0.75

export const rallyDuration = beats.reduce((sum, beat) => sum + beatDuration[beat], 0)
export const cycleDuration = rallyDuration * 2

export type PlayerId = 'esemem' | 'esopi' | 'davinci' | 'fern'
export type Point = { x: number; y: number }
export type Vec = { x: number; y: number; z: number }
export type Pose = Record<PlayerId, Point>

export type RallySample = {
  score: { far: number; near: number }
  hitter: PlayerId | null
  swinging: boolean
  players: Pose
  ball: Vec
  shadow: Point
}

const ready: Pose = {
  esemem: { x: -6, y: 15 },
  esopi: { x: 6, y: 15 },
  davinci: { x: -3, y: -14 },
  fern: { x: 6, y: -15 },
}

type Shot = {
  beat: BeatName
  hitter: PlayerId | null
  poseFrom: Pose
  poseTo: Pose
  poseAfter?: Pose
  ballFrom: Point
  ballTo: Point
  ballRest?: Point
  apex: number
}

function pose(base: Pose, patch: Partial<Pose>): Pose {
  return { ...base, ...patch }
}

const openingKitchen: Pose = {
  esemem: { x: -4, y: 8 },
  esopi: { x: 5, y: 8 },
  davinci: { x: -2, y: -8 },
  fern: { x: 4, y: -8 },
}

const openingServe: Pose = pose(ready, { esopi: { x: 6, y: 23 }, fern: { x: 5, y: -15 } })
const openingReturn: Pose = {
  esemem: { x: -5, y: 14 },
  esopi: { x: 6, y: 16 },
  davinci: { x: -3, y: -13 },
  fern: { x: 5, y: -14.5 },
}
const openingDink: Pose = pose(openingKitchen, { davinci: { x: -1, y: -8 } })
const openingDinkAfter: Pose = pose(openingDink, { davinci: { x: -1, y: -6.2 } })
const openingDink2: Pose = pose(openingDinkAfter, { esopi: { x: 4, y: 8 } })
const openingDink2After: Pose = pose(openingDink2, { esopi: { x: 4, y: 6.4 } })
const openingWinner: Pose = {
  esemem: { x: -3, y: 8 },
  esopi: { x: 7, y: 17 },
  davinci: { x: 1, y: -8 },
  fern: { x: 4, y: -8 },
}

const mirrorServe: Pose = pose(ready, { fern: { x: 6, y: -24 }, esopi: { x: 5, y: 15 } })
const mirrorReturn: Pose = {
  esemem: { x: -5, y: 14 },
  esopi: { x: 5, y: 15 },
  davinci: { x: -4, y: -14 },
  fern: { x: 6, y: -16 },
}
const mirrorKitchen: Pose = {
  esemem: { x: -4, y: 8 },
  esopi: { x: 5, y: 8 },
  davinci: { x: -2, y: -8 },
  fern: { x: 4, y: -8 },
}
const mirrorDink: Pose = pose(mirrorKitchen, { esemem: { x: -3, y: 8 } })
const mirrorDinkAfter: Pose = pose(mirrorDink, { esemem: { x: -3, y: 6.4 } })
const mirrorDink2: Pose = pose(mirrorDinkAfter, { fern: { x: 4, y: -8 } })
const mirrorDink2After: Pose = pose(mirrorDink2, { fern: { x: 4, y: -6.2 } })
const mirrorWinner: Pose = {
  esemem: { x: -2, y: 8 },
  esopi: { x: 5, y: 8 },
  davinci: { x: -2, y: -8 },
  fern: { x: 6, y: -17 },
}

function script(shots: Shot[]): Shot[] {
  return shots
}

const opening = script([
  { beat: 'serve', hitter: 'esopi', poseFrom: openingServe, poseTo: openingServe, ballFrom: { x: 6, y: 22.5 }, ballTo: { x: 5, y: -15 }, apex: 5.5 },
  { beat: 'return', hitter: 'fern', poseFrom: openingServe, poseTo: openingReturn, ballFrom: { x: 5, y: -15 }, ballTo: { x: -5, y: 14 }, apex: 4.5 },
  { beat: 'approach', hitter: 'esemem', poseFrom: openingReturn, poseTo: openingKitchen, ballFrom: { x: -5, y: 14 }, ballTo: { x: 1, y: -9 }, apex: 3 },
  { beat: 'dink1', hitter: 'davinci', poseFrom: openingKitchen, poseTo: openingDink, poseAfter: openingDinkAfter, ballFrom: { x: 1, y: -9 }, ballTo: { x: 1, y: 8 }, apex: 1.3 },
  { beat: 'dink2', hitter: 'esopi', poseFrom: openingDinkAfter, poseTo: openingDink2, poseAfter: openingDink2After, ballFrom: { x: 1, y: 8 }, ballTo: { x: 2, y: -8 }, apex: 1.3 },
  { beat: 'winner', hitter: 'davinci', poseFrom: openingDink2After, poseTo: openingWinner, ballFrom: { x: 2, y: -8 }, ballTo: { x: 8, y: 20 }, ballRest: { x: 8.4, y: 20.5 }, apex: 4 },
  { beat: 'reset', hitter: 'fern', poseFrom: openingWinner, poseTo: ready, ballFrom: { x: 8.4, y: 20.5 }, ballTo: { x: 8.4, y: 20.5 }, apex: 0 },
])

const mirror = script([
  { beat: 'serve', hitter: 'fern', poseFrom: mirrorServe, poseTo: mirrorServe, ballFrom: { x: 6, y: -23 }, ballTo: { x: 5, y: 15 }, apex: 5.5 },
  { beat: 'return', hitter: 'esopi', poseFrom: mirrorServe, poseTo: mirrorReturn, ballFrom: { x: 5, y: 15 }, ballTo: { x: -4, y: -14 }, apex: 4.5 },
  { beat: 'approach', hitter: 'davinci', poseFrom: mirrorReturn, poseTo: mirrorKitchen, ballFrom: { x: -4, y: -14 }, ballTo: { x: 1, y: 9 }, apex: 3 },
  { beat: 'dink1', hitter: 'esemem', poseFrom: mirrorKitchen, poseTo: mirrorDink, poseAfter: mirrorDinkAfter, ballFrom: { x: 1, y: 9 }, ballTo: { x: 1, y: -8 }, apex: 1.3 },
  { beat: 'dink2', hitter: 'fern', poseFrom: mirrorDinkAfter, poseTo: mirrorDink2, poseAfter: mirrorDink2After, ballFrom: { x: 1, y: -8 }, ballTo: { x: 2, y: 8 }, apex: 1.3 },
  { beat: 'winner', hitter: 'esemem', poseFrom: mirrorDink2After, poseTo: mirrorWinner, ballFrom: { x: 2, y: 8 }, ballTo: { x: 7, y: -20 }, ballRest: { x: 7.4, y: -20.5 }, apex: 4 },
  { beat: 'reset', hitter: 'esopi', poseFrom: mirrorWinner, poseTo: ready, ballFrom: { x: 7.4, y: -20.5 }, ballTo: { x: 7.4, y: -20.5 }, apex: 0 },
])

export function beatWindow(beat: BeatName): { start: number; end: number } {
  let start = 0
  for (const name of beats) {
    const end = start + beatDuration[name]
    if (name === beat) return { start, end }
    start = end
  }
  return { start: 0, end: 0 }
}

export function inNearRightServiceBox(point: Point): boolean {
  return point.x > 0 && point.x <= court.halfWidth && point.y < -court.kitchen && point.y >= -court.baseline
}

export function inFarRightServiceBox(point: Point): boolean {
  return point.x > 0 && point.x <= court.halfWidth && point.y > court.kitchen && point.y <= court.baseline
}

export function onFarLeft(point: Point): boolean {
  return point.x < 0 && point.y > court.kitchen
}

export function outsideKitchen(y: number): boolean {
  return Math.abs(y) >= court.kitchen
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function lerpPoint(from: Point, to: Point, t: number): Point {
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }
}

function lerpPose(from: Pose, to: Pose, t: number): Pose {
  return {
    esemem: lerpPoint(from.esemem, to.esemem, t),
    esopi: lerpPoint(from.esopi, to.esopi, t),
    davinci: lerpPoint(from.davinci, to.davinci, t),
    fern: lerpPoint(from.fern, to.fern, t),
  }
}

function arc(from: Point, to: Point, t: number, apex: number): Vec {
  const point = lerpPoint(from, to, t)
  return { ...point, z: Math.sin(Math.PI * t) * apex }
}

function ballAt(shot: Shot, localT: number): Vec {
  if (shot.beat === 'winner' && shot.ballRest) {
    if (localT < WINNER_FIRST_BOUNCE) return arc(shot.ballFrom, shot.ballTo, localT / WINNER_FIRST_BOUNCE, shot.apex)
    if (localT < WINNER_SECOND_BOUNCE) {
      const t = (localT - WINNER_FIRST_BOUNCE) / (WINNER_SECOND_BOUNCE - WINNER_FIRST_BOUNCE)
      return arc(shot.ballTo, shot.ballRest, t, shot.apex * 0.35)
    }
    return { ...shot.ballRest, z: 0 }
  }
  if (shot.apex === 0) return { ...shot.ballTo, z: 0 }
  return arc(shot.ballFrom, shot.ballTo, localT, shot.apex)
}

function poseAt(shot: Shot, localT: number): Pose {
  if (shot.poseAfter && (shot.beat === 'dink1' || shot.beat === 'dink2')) {
    if (localT < DINK_BOUNCE) return lerpPose(shot.poseFrom, shot.poseTo, localT / DINK_BOUNCE)
    return lerpPose(shot.poseAfter, shot.poseAfter, 0)
  }
  return lerpPose(shot.poseFrom, shot.poseTo, localT)
}

function swinging(shot: Shot, localT: number): boolean {
  if (shot.beat === 'reset' || shot.hitter == null) return false
  if (shot.beat === 'winner') return localT < 0.28
  return localT < 0.4
}

export function scoreAt(elapsedMs: number): { far: number; near: number } {
  const loops = Math.floor(elapsedMs / cycleDuration)
  const into = elapsedMs - loops * cycleDuration
  const second = beatWindow('winner').start + beatDuration.winner * WINNER_SECOND_BOUNCE
  return {
    far: loops + (into >= rallyDuration + second ? 1 : 0),
    near: loops + (into >= second ? 1 : 0),
  }
}

function sampleScript(shots: Shot[], elapsedInRally: number, score: { far: number; near: number }): RallySample {
  let start = 0
  let shot = shots[shots.length - 1]
  let localT = 1
  for (const next of shots) {
    const end = start + beatDuration[next.beat]
    if (elapsedInRally < end) {
      shot = next
      localT = (elapsedInRally - start) / beatDuration[next.beat]
      break
    }
    start = end
  }
  const ball = ballAt(shot, localT)
  return {
    score,
    hitter: shot.hitter,
    swinging: swinging(shot, localT),
    players: poseAt(shot, localT),
    ball,
    shadow: { x: ball.x, y: ball.y },
  }
}

export function sampleRally(elapsedMs: number): RallySample {
  const safe = Math.max(0, elapsedMs)
  const loops = Math.floor(safe / cycleDuration)
  const into = safe - loops * cycleDuration
  const score = scoreAt(safe)
  if (into < rallyDuration) return sampleScript(opening, into, score)
  return sampleScript(mirror, into - rallyDuration, score)
}

export function restFrame(): RallySample {
  return {
    score: { far: 0, near: 0 },
    hitter: null,
    swinging: false,
    players: ready,
    ball: { x: 0, y: 0, z: 4 },
    shadow: { x: 0, y: 0 },
  }
}
