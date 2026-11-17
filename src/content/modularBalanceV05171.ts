/**
 * v0.5.17.1 economic sandbox. All numbers are BALANCE_DRAFT, NOT canon.
 * Owners may rebalance these values without rewriting the combat FSM or saves.
 * Parts are never entire weapons; tiers are independent from the 7 Bond Grades.
 */
export const MODULAR_BALANCE_V05171 = {
 status: 'BALANCE_DRAFT',
 pricesByTier: [0, 12, 32, 80, 168, 310],
 minLevelByTier: [0, 1, 4, 7, 10, 13],
 forgeFeeFraction: 0.25,
 trailGuaranteedPart: true,
 // Repeated waves should reward progress, but never guarantee high-tier parts.
 // One structural part per wave at most, independent of number of enemies.
 waveBandDropPercent: [
  { through: 3, percent: 70 },
  { through: 7, percent: 55 },
  { through: 11, percent: 45 },
  { through: 19, percent: 35 },
  { through: 999999, percent: 30 },
 ],
 // At wave 20+, most parts stay T3. T5 is explicitly rare, not automatic.
 advancedWaveTier4Percent: 35,
 advancedWaveTier5Percent: 8,
 // A region-linked source for Fogo/Água/Terra/Ar is still OWNER_DECISION.
 // Keep historical loot in saves; do not create new elemental drops blindly.
 elementalGemDropsEnabled: false,
} as const

export function modularWaveDropPercentV05171(wave: number): number {
 const value = Number.isFinite(wave) ? Math.max(1,Math.floor(wave)) : 1
 return MODULAR_BALANCE_V05171.waveBandDropPercent.find(band=>value<=band.through)?.percent ?? 30
}

export function modularAssemblyFeeV05171(partPrice: number): number {
 return Math.max(0,Math.floor(partPrice*MODULAR_BALANCE_V05171.forgeFeeFraction))
}
