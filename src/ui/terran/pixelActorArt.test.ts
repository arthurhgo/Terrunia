import { describe, expect, it } from 'vitest'
import { getActorMatrix } from './pixelActorArt'

describe('matriz dos sprites', () => {
  it('mantém exatamente 16×16 pixels em todas as direções e passos', () => {
    for (const facing of ['up', 'down', 'left', 'right'] as const) {
      for (let step = 0; step < 3; step += 1) {
        const matrix = getActorMatrix(facing, step)
        expect(matrix.length).toBe(16)
        expect(matrix.every((row) => row.length === 16)).toBe(true)
        expect(matrix.every((row) => /^[.ohsclab]{16}$/.test(row))).toBe(true)
      }
    }
  })

  it('separa visão posterior e frontal, e alterna a passada', () => {
    expect(getActorMatrix('up', 0)).not.toEqual(getActorMatrix('down', 0))
    expect(getActorMatrix('left', 0)).not.toEqual(getActorMatrix('right', 0))
    expect(getActorMatrix('down', 0)).not.toEqual(getActorMatrix('down', 1))
  })
})
