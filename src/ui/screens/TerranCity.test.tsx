import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('mantém Local, Inventário/Nexo e Missões na lateral; somente Menu abre a tela da build', () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}>
      <Routes>
        <Route path="/terran" element={<TerranScreen />} />
        <Route path="/play" element={<TerranScreen />} />
        <Route path="/local" element={<LocalScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/quests" element={<QuestsScreen />} />
        <Route path="/menu" element={<SkillTreeScreen />} />
      </Routes>
    </MemoryRouter>)
    const city = screen.getByRole('img', { name: new RegExp('Terran vista superior 3/4') })
    expect(city).toBeInTheDocument()
    const rail = screen.getByRole('navigation', { name: 'Menu de Terran' })
    expect(rail.querySelectorAll('button')).toHaveLength(4)
    const stage = screen.getByRole('region', { name: 'Cenário contínuo de Terran' })
    const status = screen.getByRole('complementary', { name: 'Status permanente do personagem' })
    expect(screen.getByRole('link', { name: 'Abrir Menu' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Local' }))
    const mapDrawer = screen.getByRole('complementary', { name: 'Painel lateral: Mapa de Terran' })
    expect(mapDrawer).toBeInTheDocument()
    expect(mapDrawer).toHaveTextContent('Explore o continente')
    expect(screen.getByRole('link', { name: 'Ampliar mapa do continente' })).toHaveAttribute('href', '/local')
    expect(screen.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBe(stage)
    expect(screen.queryByText('Modo Ondas do Portal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Inventário e Nexo' }))
    const inventoryDrawer = screen.getByRole('complementary', { name: 'Painel lateral: Inventário e Nexo' })
    expect(inventoryDrawer).toBeInTheDocument()
    expect(inventoryDrawer).toHaveTextContent('Status do personagem')
    expect(inventoryDrawer).toHaveTextContent('Inventário')
    expect(screen.queryByRole('group', { name: 'Seções de Inventário e Nexo' })).not.toBeInTheDocument()
    expect(status).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Missões' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Diário de Missões' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Registro de missões em grid' })).toBeInTheDocument()
    expect(city).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Menu' }))
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Árvores de progressão' })).toBeInTheDocument()
  })

  it('mantém a biblioteca visual exclusivamente nos Registros de Eldamar', () => {
    loadSave()
    render(<MemoryRouter><InventoryScreen /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Inventário e Nexo' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Seções de Inventário e Nexo' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Status do personagem' })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Falar com Guardião do Portal' }))
    expect(screen.getByRole('dialog', { name: 'Conversa com Guardião do Portal' })).toBeInTheDocument()
    expect(screen.getByText(/O Portal registra destinos, não desejos/)).toBeInTheDocument()
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
