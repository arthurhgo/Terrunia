import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { EldamarRecords } from './EldamarRecords'

describe('Estante dos Registros de Eldamar', () => {
  it('concentra as informações de suporte e o Arsenal Visual sem tocar na progressão', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default',
      content, '2026-10-30T00:00:00Z', { saveId: 'records-save', characterId: 'records-character' })
    const previous = structuredClone(save)
    render(<EldamarRecords save={save} />)
    expect(screen.getByRole('region', { name: 'Arquivo da Estante dos Registros de Eldamar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Manual de Terrúnia' })).toBeInTheDocument()
    expect(screen.getByText('Essência e Skill Tree')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Arsenal Visual' }))
    expect(screen.getByText('BIBLIOTECA DE SPRITES · 16×16 PX')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Tipos de equipamento' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fundamentos dos Vínculos' }))
    expect(screen.getByRole('heading', { name: 'Catálogo de Fundações' })).toBeInTheDocument()
    expect(screen.getByText(/Vínculos ativos neste personagem/)).toBeInTheDocument()
    expect(save).toEqual(previous)
  })
})
