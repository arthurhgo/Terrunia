import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DIE_THROW_DISTANCE_PX, DraggableBattleDie } from './DraggableBattleDie'

afterEach(cleanup)

const gesture = (button: HTMLElement, startY: number, endY: number) => {
  const id = 3
  fireEvent.pointerDown(button, { pointerId: id, pointerType: 'touch', isPrimary: true, clientY: startY })
  fireEvent.pointerMove(button, { pointerId: id, pointerType: 'touch', isPrimary: true, clientY: endY })
  fireEvent.pointerUp(button, { pointerId: id, pointerType: 'touch', isPrimary: true, clientY: endY })
}

describe('arremesso vertical de dado', () => {
  const setup = () => {
    const onThrow = vi.fn()
    render(<DraggableBattleDie sides={8} ariaLabel="Arrastar dado d8 para cima para rolar" onThrow={onThrow} />)
    return { button: screen.getByRole('button', { name: /Arrastar dado d8/ }), onThrow }
  }

  it('um toque isolado NÃO rola o dado', () => {
    const { button, onThrow } = setup()
    fireEvent.click(button)
    expect(onThrow).not.toHaveBeenCalled()
  })

  it('arrastar para baixo ou menos que o limiar não rola', () => {
    const { button, onThrow } = setup()
    gesture(button, 130, 170)
    gesture(button, 130, 130 - DIE_THROW_DISTANCE_PX + 1)
    expect(onThrow).not.toHaveBeenCalled()
  })

  it('soltar depois de arrastar para cima dispara exatamente uma vez', () => {
    const { button, onThrow } = setup()
    fireEvent.pointerDown(button, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientY: 140 })
    fireEvent.pointerMove(button, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientY: 50 })
    expect(screen.getByText('SOLTE PARA ROLAR')).toBeInTheDocument()
    fireEvent.pointerUp(button, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientY: 50 })
    expect(onThrow).toHaveBeenCalledOnce()
    gesture(button, 140, 40)
    expect(onThrow).toHaveBeenCalledOnce()
  })

  it('um arrasto cancelado não dispara o dado', () => {
    const { button, onThrow } = setup()
    fireEvent.pointerDown(button, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientY: 140 })
    fireEvent.pointerMove(button, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientY: 40 })
    fireEvent.pointerCancel(button, { pointerId: 3 })
    fireEvent.pointerUp(button, { pointerId: 3, clientY: 40 })
    expect(onThrow).not.toHaveBeenCalled()
  })

  it('Enter funciona como alternativa de teclado; botão desabilitado não dispara', () => {
    const { button, onThrow } = setup()
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    expect(onThrow).toHaveBeenCalledOnce()
    const onDisabledThrow = vi.fn()
    render(<DraggableBattleDie sides={6} disabled
      ariaLabel="Arrastar dado d6 para cima para rolar" onThrow={onDisabledThrow} />)
    const disabled = screen.getByRole('button', { name: /Arrastar dado d6/ })
    expect(disabled).toBeDisabled()
    fireEvent.keyDown(disabled, { key: ' ', code: 'Space' })
    fireEvent.pointerDown(disabled, { pointerId: 4, pointerType: 'touch', isPrimary: true, clientY: 140 })
    fireEvent.pointerUp(disabled, { pointerId: 4, clientY: 40 })
    expect(onDisabledThrow).not.toHaveBeenCalled()
  })
})
