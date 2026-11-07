import { describe, it, expect } from 'vitest'
import { playerCopy } from './playerCopy'

describe('texto visível ao jogador', () => {
  it('não exibe decisões internas, nem frases investigativas de bastidor', () => {
    expect(playerCopy('Hipótese investigativa. A origem definitiva da marca continua não determinada (OWNER_DECISION).')).toBe('')
    expect(playerCopy('Encontre Rosetta. Revisar curva (BALANCE_DRAFT). Retorne à cidade.')).toBe('Encontre Rosetta. Retorne à cidade.')
  })
  it('preserva objetivos e recompensas legítimas', () => {
    expect(playerCopy('Reúna 2 Núcleos · 45 Ouro.')).toBe('Reúna 2 Núcleos · 45 Ouro.')
    expect(playerCopy(undefined)).toBe('')
  })
})
