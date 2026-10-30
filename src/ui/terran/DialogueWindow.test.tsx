import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { npcConversationVoices, npcQuestBriefs } from '../../content/npcConversations'
import { createNewSave } from '../../domain/game/createSave'
import { DialogueWindow } from './DialogueWindow'
import { QuestNpcPanel } from './TerranServices'

afterEach(cleanup)

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
