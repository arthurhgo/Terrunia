import { describe, expect, it } from 'vitest'
import type { EssenceProgress } from '../game/types'
import { addRawEssence } from './essence'

const progress = (overrides: Partial<EssenceProgress> = {}): EssenceProgress => ({
  current: 0,
  required: 100,
  essencePoints: 0,
  lifetimeEssence: 0,
  cycle: 0,
  ...overrides,
})

describe('progressão de Essência', () => {
  it('concede exatamente um ponto ao completar uma barra', () => {
    const result = addRawEssence(progress(), 100, [100, 125])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.gainedPoints).toBe(1)
    expect(result.value.progress).toMatchObject({ current: 0, required: 125, essencePoints: 1, cycle: 1 })
  })

  it('preserva overflow e processa múltiplas barras', () => {
    const result = addRawEssence(
      progress({ current: 850, required: 1000 }),
      2400,
      [1000, 1000, 1000, 1000],
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.gainedPoints).toBe(3)
    expect(result.value.progress.current).toBe(250)
    expect(result.value.progress.essencePoints).toBe(3)
    expect(result.value.progress.lifetimeEssence).toBe(2400)
  })

  it('rejeita valores negativos', () => {
    expect(addRawEssence(progress(), -1).ok).toBe(false)
  })
})
