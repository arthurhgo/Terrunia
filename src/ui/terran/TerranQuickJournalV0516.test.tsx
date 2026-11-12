import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { TerranQuickJournal } from './TerranQuickJournal'

afterEach(cleanup)

describe('v0.5.16 — quick journal for large existing quest lists', () => {
  it('shows a maximum of 3 focused sidequests and keeps all others in expandable details', () => {
    const save = createNewSave('journal-v0516', 'Testadora', 'character.terririan.default', content)
    const ids = Object.values(content.quests).filter(q => q.category === 'secondary').slice(0, 29).map(q => q.id)
    expect(ids).toHaveLength(29)
    for (const id of ids) save.quests[id].status = 'active'
    const snapshot = structuredClone(save)
    const { container } = render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    expect(screen.getByLabelText('Etapa da expedição')).toHaveTextContent('Borda Luminescente')
    expect(screen.getByText('Secundárias da etapa')).toBeInTheDocument()
    expect(container.querySelectorAll('section[aria-label="Secundárias da etapa"] [data-quest-id]').length)
      .toBeLessThanOrEqual(3)
    const extra = screen.getByLabelText('Outras missões aceitas')
    expect(extra.querySelectorAll('[data-quest-id]').length).toBe(26)
    expect(save).toEqual(snapshot)
  })

  it('prioritizes a tracked old sidequest even with 29 accepted quests', () => {
    const save = createNewSave('journal-tracking-v0516', 'Testadora', 'character.terririan.default', content)
    const ids = Object.values(content.quests).filter(q => q.category === 'secondary').slice(0, 29).map(q => q.id)
    for (const id of ids) save.quests[id].status = 'active'
    const trackedId = ids[ids.length - 1]
    save.quests[trackedId].tracked = true
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const snapshot = structuredClone(save)
    const { container } = render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    const featured = container.querySelector('section[aria-label="Secundárias da etapa"]')
    expect(featured?.querySelectorAll('[data-quest-id]')).toHaveLength(3)
    expect(featured?.querySelector('[data-quest-id="' + trackedId + '"]')).not.toBeNull()
    expect(screen.getByLabelText('Próximo passo')).toHaveTextContent(content.quests[trackedId].title)
    expect(save).toEqual(snapshot)
  })

  it('shows the real next objective and progress, without changes to the save', () => {
    const save = createNewSave('journal-objective-v0516', 'Testadora', 'character.terririan.default', content)
    const quest = content.quests.vs_astravel_first_contact
    save.quests[quest.id].status = 'active'
    const objective = quest.objectives[0]
    save.quests[quest.id].objectives[objective.id] = 0
    const snapshot = structuredClone(save)
    render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    const focus = screen.getByLabelText('Próximo passo')
    expect(focus).toHaveTextContent(quest.title)
    expect(focus).toHaveTextContent(objective.label + ' · 0/' + objective.required)
    expect(save).toEqual(snapshot)
  })

  it('puts tracked hand-ins first and displays the responsible NPC', () => {
    const save = createNewSave('journal-delivery-v0516', 'Testadora', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'active'
    const quest = content.quests.side_astravel_spore_shells
    save.quests[quest.id].status = 'ready_to_turn_in'
    save.quests[quest.id].tracked = true
    render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    const focus = screen.getByLabelText('Próximo passo')
    expect(focus).toHaveTextContent('ENTREGA PENDENTE')
    expect(focus).toHaveTextContent(quest.title)
    expect(focus).toHaveTextContent(content.npcs[quest.turnInNpcId].name)
    expect(save.quests[quest.id].status).toBe('ready_to_turn_in')
  })
})
