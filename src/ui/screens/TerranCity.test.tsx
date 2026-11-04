import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { TerranLocationScreen } from './TerranLocationScreen'
import { InventoryScreen } from './InventoryScreen'
import { LocalScreen } from './LocalScreen'
import { QuestsScreen } from './QuestsScreen'
import { SkillTreeScreen } from './SkillTreeScreen'
import { TerranScreen } from './TerranScreen'

const createPlayableSave = () => {
  const save = createNewSave(
    'ui-terran-owner',
    'Lysa',
    'character.terririan.default',
    content,
    '2026-08-12T12:00:00.000Z',
    { saveId: 'ui-terran-save', characterId: 'ui-terran-character' },
  )
  const bound = bindPrologueWeapon(
    save,
    content,
    '2026-08-12T12:01:00.000Z',
    'ui-terran-bound',
  )
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}

const loadSave = (currentLocationId = 'terran', showArrival = false) => {
  const save = createPlayableSave()
  if (!showArrival) save.eventLog.push('CutsceneViewed:terran_arrival')
  save.world.currentLocationId = currentLocationId
  if (!save.world.unlockedLocationIds.includes(currentLocationId)) {
    save.world.unlockedLocationIds.push(currentLocationId)
  }
  useGameStore.setState({
    status: 'ready',
    syncStatus: 'saved',
    syncMode: 'local',
    ownerId: save.ownerId,
    save,
    error: null,
    notification: null,
  })
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterAll(() => vi.restoreAllMocks())

afterEach(() => {
  cleanup()
  useGameStore.getState().resetSession()
})

describe('interfaces de Terran', () => {
  it('mostra a rota rastreada no painel fixo e alterna dourado/azul ao trocar a missão', () => {
    loadSave()
    const save = useGameStore.getState().save!
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    save.quests.side_street_arlen.status = 'active'
    save.eventLog.push('CutsceneViewed:astravel_call')
    useGameStore.setState({ save })
    const { container } = render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    const dock = screen.getByRole('complementary', { name: 'Diário de missões' })
    expect(within(dock).getByRole('region', { name: 'Missões fixas' })).toBeInTheDocument()
    const visible = screen.getByRole('img', { name: 'Caminho pontilhado da missão rastreada' })
    expect(visible).toHaveAttribute('data-route-tone', 'gold')
    expect(container.querySelectorAll('.rosetta-quest-lines path')).toHaveLength(1)
    expect(container.querySelector('.rosetta-minimap-lines')).toHaveAttribute('data-route-tone', 'gold')

    fireEvent.click(screen.getByRole('button', { name: 'Rastrear Caminhos de Entrega' }))
    expect(useGameStore.getState().save?.quests.side_street_arlen.tracked).toBe(true)
    expect(useGameStore.getState().save?.quests.vs_astravel_first_contact.tracked).toBe(false)
    const path = container.querySelector('.rosetta-quest-lines')
    expect(path).toHaveAttribute('data-route-tone', 'blue')
    expect(path?.querySelector('path')).toHaveAttribute('data-quest-ids', 'side_street_arlen')
    expect(container.querySelector('.rosetta-minimap-lines')).toHaveAttribute('data-route-tone', 'blue')

    fireEvent.click(screen.getByRole('button', { name: 'Remover rastreamento de Caminhos de Entrega' }))
    expect(useGameStore.getState().save?.quests.side_street_arlen.tracked).toBe(false)
    expect(container.querySelector('.rosetta-quest-lines')).toBeNull()
    expect(dock).toBeInTheDocument()
  })

  it('mantém a rota de missão e o marcador ! ao entrar na casa e exibe o título dos NPCs', () => {
    loadSave('location_terran_eldamar_house')
    const save = useGameStore.getState().save!
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    save.eventLog.push('CutsceneViewed:astravel_call')
    useGameStore.setState({ save })
    const { container } = render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    const rosetta = screen.getByRole('button', { name: 'Conversar com Rosetta' })
    expect(rosetta.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Guardiã do Portal')
    expect(screen.getByRole('img', { name: 'Caminho pontilhado da missão rastreada' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Eldamar' }))
    expect(screen.getByRole('complementary', { name: 'Diário de missões' })).toBeInTheDocument()
    const route = screen.getByRole('img', { name: 'Caminho pontilhado da missão no interior' })
    expect(route.querySelectorAll('path[data-route-tone="gold"]')).toHaveLength(1)
    expect(route.querySelector('path')).toHaveAttribute('data-target-kind', 'npc')
    const eldamar = screen.getByRole('button', { name: 'Falar com Eldamar dentro do local' })
    expect(eldamar.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Mestre dos Registros')
    expect(eldamar.querySelector('.npc-quest-marker')).toHaveTextContent('!')
    expect(container.querySelector('.pixel-interior__quest-paths')).not.toBeNull()
  })

  it('mostra rota verde de entrega dentro das casas até o NPC da missão', () => {
    loadSave('location_terran_daeryn_house')
    const save = useGameStore.getState().save!
    save.quests.side_npc_daeryn.status = 'ready_to_turn_in'
    save.quests.side_npc_daeryn.tracked = true
    useGameStore.setState({ save })
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Daeryn' }))
    const route = screen.getByRole('img', { name: 'Caminho pontilhado da missão no interior' })
    expect(route.querySelector('path')).toHaveAttribute('data-route-tone', 'green')
    expect(route.querySelector('path')).toHaveAttribute('data-route-opacity', '1')
    expect(route.querySelector('path')).toHaveAttribute('data-target-kind', 'npc')
  })

  it('mostra os nomes dos NPCs nas ruas e interiores sem ocultar os marcadores', () => {
    loadSave('location_terran_eldamar_house')
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)

    const rosetta = screen.getByRole('button', { name: 'Conversar com Rosetta' })
    expect(rosetta.querySelector('.npc-nameplate')).toHaveTextContent('Rosetta')
    expect(rosetta.querySelector('.npc-nameplate__name')).toHaveTextContent('Rosetta')
    expect(rosetta.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Guardiã do Portal')
    expect(rosetta.querySelector('.npc-question-bubble')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Eldamar' }))
    const eldamar = screen.getByRole('button', { name: 'Falar com Eldamar dentro do local' })
    expect(eldamar.querySelector('.npc-nameplate')).toHaveTextContent('Eldamar')
    expect(eldamar.querySelector('.npc-nameplate__name')).toHaveTextContent('Eldamar')
    expect(eldamar.querySelector('.npc-nameplate__subtitle')).toHaveTextContent('Mestre dos Registros')
    expect(eldamar).toHaveAttribute('title', 'Eldamar')
  })

  it('mostra o alojamento pixelado e o balcão de Sylwen sem sair da cidade', () => {
    loadSave('location_terran_daeryn_house')
    const save = useGameStore.getState().save!
    save.wallet.gold = 40
    useGameStore.setState({ save })
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Abrir Base' })).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Status permanente do personagem' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Daeryn' }))
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Daeryn/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir serviços do local' }))
    expect(screen.getByRole('heading', { name: /Balcão de Sylwen/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Comprar Éter Simples por 18 ouro' }))
    expect(useGameStore.getState().save?.wallet.gold).toBe(22)
    expect(useGameStore.getState().save?.inventory.some((item) => item.definitionId === 'consumable_simple_ether')).toBe(true)
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Daeryn/ })).toBeInTheDocument()
  })

  it('mantém somente o diário à esquerda e a mochila recolhível sobre o cenário', () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    const stage = screen.getByRole('region', { name: 'Cenário contínuo de Terran' })
    const dock = screen.getByRole('complementary', { name: 'Diário de missões' })
    const missions = within(dock).getByRole('region', { name: 'Missões fixas' })
    expect(dock.children).toHaveLength(1)
    expect(dock.children[0]).toBe(missions)
    expect(within(dock).queryByRole('region', { name: 'Inventário fixo' })).not.toBeInTheDocument()
    const toggle = within(stage).getByRole('button', { name: /Mochila/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const backpack = screen.getByRole('complementary', { name: 'Mochila expandida' })
    expect(backpack.querySelectorAll('.inventory-slot')).toHaveLength(12)
    expect(backpack).toHaveTextContent('Mochila: 0/12 espaços')
    fireEvent.click(toggle)
    expect(screen.queryByRole('complementary', { name: 'Mochila expandida' })).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Status permanente do personagem' })).toBeInTheDocument()
  })

  it('pagina a mochila expansível e preserva itens de saves legados com mais de doze pilhas', () => {
    loadSave()
    const save = useGameStore.getState().save!
    save.inventory = Array.from({ length: 14 }, (_, i) => ({
      instanceId: `extra-item-${i}`, definitionId: 'drop_spore_cluster', quantity: 1,
      rarity: 'uncommon' as const, locked: false, favorite: false, acquiredAt: save.updatedAt,
    }))
    useGameStore.setState({ save })
    const { container } = render(<MemoryRouter><TerranScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Mochila/ }))
    const backpack = screen.getByRole('complementary', { name: 'Mochila expandida' })
    expect(within(backpack).getByText('1/2 · 14 itens')).toBeInTheDocument()
    expect(container.querySelectorAll('.inventory-slot')).toHaveLength(12)
    fireEvent.click(within(backpack).getByRole('button', { name: 'Próxima página da mochila' }))
    expect(within(backpack).getByText('2/2 · 14 itens')).toBeInTheDocument()
    expect(container.querySelectorAll('.inventory-slot')).toHaveLength(12)
    expect(within(backpack).getByRole('button', { name: 'Próxima página da mochila' })).toBeDisabled()
  })

  it('mantém a biblioteca visual exclusivamente nos Registros de Eldamar', () => {
    loadSave()
    render(<MemoryRouter><InventoryScreen /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Inventário' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Seções de Inventário' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Status do personagem' })).not.toBeInTheDocument()
    expect(screen.getByText(/O Arsenal Visual e o guia de jogo ficam na Estante dos Registros/)).toBeInTheDocument()
    expect(screen.queryByText('BIBLIOTECA DE SPRITES · 16×16 PX')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Tipos de equipamento' })).not.toBeInTheDocument()
  })

  it('reflete o save real no painel direito sem atribuir status inventados', async () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    const hud = screen.getByRole('complementary', { name: 'Status permanente do personagem' })
    expect(hud).toHaveTextContent('FOR')
    expect(hud).toHaveTextContent('AST')
    expect(hud).toHaveTextContent('VIG')
    expect(hud).not.toHaveTextContent('DEX')
    expect(hud.querySelectorAll('.terran-character-hud__slot')).toHaveLength(5)
    expect(hud.querySelectorAll('.terran-character-hud__slot.is-bound img')).toHaveLength(1)
    expect(hud.querySelectorAll('.terran-character-hud__slot.is-empty')).toHaveLength(4)
    expect(hud.querySelectorAll('.terran-character-hud__slot.is-empty img')).toHaveLength(0)
    expect(hud.querySelectorAll('.terran-character-hud__slot.is-empty svg')).toHaveLength(4)
    const toggle = screen.getByRole('button', { name: 'ATRIBUTOS' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(hud.querySelector('.terran-character-hud__attributes')).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(hud.querySelector('.terran-character-hud__attributes')).toBeInTheDocument()
    const updated = structuredClone(useGameStore.getState().save!)
    updated.wallet.gold = 749
    updated.vitals.hp -= 5
    useGameStore.setState({ save: updated })
    await waitFor(() => {
      expect(hud).toHaveTextContent('749 Ouro')
      expect(screen.getByRole('progressbar', { name: 'Vida' })).toHaveAttribute('aria-valuenow', String(updated.vitals.hp))
    })
  })

  it('entra na Casa de Eldamar, mostra o NPC no interior e retorna pela porta', () => {
    loadSave('location_terran_eldamar_house')
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Eldamar' }))
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Eldamar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Falar com Eldamar dentro do local' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Interagir com Estante dos Registros' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sair do interior para as ruas de Terran' }))
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
  })

  it('exibe a cutscene de chegada sobre a mesma cidade e permite encerrá-la', () => {
    loadSave('terran', true)
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    expect(screen.getByRole('dialog', { name: /TERRAN · O PRIMEIRO PASSO/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pular cena' }))
    expect(screen.queryByRole('dialog', { name: /TERRAN · O PRIMEIRO PASSO/ })).not.toBeInTheDocument()
  })

  it('apresenta o juramento apenas após entrar no Clã, sem trocar a cena', () => {
    loadSave()
    const save = useGameStore.getState().save!
    save.character.clan.clanId = 'dunavar'
    useGameStore.setState({ save })
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    expect(screen.getByRole('dialog', { name: /TERRAN · O JURAMENTO/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pular cena' }))
    expect(screen.queryByRole('dialog', { name: /TERRAN · O JURAMENTO/ })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
  })

  it('abre o diálogo de um NPC sem remover o canvas da cidade', () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Praça do Portal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Falar com Rosetta' }))
    expect(screen.getByRole('dialog', { name: 'Orientações de Rosetta' })).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((node) => node.textContent?.includes('Vou lhe entregar duas túnicas simples.'))).toBe(true)
    expect(screen.getByText('Estante dos Registros')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Missões que pode receber' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Consultar diário de missões' }))
    expect(screen.getByRole('complementary', { name: 'Diário de missões' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
  })

  for (const locationId of TERRAN_LOCATION_IDS) {
    const location = content.terranLocations[locationId]
    it(`renderiza a interface de ${location.name}`, () => {
      loadSave(locationId)
      render(
        <MemoryRouter initialEntries={[`/terran/${locationId}`]}>
          <Routes>
            <Route path="/terran/:locationId" element={<TerranLocationScreen />} />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: new RegExp(`^${location.name}$`) })).toBeInTheDocument()
      expect(screen.getByText(`TERRAN > ${location.name.toUpperCase()}`)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Pessoas neste local' })).toBeInTheDocument()
    })
  }
})
