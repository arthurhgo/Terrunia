import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import type { TrailNodeStatus } from '../../domain/game/types'
import { AstravelPixelCanvas } from './AstravelPixelCanvas'

vi.mock('./astravelArt', () => ({ drawAstravel: vi.fn() }))
let frameCallback: FrameRequestCallback | null = null

const trail = content.trails.trail_astravel_entry

function setup(fungorro: TrailNodeStatus = 'current', startAt = 'astravel_fungorro_01', success = true) {
  const onEngage = vi.fn(() => success)
  const onInspect = vi.fn()
  const statuses: Record<string, TrailNodeStatus> = {
    astravel_entry: 'completed',
    astravel_fungorro_01: fungorro,
    astravel_camp_03: fungorro === 'completed' ? 'current' : 'locked',
    astravel_spore_ambush_04: 'locked',
    astravel_ruin_threshold_05: 'locked',
    astravel_boss_preview: 'boss',
  }
  render(<AstravelPixelCanvas trail={trail} statuses={statuses}
    currentLocationId={startAt} portraitAssetId="character.terririan.default"
    reducedMotion enabled onInspect={onInspect} onEngage={onEngage} onTravelStart={vi.fn()} />)
  return { onEngage, onInspect }
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  frameCallback = null
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frameCallback = callback; return 1 }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  frameCallback = null
})

describe('Entrada da Presença Fungorra na trilha pixelada', () => {
  it('E inspeciona o inimigo, mas nunca inicia combate automaticamente', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.keyDown(window, { key: 'e' })
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('clicar no marco atual abre apenas o painel para escolher enfrentar', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('marcos concluídos abrem registro e não reiniciam combate', () => {
    const { onEngage, onInspect } = setup('completed')
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('interação E da interface também apenas inspeciona', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Interagir com ponto próximo' }))
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('estar parado no marco não dispara combate; clique em Enfrentar inicia uma vez', () => {
    const { onEngage } = setup()
    act(() => { frameCallback?.(16) })
    expect(onEngage).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Enfrentar Fungorro próximo/ }))
    expect(onEngage).toHaveBeenCalledOnce()
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
  })

  it('se o motor recusar a luta, a ação Enfrentar permanece disponível', () => {
    const { onEngage } = setup('current', 'astravel_fungorro_01', false)
    act(() => { frameCallback?.(16) })
    const fight = screen.getByRole('button', { name: /Enfrentar Fungorro próximo/ })
    fireEvent.click(fight)
    fireEvent.click(fight)
    expect(onEngage).toHaveBeenCalledTimes(2)
  })

  it('caminhar desde 0 Entrada não abre luta ao chegar ao objetivo', () => {
    const { onEngage, onInspect } = setup('current', 'astravel_entry')
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onEngage).not.toHaveBeenCalled()
    for (let step = 1; step <= 300 && onInspect.mock.calls.length === 0; step += 1)
      act(() => { frameCallback?.(step * 40) })
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('marcos bloqueados não podem ser inspecionados nem combatidos', () => {
    const { onEngage, onInspect } = setup('locked')
    expect(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' })).toBeDisabled()
    fireEvent.keyDown(window, { key: 'e' })
    expect(onInspect).not.toHaveBeenCalled()
    expect(onEngage).not.toHaveBeenCalled()
  })
})
