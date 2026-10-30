import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { WeaponGallery } from './WeaponGallery'

afterEach(cleanup)

describe('Galeria do primeiro Vínculo', () => {
  it('mostra os sete Vínculos e troca a prévia de habilidades ao passar o mouse', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    const onSelect = vi.fn()
    render(<WeaponGallery save={save} selectedId="bound_weapon_long_sword" onSelect={onSelect} />)
    expect(screen.getAllByRole('button', { name: /^Escolher / })).toHaveLength(7)
    expect(screen.getByText('Arco da Lâmina')).toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Escolher Machado de Guerra' }))
    expect(screen.getByText('Ruptura do Machado')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: `Dado d${save.character.attributes.strength.die}` })).toBeInTheDocument()
    expect(screen.getByText(/Bônus condicionais à filiação/)).toBeInTheDocument()
    expect(screen.getByText(/Sentinela da Luz: Proteção e prioridade/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher Machado de Guerra' }))
    expect(onSelect).toHaveBeenCalledWith('bound_weapon_war_axe')
  })
})
