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

    const axe = screen.getByRole('button', { name: 'Escolher Machado de Guerra' })
    fireEvent.mouseEnter(axe)
    expect(screen.getByText('Ruptura do Machado')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: `Dado d${save.character.attributes.strength.die}` })).toBeInTheDocument()
    expect(screen.queryByText(/Bônus futuros, somente após filiação/)).not.toBeInTheDocument()

    fireEvent.click(axe)
    expect(onSelect).toHaveBeenCalledWith('bound_weapon_war_axe')
    rerender(<WeaponGallery save={save} selectedId="bound_weapon_war_axe" onSelect={onSelect} />)
    expect(axe).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Sinergias e caminhos de Clã · Machado de Guerra/)).toBeInTheDocument()
    expect(screen.getByText(/Bônus condicionais à filiação/)).toBeInTheDocument()
    expect(screen.getByText(/Sentinela da Luz: Proteção e prioridade/)).toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Escolher Cetro Arcano' }))
    expect(screen.getByText('Pulso do Cetro')).toBeInTheDocument()
    expect(screen.getByText(/Sinergias e caminhos de Clã · Machado de Guerra/)).toBeInTheDocument()
    expect(screen.queryByText(/Sinergias e caminhos de Clã · Cetro Arcano/)).not.toBeInTheDocument()
  })
})
