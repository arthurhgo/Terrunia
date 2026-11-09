import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { BattleDicePlatform } from './BattleDicePlatform'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('dado lançado diretamente na arena', () => {
  const roll = { id: 'battle_log_1', sides: 8 as const, face: 5, damage: 9,
    action: 'Ataque da arma', actorName: 'Terrírian', actorSide: 'player' as const }

  it('revela resultado real depois da animação e identifica quem rolou', () => {
    vi.useFakeTimers()
    const { container } = render(<BattleDicePlatform roll={roll} reducedMotion={false}
      playerAppearance={DEFAULT_CHARACTER_APPEARANCE} />)
    expect(screen.getByRole('status', { name: /Lançamento visual de d8/ })).toHaveClass('battle-dice-platform--in-arena')
    expect(screen.getByLabelText('Quem está rolando: Terrírian')).toBeInTheDocument()
    expect(container.querySelector('.battle-dice-platform__veil')).toBeInTheDocument()
    expect(screen.queryByText('9 de dano')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1700) })
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
    expect(screen.getByText('d8: 5')).toBeInTheDocument()
  })

  it('mostra crítico somente ao revelar face máxima confirmada pelo motor', () => {
    const critical = { ...roll, face: 8, damage: 15, critical: true }
    const { container } = render(<BattleDicePlatform roll={critical} reducedMotion />)
    expect(screen.getByText('d8: 8')).toBeInTheDocument()
    expect(screen.getByText('ACERTO CRÍTICO!')).toBeInTheDocument()
    expect(container.querySelector('.is-critical-roll')).toBeInTheDocument()
    cleanup()
    render(<BattleDicePlatform roll={{ ...roll, critical: false }} reducedMotion />)
    expect(screen.queryByText('ACERTO CRÍTICO!')).not.toBeInTheDocument()
  })

  it('não mostra resultado até o jogador arrastar o dado no painel de ações', () => {
    const { container } = render(<BattleDicePlatform roll={roll} reducedMotion={false} awaitingClick />)
    expect(container.querySelector('.battle-dice-platform__stage')).not.toBeInTheDocument()
    expect(screen.queryByText('9 de dano')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Arrastar dado/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Quem está rolando: Terrírian')).toBeInTheDocument()
  })

  it('respeita movimento reduzido e preserva o resultado', () => {
    render(<BattleDicePlatform roll={roll} reducedMotion />)
    expect(screen.getByText('9 de dano')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /Lançamento visual de d8/ })).toHaveClass('is-settled')
  })
})
