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
})
