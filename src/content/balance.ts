export const BALANCE = {
  status: 'BALANCE_DRAFT' as const,
  essenceThresholds: [100, 125, 150, 180, 215, 255, 300, 350, 405, 465],
  essenceFallbackGrowth: 1.15,
  initialGold: 0,
  defaultAttributeDie: 6,
  boundGradeResonance: {
    1: 0,
    2: 100,
    3: 300,
    4: 700,
    5: 1300,
    6: 2200,
    7: 3500,
  },
  defendMitigation: 2,
} as const
