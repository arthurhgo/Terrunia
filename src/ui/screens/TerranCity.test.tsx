import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { TerranLocationScreen } from './TerranLocationScreen'
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
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Base' }))
    expect(screen.getByRole('img', { name: /Quarto pixelado/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Entre na Base para descansar/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Daeryn' }))
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Daeryn/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir serviços do local' }))
    expect(screen.getByRole('heading', { name: /Balcão de Sylwen/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Comprar Éter Simples por 18 ouro' }))
    expect(useGameStore.getState().save?.wallet.gold).toBe(22)
    expect(useGameStore.getState().save?.inventory.some((item) => item.definitionId === 'consumable_simple_ether')).toBe(true)
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Daeryn/ })).toBeInTheDocument()
  })

  it('mantém a cidade pixelada e abre painéis adjacentes sem navegação por abas', () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /^Terran$/ })).toBeInTheDocument()
    expect(screen.getByText('HOME · CIDADE-BASE DO JOGADOR')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para Base do Terrírian' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Conversar com Arlen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Conversar com Liora' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    const rail = screen.getByRole('navigation', { name: 'Menu de Terran' })
    expect(rail).toBeInTheDocument()
    expect(rail.querySelectorAll('button')).toHaveLength(5)
    const frame = screen.getByTestId('terran-centered-gameplay')
    const scene = screen.getByRole('region', { name: 'Cenário contínuo de Terran' })
    expect(scene.parentElement).toBe(frame)
    expect(rail.parentElement).toBe(frame)
    const rightRail = screen.getByRole('navigation', { name: 'Ações contextuais de Terran' })
    expect(rightRail.parentElement).toBe(frame)
    expect(rightRail.querySelectorAll('button')).toHaveLength(2)
    expect(screen.queryByText(/Você está em/)).not.toBeInTheDocument()
    for (const locationId of TERRAN_LOCATION_IDS) {
      expect(
        screen.getByRole('button', { name: new RegExp(`Ir para ${content.terranLocations[locationId].name}`) }),
      ).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Abrir informações do local' }))
    const contextual = screen.getByRole('complementary', { name: 'Painel lateral: Praça do Portal' })
    expect(contextual.parentElement).toBe(frame)
    expect(screen.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBe(scene)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))
    expect(screen.getByRole('navigation', { name: 'Ações contextuais de Terran' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Mochila' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mochila e Arsenal' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBe(scene)
    expect(screen.getByRole('img', { name: /Terran vista superior 3\/4/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))
    expect(screen.queryByRole('complementary', { name: /Painel lateral/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Praça do Portal' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Praça do Portal' })).toBeInTheDocument()
  })

  it('entra na Casa de Eldamar, mostra o NPC no interior e retorna pela porta', () => {
    loadSave('location_terran_eldamar_house')
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Casa de Eldamar' }))
    expect(screen.getByRole('img', { name: /Interior pixelado de Casa de Eldamar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Falar com Eldamar dentro do local' })).toBeInTheDocument()
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
