import { BALANCE } from '../../content/balance'
import type { EssenceProgress } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export type EssenceGain = {
  progress: EssenceProgress
  gainedPoints: number
  appliedEssence: number
}

export const getEssenceThreshold = (
  cycle: number,
  thresholds: readonly number[] = BALANCE.essenceThresholds,
  fallbackGrowth = BALANCE.essenceFallbackGrowth,
) => {
  if (cycle < thresholds.length) return thresholds[cycle]
  const last = thresholds.at(-1) ?? 100
  const extraCycles = cycle - thresholds.length + 1
  return Math.round(last * fallbackGrowth ** extraCycles)
}

export const addRawEssence = (
  progress: EssenceProgress,
  amount: number,
  thresholds: readonly number[] = BALANCE.essenceThresholds,
): Result<EssenceGain> => {
  if (!Number.isFinite(amount) || amount < 0) {
    return fail('INVALID_ESSENCE_AMOUNT', 'A quantidade de Essência deve ser um número positivo.')
  }

  const next: EssenceProgress = {
    ...progress,
    current: progress.current + amount,
    lifetimeEssence: progress.lifetimeEssence + amount,
  }
  let gainedPoints = 0

  while (next.current >= next.required) {
    next.current -= next.required
    next.essencePoints += 1
    next.cycle += 1
    gainedPoints += 1
    next.required = getEssenceThreshold(next.cycle, thresholds)
  }

  return ok({ progress: next, gainedPoints, appliedEssence: amount })
}
