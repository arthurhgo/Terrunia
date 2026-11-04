import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
afterEach(() => { cleanup(); vi.useRealTimers(); useGameStore.getState().resetSession() })

describe('combate visual v0.17', () => {
  it('mostra iniciativa e centraliza ataque, magia e habilidade, deixando opções ausentes cinzas', () => {
    vi.useFakeTimers()
    createBattleSave()
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1600) })
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
    expect(screen.getAllByRole('status').some((element) => element.textContent?.includes('TURNO DE TERRÍRIAN'))).toBe(true)
    fireEvent.click(combat)
    expect(screen.getByRole('button', { name: /ATAQUE BÁSICO/ })).toBeEnabled()
    expect(screen.getByText('ATAQUE · MAGIAS · HABILIDADES', { selector: '.pixel-battle__submenu-heading' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'MAGIAS' })).not.toBeInTheDocument()
  })

  it('aguarda a sequência de dados antes de aplicar dano e avançar turnos no save', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    const initialLogCount = save.battle!.log.length
    const initialHp = save.battle!.combatants.combatant_player.hp
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1600) })
    fireEvent.click(screen.getByRole('button', { name: 'ATAQUE · MAGIAS · HABILIDADES' }))
    fireEvent.click(screen.getByRole('button', { name: /ATAQUE BÁSICO/ }))
    expect(screen.getByRole('status', { name: /Lançamento visual de d/ })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle?.log).toHaveLength(initialLogCount)
    expect(useGameStore.getState().save?.battle?.combatants.combatant_player.hp).toBe(initialHp)
    act(() => { vi.advanceTimersByTime(4500) })
    expect(useGameStore.getState().save?.battle?.log.length).toBeGreaterThan(initialLogCount)
  })

  it('mostra cinco slots reais; vazios cinza; hover/foco e toque revelam atributos do equipamento', () => {
    createBattleSave()
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    const slots = screen.getByLabelText('Cinco slots de equipamentos')
    expect(slots.querySelectorAll('[data-gear-slot]')).toHaveLength(5)
    const weapon = screen.getByRole('button', { name: /Arma: Arma Básica Vinculada/ })
    const shield = screen.getByRole('button', { name: 'Escudo / Protetor: Não equipado' })
    expect(weapon).toHaveAttribute('data-gear-state', 'bound')
    expect(shield).toHaveAttribute('data-gear-state', 'empty')
    expect(shield).toHaveAttribute('aria-disabled', 'true')
    expect(container.querySelector('.battle-gear__summary')).toHaveTextContent('Poder')
    fireEvent.mouseEnter(weapon)
    const tip = screen.getByRole('tooltip', { name: 'Detalhes de Arma' })
    expect(tip).toHaveTextContent('Vínculo · Grau 1')
    expect(tip).toHaveTextContent('Poder base da arma')
    expect(tip).toHaveTextContent('Ressonância')
    fireEvent.mouseLeave(weapon)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.focus(shield)
    expect(screen.getByRole('tooltip', { name: 'Detalhes de Escudo / Protetor' })).toHaveTextContent('Slot vazio')
    fireEvent.blur(shield)
    fireEvent.click(shield)
    expect(screen.getByRole('dialog', { name: 'Detalhes de Escudo / Protetor' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(weapon)
    expect(screen.getByRole('dialog', { name: 'Detalhes de Arma' })).toHaveTextContent('Poder base da arma')
    fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhes do equipamento' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra armadura temporária refinada no slot correto e resumo sem bônus fictícios', () => {
    const save = createBattleSave()
    save.equippedBasicArmor = {
      instanceId: 'starter-tunic-ui', definitionId: 'equipment_worn_linen_tunic',
      quantity: 1, rarity: 'common', locked: false, favorite: false,
      acquiredAt: save.updatedAt, refinementLevel: 1,
    }
    save.character.basicArmorInstanceId = 'starter-tunic-ui'
    save.battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'battle_ui_armor')
    useGameStore.setState({ save })
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    const slot = screen.getByRole('button', { name: 'Armadura: Túnica de Linho Gasta +1' })
    expect(slot).toHaveAttribute('data-gear-state', 'simple')
    expect(slot).toHaveTextContent('Armadura')
    expect(screen.getByLabelText('Bônus diretos dos equipamentos')).toHaveTextContent('Def +2')
    fireEvent.mouseEnter(slot)
    const tooltip = screen.getByRole('tooltip', { name: 'Detalhes de Armadura' })
    expect(tooltip).toHaveTextContent('Proteção simples · Tier 1 · Refinamento +1')
    expect(tooltip).toHaveTextContent('Defesa')
    expect(tooltip).toHaveTextContent('+2')
    expect(tooltip).not.toHaveTextContent('Ressonância')
    expect(screen.getByRole('button', { name: 'Colar: Não equipado' })).toHaveAttribute('data-gear-state', 'empty')
    expect(screen.getByRole('button', { name: 'Pulseira: Não equipado' })).toHaveAttribute('data-gear-state', 'empty')
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
