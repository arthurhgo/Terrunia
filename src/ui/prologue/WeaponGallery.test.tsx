import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { WeaponGallery } from './WeaponGallery'

afterEach(cleanup)

describe('Galeria do primeiro Vínculo', () => {
  it('prévia por hover não exibe sinergia; clique seleciona e libera os dados do Clã da arma escolhida', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    const onSelect = vi.fn()
    const { rerender } = render(<WeaponGallery save={save} selectedId={null} onSelect={onSelect} />)
    expect(screen.getAllByRole('button', { name: /^Escolher / })).toHaveLength(7)
    expect(screen.getByRole('button', { name: 'Escolher Espada Longa' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(/Sinergias e caminhos de Clã/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Inspecione ao passar o mouse/)).not.toBeInTheDocument()

    const axe = screen.getByRole('button', { name: 'Escolher Machado de Guerra' })
    fireEvent.mouseEnter(axe)
    expect(screen.getByText('Ruptura do Machado')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: `Dado d${save.character.attributes.strength.die}` })).toBeInTheDocument()
    expect(screen.queryByText(/Bônus futuros, somente após filiação/)).not.toBeInTheDocument()

    fireEvent.click(axe)
    expect(onSelect).toHaveBeenCalledWith('bound_weapon_war_axe')
    rerender(<WeaponGallery save={save} selectedId="bound_weapon_war_axe" onSelect={onSelect} />)
    expect(axe).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: 'Sinergias de Clã para Machado de Guerra' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sinergias e caminhos de Clã' })).toBeInTheDocument()
    expect(screen.getByText('+4 Vida')).toBeInTheDocument()
    expect(screen.getByText('+1 Defesa')).toBeInTheDocument()
    expect(screen.getByText('+2 Ataque mágico')).toBeInTheDocument()
    expect(screen.queryByText('Sentinela da Luz: Proteção e prioridade')).not.toBeInTheDocument()
    expect(screen.queryByText(/Bônus futuros, somente após filiação/)).not.toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Escolher Cetro Arcano' }))
    expect(screen.getByText('Pulso do Cetro')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sinergias de Clã para Machado de Guerra' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Sinergias de Clã para Cetro Arcano' })).not.toBeInTheDocument()
  })
})
