import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { QuestTracker } from './QuestTracker'

afterEach(cleanup)

describe('Botão compacto de objetivos rastreados', () => {
  const setup = () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    render(<QuestTracker save={save} />)
    const tracker = screen.getByRole('complementary', { name: 'Missões rastreadas' })
    const button = screen.getByRole('button', { name: /Objetivos rastreados/i })
    return { tracker, button, questName: content.quests.vs_astravel_first_contact.title }
  }

  it('permanece pequeno e revela detalhes somente em hover ou foco', () => {
    const { tracker, button, questName } = setup()
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(questName)).not.toBeInTheDocument()
    fireEvent.mouseEnter(tracker)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(questName)).toBeInTheDocument()
    fireEvent.mouseLeave(tracker)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.focus(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.blur(button, { relatedTarget: document.body })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('permite expandir por toque e fechar ao clicar novamente', () => {
    const { button } = setup()
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
