import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { NpcMissionHub } from './NpcMissionHub'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('NPC — janela única, missão primeiro', () => {
  it('abre missão selecionável antes da conversa, alterna assuntos sem outro modal', () => {
    const save = createNewSave('npc-player','Thaur','character.terririan.default',content,'2026-11-04T13:00:00Z')
    save.quests.main_vorren_bestiary.status = 'available'
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_terran_first_home.status = 'completed'
    useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready', syncMode: 'local', syncStatus: 'saved' })
    const presence = content.terranLocations.location_terran_vorren_post.npcPresences.find((npc) => npc.npcId === 'npc_vorren')!
    const onClose = vi.fn()
    render(<NpcMissionHub save={save} presence={presence} initialQuestId="main_vorren_bestiary" onClose={onClose}/>)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    const dialog = screen.getByRole('dialog', { name: presence.label })
    expect(within(dialog).getByRole('navigation', { name: 'Assuntos do NPC ' + presence.label })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /O Livro das Criaturas/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: /O Livro das Criaturas/ })).toHaveAttribute('data-quest-status', 'available')
    expect(within(dialog).getByRole('button', { name: /Conversar com Vorren/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('group', { name: 'Respostas para Vorren' })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('group', { name: 'Confirmar missão: O Livro das Criaturas' })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Conversar com Vorren/ }))
    expect(within(dialog).queryByRole('group', { name: 'Respostas para Vorren' })).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Responder/ }))
    expect(within(dialog).getByRole('group', { name: 'Respostas para Vorren' })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    fireEvent.click(within(dialog).getByRole('button', { name: /O Livro das Criaturas/ }))
    expect(within(dialog).queryByRole('group', { name: 'Respostas para Vorren' })).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aceitar missão' }))
    expect(useGameStore.getState().save?.quests.main_vorren_bestiary.status).toBe('active')
    expect(onClose).not.toHaveBeenCalled()
  })
})
