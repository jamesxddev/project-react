import { describe, expect, it } from 'vitest'
import {
  DINK_BOUNCE,
  WINNER_SECOND_BOUNCE,
  beatDuration,
  beatWindow,
  cycleDuration,
  inFarRightServiceBox,
  inNearRightServiceBox,
  onFarLeft,
  outsideKitchen,
  rallyDuration,
  restFrame,
  sampleRally,
} from './rally.ts'

function at(ms: number) {
  return sampleRally(ms)
}

describe('opening rally', () => {
  it('returns the same sample for the same elapsed time', () => {
    expect(sampleRally(840)).toEqual(sampleRally(840))
  })

  it('lands the opening serve in the near-right service box', () => {
    const landing = at(beatWindow('serve').end)
    expect(landing.players.esopi.y).toBeGreaterThan(22)
    expect(inNearRightServiceBox(landing.ball)).toBe(true)
    expect(landing.ball.z).toBe(0)
  })

  it('runs Esopi, Fern, Esemem, then DaVinci', () => {
    expect(at(beatWindow('serve').start + 10).hitter).toBe('esopi')
    expect(at(beatWindow('return').start + 10).hitter).toBe('fern')
    expect(at(beatWindow('approach').start + 10).hitter).toBe('esemem')
    expect(at(beatWindow('dink1').start + 10).hitter).toBe('davinci')
    expect(at(beatWindow('winner').start + 10).hitter).toBe('davinci')
    expect(onFarLeft(at(beatWindow('return').end).ball)).toBe(true)
  })

  it('keeps a dink hitter outside the kitchen until the bounce', () => {
    const dink = beatWindow('dink1')
    const before = at(dink.start + beatDuration.dink1 * (DINK_BOUNCE - 0.05))
    expect(before.hitter).toBe('davinci')
    expect(outsideKitchen(before.players.davinci.y)).toBe(true)
    const esopi = beatWindow('dink2')
    const esopiBefore = at(esopi.start + beatDuration.dink2 * (DINK_BOUNCE - 0.05))
    expect(esopiBefore.hitter).toBe('esopi')
    expect(outsideKitchen(esopiBefore.players.esopi.y)).toBe(true)
  })

  it('gives the near team the point only after the second bounce', () => {
    const winner = beatWindow('winner')
    const bounce = winner.start + beatDuration.winner * WINNER_SECOND_BOUNCE
    expect(at(bounce - 1).score).toEqual({ far: 0, near: 0 })
    expect(at(bounce).score).toEqual({ far: 0, near: 1 })
    const flight = at(winner.start + beatDuration.winner * 0.4)
    expect(flight.ball.y).toBeGreaterThan(flight.players.esopi.y)
  })
})

describe('mirrored rally', () => {
  it('serves from Fern into the far-right box and scores for the far team', () => {
    const start = rallyDuration
    const serve = at(start + 10)
    expect(serve.hitter).toBe('fern')
    expect(serve.players.fern.y).toBeLessThan(-22)
    expect(serve.score).toEqual({ far: 0, near: 1 })
    const landing = at(start + beatWindow('serve').end)
    expect(inFarRightServiceBox(landing.ball)).toBe(true)
    const bounce = start + beatWindow('winner').start + beatDuration.winner * WINNER_SECOND_BOUNCE
    expect(at(bounce - 1).score).toEqual({ far: 0, near: 1 })
    expect(at(bounce).score).toEqual({ far: 1, near: 1 })
  })

  it('returns to Esopi with both points kept and keeps feet on one side', () => {
    const next = at(cycleDuration)
    expect(next.hitter).toBe('esopi')
    expect(next.score).toEqual({ far: 1, near: 1 })
    for (let elapsed = 0; elapsed < cycleDuration; elapsed += 250) {
      const sample = at(elapsed)
      expect(sample.players.esemem.y).toBeGreaterThan(0)
      expect(sample.players.esopi.y).toBeGreaterThan(0)
      expect(sample.players.davinci.y).toBeLessThan(0)
      expect(sample.players.fern.y).toBeLessThan(0)
    }
  })

  it('holds a still court above center', () => {
    const rest = restFrame()
    expect(rest.score).toEqual({ far: 0, near: 0 })
    expect(rest.swinging).toBe(false)
    expect(rest.hitter).toBeNull()
    expect(rest.ball).toEqual({ x: 0, y: 0, z: 4 })
    expect(rest.shadow).toEqual({ x: 0, y: 0 })
    expect(rest.players.esemem.x).toBeLessThan(0)
    expect(rest.players.esopi.x).toBeGreaterThan(0)
    expect(rest.players.fern.x).toBeGreaterThan(0)
  })
})
