export type DraftStatus = 'CANON' | 'BALANCE_DRAFT' | 'CONTENT_DRAFT' | 'OWNER_DECISION'

export type Result<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const fail = (code: string, message: string): Result<never> => ({
  ok: false,
  code,
  message,
})

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique'

export type ModifierOperation = 'flat' | 'multiply'

export type Effect =
  | {
      type: 'statModifier'
      stat: 'attackPower' | 'mitigation' | 'maxHp' | 'initiative' | 'essenceGain'
      operation: ModifierOperation
      value: number
    }
  | { type: 'unlockSkill'; skillId: string }
  | { type: 'unlockReaction'; reactionId: string }
  | { type: 'resonanceModifier'; slot: BoundSlot; operation: ModifierOperation; value: number }

export const BOUND_SLOTS = ['weapon', 'shield', 'armor', 'necklace', 'bracelet'] as const
export type BoundSlot = (typeof BOUND_SLOTS)[number]

export const BOUND_SLOT_LABELS: Record<BoundSlot, string> = {
  weapon: 'Arma',
  shield: 'Escudo / Protetor',
  armor: 'Armadura',
  necklace: 'Colar',
  bracelet: 'Pulseira',
}
