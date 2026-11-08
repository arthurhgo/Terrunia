import { describe, expect, it } from 'vitest'
import { getEnemyFormationSlot } from './enemyFormation'
describe('formação escalonada visual de inimigos', () => {
  for (const count of [1, 2, 3, 4, 5]) {
    it(`mantém ${count} inimigo(s) no cenário, em slots sem sobreposição horizontal`, () => {
      const slots = Array.from({ length: count }, (_, i) => getEnemyFormationSlot(i, count))
      expect(slots[0].depthPx).toBe(0)
      for (let i = 0; i < count; i++) {
        expect(slots[i].xPercent).toBeGreaterThanOrEqual(0)
        expect(slots[i].xPercent + slots[i].widthPercent).toBeLessThanOrEqual(101)
        if (i) {
          expect(slots[i].xPercent).toBeGreaterThan(slots[i - 1].xPercent)
          expect(slots[i].depthPx).toBeGreaterThan(slots[i - 1].depthPx)
          expect(slots[i].xPercent).toBeGreaterThanOrEqual(slots[i - 1].xPercent + slots[i - 1].widthPercent - 1)
        }
      }
    })
  }
  it('não depende de HP, turno, posição do alvo ou identidade', () => {
    expect(getEnemyFormationSlot(1, 3)).toEqual(getEnemyFormationSlot(1, 3))
    expect(getEnemyFormationSlot(99, 3)).toEqual(getEnemyFormationSlot(2, 3))
  })
})
