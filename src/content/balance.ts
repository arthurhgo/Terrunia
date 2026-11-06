export const BALANCE = {
  status: 'BALANCE_DRAFT' as const,
  essenceThresholds: [100, 125, 150, 180, 215, 255, 300, 350, 405, 465],
  essenceFallbackGrowth: 1.15,
  initialGold: 0,
  /** Owner-approved v0.5.4: six points; all seven initial weapons reachable. */
  characterCreationAttributePoints: 6,
  /** BALANCE_DRAFT v0.5.7: each level grants one point; two points advance the die. */
  attributePointsPerLevel: 1,
  defaultAttributeDie: 4,
  attributeDieOrder: [4, 6, 8, 10, 12] as const,
  // One rank advances exactly two die faces: d4 -> d6 -> d8 -> d10 -> d12.
  attributeDieFaceStep: 2,
  /** BALANCE_DRAFT v0.5.2: each d4→d6→d8→d10→d12 rank costs TWO attribute points. */
  attributePointsPerDieUpgrade: 2,
  /** BALANCE_DRAFT: gentler early XP curve; final values remain OWNER_DECISION. */
  xpThresholds: [0, 180, 540, 1080, 1800, 2880, 4320, 6120, 8280, 10800, 13680, 17280, 21600, 26640] as const,
  // Rebased with d4 defaults so the vertical slice keeps its previous survivability.
  baseHp: 12,
  vigorHpMultiplier: 2,
  baseMana: 7,
  spiritManaMultiplier: 1,
  boundGradeResonance: {
    1: 0,
    2: 100,
    3: 300,
    4: 700,
    5: 1300,
    6: 2200,
    7: 3500,
  },
  /** BALANCE_DRAFT v0.5.7: combat die is centered on its midpoint, then adjusts damage. */
  combatDieCentered: true,
  defendMitigation: 2,
} as const
