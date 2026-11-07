import { describe, expect, it } from 'vitest'
import { calculateWorldViewport, cameraAt } from './worldViewport'

describe('v0.5.10 viewport geometry', () => {
  it('opens the baseline by approximately 30% without noninteger image scaling', () => {
    expect(calculateWorldViewport(1200, 800, 768, 512)).toEqual({ width: 499, height: 333 })
  })
  it('does not stretch a wide or portrait world view', () => {
    for (const [w,h] of [[1366,768],[1920,1080],[1440,900],[1024,768],[2560,1080],[844,390],[390,844]]) {
      const view = calculateWorldViewport(w,h,768,512)
      expect(view.width).toBeGreaterThan(0)
      expect(view.height).toBeGreaterThan(0)
      expect(view.width).toBeLessThanOrEqual(768)
      expect(view.height).toBeLessThanOrEqual(512)
      expect(Math.abs(view.width / view.height - w / h)).toBeLessThan(.01)
    }
  })
  it('clamps at map edges without modifying actor positions', () => {
    const v = { width: 499, height: 333 }, w = { width: 768, height: 512 }
    expect(cameraAt({ x: 0, y: 0 }, v, w)).toEqual({ x: 0, y: 0 })
    expect(cameraAt({ x: 768, y: 512 }, v, w)).toEqual({ x: 269, y: 179 })
  })
})
