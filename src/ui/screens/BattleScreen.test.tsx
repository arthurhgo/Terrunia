import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { createBattle } from '../../domain/combat/engine'
import { useGameStore } from '../../state/gameStore'
import { BattleScene } from './BattleScreen'

const createBattleSave = () => {
  const original = createNewSave('combat-ui', 'Thaur', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(original, content, undefined, 'combat-weapon')
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.world.currentLocationId = 'astravel_fungorro_01'
  save.battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'battle_ui_01')
  useGameStore.setState({
    status: 'ready', save, ownerId: save.ownerId, syncMode: 'local',
    syncStatus: 'saved', notification: null,
  })
  return save
}

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('combate visual v0.17', () => {
  it('mostra iniciativa e centraliza ataque, magia e habilidade, deixando opções ausentes cinzas', () => {
    createBattleSave()
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    const combat = screen.getByRole('button', { name: 'ATAQUE · MAGIAS · HABILIDADES' })
    expect(combat).toBeEnabled()
    expect(screen.getByRole('button', { name: 'ARREMESSÁVEIS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'RUNAS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ESSÊNCIAS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ITENS / POÇÕES' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'FUGIR' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'DEFENDER' })).toBeEnabled()
    const turnOrder = screen.getByLabelText('Ordem de turnos')
    expect(turnOrder).toHaveTextContent(String(useGameStore.getState().save!.battle!.combatants.combatant_player.initiative))
    expect(screen.getByRole('status')).toHaveTextContent('TURNO DE TERRÍRIAN')
    fireEvent.click(combat)
    expect(screen.getByRole('button', { name: /ATAQUE BÁSICO/ })).toBeEnabled()
    expect(screen.getByText('ATAQUE · MAGIAS · HABILIDADES', { selector: '.pixel-battle__submenu-heading' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'MAGIAS' })).not.toBeInTheDocument()
  })

  it('mostra drops repetidos agrupados e recolhe tudo com uma ação sem seleção individual', () => {
    const save = createBattleSave()
    save.battle!.phase = 'Victory'
    save.battle!.waveIndex = 1
    save.battle!.rewards.lootDefinitionIds = [
      'drop_fungal_nucleus', 'drop_fungal_nucleus', 'drop_spore_cluster',
    ]
    save.battle!.rewards.gold = 9
    save.battle!.rewards.characterXp = 12
    save.inventory.push({
      instanceId: 'old-nucleus', definitionId: 'drop_fungal_nucleus',
      quantity: 3, rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt,
    })
    useGameStore.setState({ save })
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    const loot = screen.getByLabelText('Espólios disponíveis')
    expect(loot).toHaveTextContent('Núcleo Fúngico ×2')
    expect(loot.querySelectorAll('button')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'RECOLHER TODOS OS ESPÓLIOS' }))
    const updated = useGameStore.getState().save!
    expect(updated.battle?.claimed).toBe(true)
    expect(updated.inventory.filter((entry) => entry.definitionId === 'drop_fungal_nucleus')).toHaveLength(1)
    expect(updated.inventory.find((entry) => entry.instanceId === 'old-nucleus')?.quantity).toBe(5)
    expect(updated.inventory.find((entry) => entry.definitionId === 'drop_spore_cluster')?.quantity).toBe(1)
    expect(updated.wallet.gold).toBe(save.wallet.gold + 9)
    expect(screen.getByRole('button', { name: /PRÓXIMA ONDA/ })).toBeEnabled()
  })
})
