export const BALANCE = {
  status: 'BALANCE_DRAFT' as const,
  essenceThresholds: [100, 125, 150, 180, 215, 255, 300, 350, 405, 465],
  essenceFallbackGrowth: 1.15,
  initialGold: 0,
  /** Owner-approved v0.5.4: six points; all seven initial weapons reachable. */
  characterCreationAttributePoints: 6,
  attributePointsPerLevel: 1,
  defaultAttributeDie: 4,
  attributeDieOrder: [4, 6, 8, 10, 12] as const,
  // One rank advances exactly two die faces: d4 -> d6 -> d8 -> d10 -> d12.
  attributeDieFaceStep: 2,
  /** BALANCE_DRAFT v0.5.2: each d4→d6→d8→d10→d12 rank costs TWO attribute points. */
  attributePointsPerDieUpgrade: 2,
  xpThresholds: [0, 250, 750, 1500, 2500, 4000, 6000, 8500, 11500, 15000, 19000, 24000, 30000, 37000] as const,
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
  /** BALANCE_DRAFT v0.5.7 — Guard applies to all hits until the next player action. */
  defendMitigation: 4,
  /** BALANCE_DRAFT — consecutive own rounds that a skill remains unavailable. */
  skillCooldownRounds: 2,
  /** BALANCE_DRAFT — faster XP from one-time battles and mission payouts. */
  characterXpRewardMultiplier: 1.5,
} as const
