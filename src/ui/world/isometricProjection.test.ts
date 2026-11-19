import { describe, expect, it } from 'vitest'
import { isometricGround, projectIsometric } from './isometricProjection'

describe('camera-relative isometric movement (v0.6.1)', () => {
  it.each([
    ['ArrowUp', 0, -1],
    ['ArrowDown', 0, 1],
    ['ArrowLeft', -1, 0],
    ['ArrowRight', 1, 0],
    ['up+right', 1, -1],
    ['down+left', -1, 1],
  ])('%s maps screen input to the same visible direction', (_name, screenX, screenY) => {
    const world = isometricGround(screenX, screenY)
    const projected = projectIsometric(world.x, world.y)
    expect(projected.x).toBeCloseTo(screenX, 8)
    expect(projected.y).toBeCloseTo(screenY, 8)
  })

  it('opposites cancel, leaving auto-path movement untouched', () => {
    expect(isometricGround(0, 0)).toEqual({ x: 0, y: 0 })
    expect(isometricGround(0, -1).x).toBeLessThan(0)
    expect(isometricGround(0, -1).y).toBeLessThan(0)
  })
})
