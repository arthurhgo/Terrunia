import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { ExpeditionReportV0516 } from './ExpeditionReportV0516'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('v0.5.16 — relatório e entrega presencial', () => {
  it('shows cleared encounters and real NPC return without granting or accepting anything', () => {
    const save = createNewSave('report-v0516', 'Lysa', 'character.terririan.default', content)
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const before = structuredClone(save)
    useGameStore.setState({ save, status: 'ready', ownerId: save.ownerId })
    render(<ExpeditionReportV0516 save={save} />)
    const report = screen.getByLabelText('Relatório de expedição')
    expect(report).toHaveTextContent('1/15 marcos')
    fireEvent.click(screen.getByText(/Relatório de expedição/))
    expect(screen.getByLabelText('Entregas pendentes')).toHaveTextContent('Vorren')
    expect(screen.getByLabelText('Entregas pendentes')).toHaveTextContent('Cascos de Esporos')
    expect(screen.getByLabelText('Resultados da expedição')).toHaveTextContent('Materiais na mochila')
    expect(useGameStore.getState().save).toEqual(before)
  })
  it('lets the player track a ready hand-in, not redeem it remotely', () => {
    const save = createNewSave('track-v0516', 'Lysa', 'character.terririan.default', content)
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    useGameStore.setState({ save, status: 'ready', ownerId: save.ownerId })
    render(<ExpeditionReportV0516 save={save} />)
    fireEvent.click(screen.getByText(/Relatório de expedição/))
    fireEvent.click(screen.getByRole('button', { name: 'Rastrear entrega de Cascos de Esporos' }))
    const next = useGameStore.getState().save!
    expect(next.quests.side_astravel_spore_shells.status).toBe('ready_to_turn_in')
    expect(next.quests.side_astravel_spore_shells.tracked).toBe(true)
    expect(next.wallet).toEqual(save.wallet)
    expect(next.inventory).toEqual(save.inventory)
  })
})
