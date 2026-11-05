import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { AttributeDie } from '../../domain/game/types'
import { DieIcon } from '../components/DieIcon'

// A vertical gesture must travel far enough to avoid accidental rolls on touch devices.
export const DIE_THROW_DISTANCE_PX = 46
const MAX_VISUAL_DRAG_PX = 86

type DragState = { pointerId: number; startY: number }

/** One gesture for both initiative and attack dice; domain commands stay in the parent. */
export function DraggableBattleDie({ sides, onThrow, disabled = false, ariaLabel }: {
  sides: AttributeDie
  onThrow: () => void
  disabled?: boolean
  ariaLabel: string
}) {
  const activePointer = useRef<DragState | null>(null)
  const thrown = useRef(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [dragging, setDragging] = useState(false)

  const reset = () => {
    activePointer.current = null
    setDragging(false)
    setDragDistance(0)
  }
  const throwOnce = () => {
    if (disabled || thrown.current) return
    thrown.current = true
    onThrow()
  }
  const pointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || thrown.current || activePointer.current || event.isPrimary === false) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    activePointer.current = { pointerId: event.pointerId, startY: event.clientY }
    setDragging(true)
    setDragDistance(0)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const started = activePointer.current
    if (!started || started.pointerId !== event.pointerId) return
    setDragDistance(Math.min(MAX_VISUAL_DRAG_PX, Math.max(0, started.startY - event.clientY)))
  }
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const started = activePointer.current
    if (!started || started.pointerId !== event.pointerId) return
    const movedUp = started.startY - event.clientY
    reset()
    if (movedUp >= DIE_THROW_DISTANCE_PX) throwOnce()
  }
  const keyboardThrow = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    throwOnce()
  }

  return <button type="button"
    className={`battle-die-drag ${dragging ? 'is-dragging' : ''} ${dragDistance >= DIE_THROW_DISTANCE_PX ? 'is-armed' : ''}`}
    aria-label={ariaLabel} disabled={disabled} title="Arraste para cima e solte; Enter ou Espaço no teclado"
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
    onPointerCancel={reset} onLostPointerCapture={reset}
    onKeyDown={keyboardThrow}
    onClick={(event) => event.preventDefault()}>
    <span className="battle-die-drag__arrow" aria-hidden="true">↑</span>
    <span className="battle-die-drag__visual" style={{ transform: `translateY(-${dragDistance}px)` }}>
      <DieIcon sides={sides} ariaLabel={`Dado d${sides} pronto para arremessar`} />
    </span>
    <span className="battle-die-drag__label">{dragDistance >= DIE_THROW_DISTANCE_PX
      ? 'SOLTE PARA ROLAR' : dragging ? 'PUXE MAIS PARA CIMA' : 'ARRASTE PARA CIMA ↑'}</span>
    <span className="battle-die-drag__hint">Solte para lançar · Enter/Espaço</span>
  </button>
}
