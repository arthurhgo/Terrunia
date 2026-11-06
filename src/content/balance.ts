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
  /** BALANCE_DRAFT: early levels arrive sooner so three to four combat wins provide a rank. */
  xpThresholds: [0, 100, 260, 480, 760, 1100, 1550, 2100, 2800, 3650, 4700, 6000, 7550, 9350] as const,
  /** BALANCE_DRAFT: multiply encounter XP only on reward claim; never Essence Points. */
  combatXpMultiplier: 1.5,
  /** BALANCE_DRAFT: two player turn starts before the next skill cast. */
  defaultPlayerSkillCooldownTurns: 2,
  /** BALANCE_DRAFT: defending blocks exactly the first incoming damaging hit. */
  defendBlocksFirstHit: true,
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
  defendMitigation: 2,
} as const
