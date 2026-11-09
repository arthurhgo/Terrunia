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
  it('mostra hotbar quadrada, sem ação de fuga inoperante, e defesa reversível', () => {
    vi.useFakeTimers()
    createBattleSave()
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    expect(screen.getByRole('status', { name: 'Separador de turno' })).toHaveTextContent('TURNO 1')
    act(() => { vi.advanceTimersByTime(1950) })
    const attack = screen.getByRole('button', { name: 'ATAQUE' })
    expect(attack).toBeEnabled()
    expect(screen.getByRole('button', { name: 'ARREMESSÁVEIS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'RUNAS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ESSÊNCIAS' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'POÇÕES' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'DEFENDER' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'FUGIR' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Barra de ações').querySelectorAll('.pixel-battle__command')).toHaveLength(8)
    const turnOrder = screen.getByLabelText('Ordem de turnos')
    expect(turnOrder.querySelectorAll('.combat-timeline__portrait')).toHaveLength(useGameStore.getState().save!.battle!.initiativeOrder.length)
    fireEvent.click(screen.getByRole('button', { name: 'DEFENDER' }))
    expect(screen.getByRole('group', { name: 'Confirmar defesa' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'CONFIRMAR DEFESA' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar sem defender' }))
    expect(screen.queryByRole('group', { name: 'Confirmar defesa' })).not.toBeInTheDocument()
    expect(attack).toBeEnabled()
  })

  it('Voltar do dado descarta preview sem gastar Mana, dano nem turno', () => {
    vi.useFakeTimers()
    createBattleSave()
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1950) })
    const before = structuredClone(useGameStore.getState().save!.battle!)
    fireEvent.click(screen.getByRole('button', { name: 'ATAQUE' }))
    expect(screen.getByRole('button', { name: /Usar Ataque em Área/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Usar Ataque Único/ }))
    expect(screen.getByRole('button', { name: /Usar Ataque em Área/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Usar Ataque Único/ }))
    expect(screen.getByRole('button', { name: /Usar Ataque em Área/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Usar Ataque Único/ }))
    expect(screen.getByRole('button', { name: 'Voltar antes de lançar o dado' })).toBeInTheDocument()
    expect(useGameStore.getState().save!.battle).toEqual(before)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar antes de lançar o dado' }))
    expect(screen.queryByRole('button', { name: 'Voltar antes de lançar o dado' })).not.toBeInTheDocument()
    expect(useGameStore.getState().save!.battle).toEqual(before)
    expect(screen.getByRole('button', { name: 'ATAQUE' })).toBeEnabled()
  })

  it('aguarda o lançamento real antes de aplicar dano e avançar o turno no save', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    const initialLogCount = save.battle!.log.length
    const initialHp = save.battle!.combatants.combatant_player.hp
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1950) })
    fireEvent.click(screen.getByRole('button', { name: 'ATAQUE' }))
    expect(useGameStore.getState().save?.battle?.log).toHaveLength(initialLogCount)
    expect(screen.getByRole('status', { name: /Lançamento visual de d/ })).toBeInTheDocument()
    const attackDie = screen.getByRole('button', { name: /Arrastar dado d/ })
    expect(attackDie.closest('.pixel-battle__actions')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /Lançamento visual de d/ })).toHaveClass('battle-dice-platform--in-arena')
    fireEvent.click(attackDie)
    expect(useGameStore.getState().save?.battle?.log).toHaveLength(initialLogCount)
    fireEvent.pointerDown(attackDie, { pointerId: 2, pointerType: 'mouse', isPrimary: true, button: 0, clientY: 160 })
    fireEvent.pointerMove(attackDie, { pointerId: 2, pointerType: 'mouse', isPrimary: true, clientY: 78 })
    fireEvent.pointerUp(attackDie, { pointerId: 2, pointerType: 'mouse', isPrimary: true, clientY: 78 })
    act(() => { vi.advanceTimersByTime(8000) })
    expect(useGameStore.getState().save?.battle?.log.length).toBeGreaterThan(initialLogCount)
    expect(useGameStore.getState().save?.battle?.combatants.combatant_player.hp).toBeLessThanOrEqual(initialHp)
  })

  it('encerra o foco do dado antes da animação, dos números de dano e da próxima jogada', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    const originalLog = save.battle!.log.length
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1950) })
    fireEvent.click(screen.getByRole('button', { name: 'ATAQUE' }))
    const die = screen.getByRole('button', { name: /Arrastar dado d/ })
    fireEvent.pointerDown(die, { pointerId: 11, pointerType: 'mouse', isPrimary: true, button: 0, clientY: 160 })
    fireEvent.pointerMove(die, { pointerId: 11, pointerType: 'mouse', isPrimary: true, clientY: 78 })
    fireEvent.pointerUp(die, { pointerId: 11, pointerType: 'mouse', isPrimary: true, clientY: 78 })

    act(() => { vi.advanceTimersByTime(3000) })
    expect(container.querySelector('.battle-dice-platform')).toBeInTheDocument()
    expect(container.querySelector('.pixel-battle__strike-fx')).not.toBeInTheDocument()
    expect(container.querySelector('.pixel-battle__damage-number')).not.toBeInTheDocument()
    expect(useGameStore.getState().save!.battle!.log).toHaveLength(originalLog)

    act(() => { vi.advanceTimersByTime(300) })
    expect(container.querySelector('.battle-dice-platform')).not.toBeInTheDocument()
    expect(container.querySelector('.pixel-battle__strike-fx')).toBeInTheDocument()
    expect(container.querySelector('.pixel-battle__damage-number')).toBeInTheDocument()
    expect(useGameStore.getState().save!.battle!.log).toHaveLength(originalLog)

    act(() => { vi.advanceTimersByTime(8500) })
    expect(container.querySelector('.pixel-battle__strike-fx')).not.toBeInTheDocument()
    expect(useGameStore.getState().save!.battle!.log.length).toBeGreaterThan(originalLog)
  })

  it('anuncia Turno 1 e só resolve iniciativa depois de arremessar o dado para cima', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    save.battle = createBattle(save, content.encounters.encounter_fungorro_01, content,
      'battle_initiative_ui', { manualInitiative: true })
    useGameStore.setState({ save })
    const initialLog = save.battle.log.length
    render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    expect(screen.getByText('TURNO 1', { selector: '.pixel-battle__round-curtain strong' })).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Arrastar dado de iniciativa d4 para cima para rolar' })
    expect(button).toBeDisabled()
    expect(useGameStore.getState().save?.battle?.phase).toBe('AwaitingInitiative')
    act(() => { vi.advanceTimersByTime(1850) })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useGameStore.getState().save?.battle?.log).toHaveLength(initialLog)
    fireEvent.pointerDown(button, { pointerId: 2, pointerType: 'touch', isPrimary: true, clientY: 150 })
    fireEvent.pointerMove(button, { pointerId: 2, pointerType: 'touch', isPrimary: true, clientY: 80 })
    fireEvent.pointerUp(button, { pointerId: 2, pointerType: 'touch', isPrimary: true, clientY: 80 })
    expect(screen.getByRole('status', { name: /Lançamento visual de d4 para iniciativa/ })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle?.log).toHaveLength(initialLog)
    act(() => { vi.advanceTimersByTime(13000) })
    const committed = useGameStore.getState().save?.battle
    expect(committed?.phase).not.toBe('AwaitingInitiative')
    expect(committed?.log.some((entry) => entry.roll?.action === 'Iniciativa')).toBe(true)
  })

  it('exibe status reais de monstros ao passar o mouse e marca a morte para animação', () => {
    const save = createBattleSave()
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    const enemyButton = screen.getAllByRole('button', { name: /Selecionar/ })[0]
    fireEvent.mouseEnter(enemyButton)
    expect(screen.getByRole('tooltip', { name: /Status de/ })).toHaveTextContent('Iniciativa:')
    expect(screen.getByRole('tooltip', { name: /Status de/ })).toHaveTextContent('Defesa:')
    fireEvent.mouseLeave(enemyButton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    const dead = structuredClone(save)
    const enemy = Object.values(dead.battle!.combatants).find((actor) => actor.side === 'enemy')!
    enemy.hp = 0; enemy.alive = false
    act(() => { useGameStore.setState({ save: dead }) })
    expect(container.querySelector('.pixel-battle__enemy.is-dead')).toBeInTheDocument()
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
  it('mostra título unificado e cards quadrados com dado, dano e tooltip de habilidade', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    const chosen = 'skill_axe_sunder'
    save.battle!.combatants.combatant_player.skillIds = [chosen]
    const ability = content.combatSkills[chosen]
    expect(ability).toBeDefined()
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    expect(container.querySelector('.pixel-battle__encounter-label h1')).toHaveTextContent(': ')
    act(() => { vi.advanceTimersByTime(1950) })
    const category = /scepter|grimoire|staff|spore|arcane|magic|spell/i.test(chosen) ? 'MAGIAS' : 'HABILIDADES'
    fireEvent.click(screen.getByRole('button', { name: category }))
    const skillButton = screen.getByRole('button', { name: new RegExp('Usar ' + ability.name) })
    expect(skillButton).toHaveClass('pixel-battle__skill-card')
    expect(skillButton).toHaveTextContent('MP')
    fireEvent.mouseEnter(skillButton)
    expect(screen.getByRole('tooltip', { name: 'Detalhes de ' + ability.name })).toHaveTextContent('Dado')
    expect(screen.getByRole('tooltip', { name: 'Detalhes de ' + ability.name })).toHaveTextContent('Recarga')
    expect(container.querySelector('.pixel-battle__skill-icon img')).toBeInTheDocument()
    fireEvent.mouseLeave(skillButton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('só mostra iniciativa de cada monstro quando seu próprio dado termina', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    save.battle = createBattle(save, content.encounters.encounter_fungorro_01, content,
      'init-sequential-v0513', { manualInitiative: true })
    useGameStore.setState({ save })
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(1850) })
    const die = screen.getByRole('button', { name: 'Arrastar dado de iniciativa d4 para cima para rolar' })
    fireEvent.pointerDown(die, { pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, clientY: 150 })
    fireEvent.pointerMove(die, { pointerId: 7, pointerType: 'mouse', isPrimary: true, clientY: 75 })
    fireEvent.pointerUp(die, { pointerId: 7, pointerType: 'mouse', isPrimary: true, clientY: 75 })
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(3400) })
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(1)
    expect(useGameStore.getState().save!.battle!.phase).toBe('AwaitingInitiative')
    act(() => { vi.advanceTimersByTime(13000) })
    expect(useGameStore.getState().save!.battle!.phase).not.toBe('AwaitingInitiative')
    expect(container.querySelectorAll('.combat-timeline__initiative').length).toBe(
      Object.keys(useGameStore.getState().save!.battle!.combatants).length,
    )
  })

  it('v0.5.13.1 organiza habilidades em grade sem o cabeçalho redundante e sem scroll no submenu', () => {
    vi.useFakeTimers()
    const save = createBattleSave()
    save.battle!.combatants.combatant_player.skillIds = ['skill_axe_sunder', 'skill_resonant_strike']
    const { container } = render(<MemoryRouter><BattleScene unified /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(1950) })
    fireEvent.click(screen.getByRole('button', { name: 'HABILIDADES' }))
    const picker = container.querySelector('.pixel-battle__submenu--skill-picker')
    expect(picker).toBeInTheDocument()
    expect(picker).not.toHaveTextContent('HABILIDADES')
    expect(picker?.querySelector('.pixel-battle__submenu-heading')).toBeNull()
    const grid = picker?.querySelector('.pixel-battle__skill-grid') as HTMLElement
    expect(grid.style.getPropertyValue('--skill-columns')).toBe('2')
    expect(grid.style.getPropertyValue('--skill-rows')).toBe('1')
    expect(grid.querySelectorAll('.pixel-battle__skill-card')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Voltar sem executar a ação' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar sem executar a ação' }))
    expect(container.querySelector('.pixel-battle__submenu--skill-picker')).not.toBeInTheDocument()
  })

})
