/** v0.5.15.2 BALANCE_DRAFT. No Clan/Class or weapon-specific rule invented.
 * Default proposal: two hits at 30% EACH of one fully resolved original attack
 * (60% combined). OWNER_DECISION can change the distribution later.
 * The damage die is rolled once for the entire action.
 */
export const DOUBLE_ATTACK_V05152={
 fractionPerHit:0.30,
 impacts:2,
 distribution:'eachHit' as const,
} as const
