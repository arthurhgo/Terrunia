import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { QuestObjectPuzzle } from './QuestObjectPuzzle'

const now = '2026-11-04T13:00:00Z'
const game = (questId: string, locationId: string) => {
  const save = createNewSave('player-test', 'Thaur', 'character.terririan.default', content, now)
  save.quests[questId].status = 'active'
  save.world.currentLocationId = locationId
  useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready', syncMode: 'local', syncStatus: 'saved' })
  return save
}
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

const chooseAndConfirm = (title: string, action: string) => {
  fireEvent.click(screen.getByRole('button', { name: title }))
  fireEvent.click(screen.getByRole('button', { name: action }))
}

describe('minigames vinculados a móveis de Terran', () => {
  it('ensina frascos de Vida, Mana e Antídoto, recusa erro e só conclui após organizar tudo', () => {
    const save = game('main_terran_first_home', 'location_terran_daeryn_house')
    const before = structuredClone(save.inventory)
    const onClose = vi.fn()
    render(<QuestObjectPuzzle save={save} questId="main_terran_first_home" onClose={onClose}/>)
    expect(screen.getByRole('dialog', { name: 'Organizar a Estante de Cura' })).toBeInTheDocument()
    expect(screen.getByText(/qual frasco recupera Vida/i)).toBeInTheDocument()
    chooseAndConfirm('Antídoto', 'Confirmar posição')
    expect(screen.getByRole('status')).toHaveTextContent('não corresponde')
    expect(screen.getByText('0/3 etapas')).toBeInTheDocument()
    chooseAndConfirm('Tônico de Campo', 'Confirmar posição')
    expect(screen.getByText('1/3 etapas')).toBeInTheDocument()
    chooseAndConfirm('Éter Simples', 'Confirmar posição')
    chooseAndConfirm('Antídoto', 'Confirmar posição')
    expect(screen.getByText('3/3 etapas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objetivo' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(useGameStore.getState().save?.quests.main_terran_first_home.status).toBe('ready_to_turn_in')
    expect(useGameStore.getState().save?.inventory).toEqual(before)
  })

  it('exige abrir três livros da estante de Vorren, preservando a mochila', () => {
    const save = game('main_vorren_bestiary', 'location_terran_vorren_post')
    render(<QuestObjectPuzzle save={save} questId="main_vorren_bestiary" onClose={vi.fn()}/>)
    const shelf = screen.getByRole('group', { name: 'Mosaico de livros' })
    expect(within(shelf).getAllByRole('button')).toHaveLength(5)
    fireEvent.click(within(shelf).getByRole('button', { name: 'Bestiário Fungorro' }))
    expect(screen.getByText('Página aberta · Bestiário Fungorro')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar leitura' }))
    chooseAndConfirm('Rastros de Astravél', 'Confirmar leitura')
    chooseAndConfirm('Notas de Campo', 'Confirmar leitura')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objetivo' }))
    expect(useGameStore.getState().save?.quests.main_vorren_bestiary.status).toBe('ready_to_turn_in')
  })

  it('investiga a marca de Astravél como hipótese sem conceder itens ou afirmar causa definitiva', () => {
    const save = game('main_lithwynn_signs', 'location_terran_bond_workshop')
    const original = structuredClone(save.inventory)
    render(<QuestObjectPuzzle save={save} questId="main_lithwynn_signs" onClose={vi.fn()}/>)
    expect(screen.getByText(/Hipótese investigativa/)).toBeInTheDocument()
    chooseAndConfirm('Identificar a procedência', 'Confirmar análise')
    chooseAndConfirm('Comparar padrões', 'Confirmar análise')
    chooseAndConfirm('Registrar como indício', 'Confirmar análise')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objetivo' }))
    expect(useGameStore.getState().save?.quests.main_lithwynn_signs.status).toBe('ready_to_turn_in')
    expect(useGameStore.getState().save?.inventory).toEqual(original)
  })

  it('mantém minigame e feedback abertos se o save mudar de local antes de registrar', () => {
    const save = game('main_terran_first_home', 'location_terran_daeryn_house')
    const onClose = vi.fn()
    render(<QuestObjectPuzzle save={save} questId="main_terran_first_home" onClose={onClose} />)
    chooseAndConfirm('Tônico de Campo', 'Confirmar posição')
    chooseAndConfirm('Éter Simples', 'Confirmar posição')
    chooseAndConfirm('Antídoto', 'Confirmar posição')
    expect(screen.getByText('3/3 etapas')).toBeInTheDocument()

    // A loaded/synchronized save might invalidate the old UI location.
    const newerSave = structuredClone(save)
    newerSave.world.currentLocationId = 'location_terran_portal_plaza'
    useGameStore.setState({ save: newerSave })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objetivo' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Organizar a Estante de Cura' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível registrar o objetivo')
    expect(useGameStore.getState().save?.quests.main_terran_first_home.status).toBe('active')
    expect(useGameStore.getState().save?.eventLog).not.toContain('QuestObjectSolved:main_terran_first_home:daeryn_healing_shelf')
  })

  it('permite explorar objetos antes da missão, mas não registrar recompensas', () => {
    const save = game('main_terran_first_home', 'location_terran_daeryn_house')
    save.quests.main_terran_first_home.status = 'available'
    render(<QuestObjectPuzzle save={save} questId="main_terran_first_home" onClose={vi.fn()}/>)
    chooseAndConfirm('Tônico de Campo', 'Confirmar posição')
    chooseAndConfirm('Éter Simples', 'Confirmar posição')
    chooseAndConfirm('Antídoto', 'Confirmar posição')
    expect(screen.getByRole('button', { name: 'Ative a missão para registrar' })).toBeDisabled()
    expect(useGameStore.getState().save?.quests.main_terran_first_home.status).toBe('available')
  })
})
