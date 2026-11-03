import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { npcConversationVoices, npcQuestBriefs } from '../../content/npcConversations'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { DialogueWindow } from './DialogueWindow'
import { QuestNpcPanel } from './TerranServices'
import { RosettaGuide } from './RosettaGuide'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('janela única de conversa', () => {
  it('permite respostas do jogador, muda a fala do NPC e mantém o foco dentro do diálogo', () => {
    const save = createNewSave('speaker', 'Aron', 'character.terririan.default', content)
    const original = structuredClone(save)
    const npc = content.npcs.npc_street_arlen
    const voice = npcConversationVoices[npc.portraitAssetId]
    const onClose = vi.fn()
    render(<DialogueWindow save={save} title={npc.name} portraitAssetId={npc.portraitAssetId} lines={npc.dialogue} onClose={onClose} />)
    expect(screen.getAllByText(npc.dialogue[0])).toHaveLength(1)
    expect(screen.getAllByRole('img', { name: 'Arlen' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: voice.question }))
    expect(screen.getByRole('status')).toHaveTextContent(voice.work)
    expect(screen.queryByText(npc.dialogue[0])).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Tem algum conselho para mim?' }))
    expect(screen.getByRole('status')).toHaveTextContent(voice.advice)
    expect(save).toEqual(original)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })


  it('aceita a missão secundária disponível direto, sem Ouvir a oferta, em uma única confirmação', () => {
    const save = createNewSave('quest-direct', 'Thaur', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.side_npc_eldamar.status = 'available'
    useGameStore.setState({ status: 'ready', save, ownerId: save.ownerId, syncMode: 'local', syncStatus: 'saved' })
    const onClose = vi.fn()
    render(<MemoryRouter><QuestNpcPanel save={save} questId="side_npc_eldamar" onClose={onClose} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'Eldamar' })
    expect(within(dialog).getByRole('group', { name: 'Confirmar missão: Fragmentos da Primeira Marca' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Aceitar missão' })).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: 'Agora não' })).toBeEnabled()
    expect(within(dialog).queryByRole('button', { name: 'Ouvir a oferta' })).not.toBeInTheDocument()
    expect(dialog).toHaveTextContent('Derrote 2 Semeadores de Esporos')
    expect(dialog).toHaveTextContent('XP +20 · Ouro +10 · Essência +15')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aceitar missão' }))
    const next = useGameStore.getState().save!
    expect(next.quests.side_npc_eldamar).toMatchObject({ status: 'active', tracked: true })
    expect(next.eventLog).toContain('QuestOffered:side_npc_eldamar')
    expect(next.eventLog).toContain('QuestAccepted:side_npc_eldamar')
    expect(next.revision).toBe(save.revision + 2)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Agora não preserva missão disponível e recusa oferta antiga sem aceitar nada', () => {
    const save = createNewSave('quest-deferred', 'Thaur', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.side_npc_eldamar.status = 'available'
    useGameStore.setState({ status: 'ready', save, ownerId: save.ownerId, syncMode: 'local', syncStatus: 'saved' })
    const onClose = vi.fn()
    const { rerender } = render(<MemoryRouter><QuestNpcPanel save={save} questId="side_npc_eldamar" onClose={onClose} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(useGameStore.getState().save?.quests.side_npc_eldamar.status).toBe('available')
    expect(useGameStore.getState().save?.revision).toBe(save.revision)

    const offered = structuredClone(save)
    offered.quests.side_npc_eldamar.status = 'offered'
    useGameStore.setState({ save: offered })
    rerender(<MemoryRouter><QuestNpcPanel save={offered} questId="side_npc_eldamar" onClose={onClose} /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Ouvir a oferta' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }))
    expect(useGameStore.getState().save?.quests.side_npc_eldamar.status).toBe('available')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renderiza notas contextuais em cinza itálico na missão do NPC, não na fala', () => {
    const save = createNewSave('npc-note-owner', 'Lysa', 'character.terririan.default', content)
    const quest = content.quests.rosetta_tutorial_armor
    save.quests[quest.id].status = 'active'
    render(<MemoryRouter><QuestNpcPanel save={save} questId={quest.id} onClose={vi.fn()} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'Rosetta' })
    const note = within(dialog).getByLabelText('Observação da missão')
    expect(note).toHaveClass('quest-context-note')
    expect(note).toHaveTextContent(quest.contextNote!)
    expect(within(dialog).getByRole('status')).not.toHaveTextContent(quest.contextNote!)
  })

  it('apresenta observação do tutorial apenas na área da lição', () => {
    const save = createNewSave('tutorial-note-owner', 'Lysa', 'character.terririan.default', content)
    save.quests.rosetta_tutorial_equip.status = 'completed'
    save.quests.rosetta_tutorial_supply.status = 'completed'
    save.quests.rosetta_tutorial_refine.status = 'active'
    render(<RosettaGuide save={save} onClose={vi.fn()} onOpenQuests={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Orientações de Rosetta' })
    const note = within(dialog).getByLabelText('Observação da missão')
    expect(note).toHaveTextContent(content.quests.rosetta_tutorial_refine.contextNote!)
    expect(note).toHaveClass('quest-context-note')
  })

  it('exibe resumo e identidade uma única vez e separa a fala dos dados da missão', () => {
    const save = createNewSave('speaker', 'Aron', 'character.terririan.default', content)
    const quest = content.quests.side_street_arlen
    save.quests[quest.id].status = 'active'
    render(<MemoryRouter><QuestNpcPanel save={save} questId={quest.id} onClose={vi.fn()} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'Arlen' })
    expect(within(dialog).getAllByText('Arlen', { exact: true })).toHaveLength(1)
    expect(within(dialog).getByRole('status')).toHaveTextContent(npcQuestBriefs[quest.id])
    expect(dialog.querySelector('.vn-details')).not.toHaveTextContent(npcQuestBriefs[quest.id])
    expect(dialog.querySelector('.terran-quest-dialog__npc')).toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Vamos falar de outra coisa.' }))
    expect(within(dialog).getAllByText(content.npcs.npc_street_arlen.dialogue[0])).toHaveLength(1)
  })
})
