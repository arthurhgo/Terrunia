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
  it('inicia o encontro com E quando está perto, sem depender do drawer', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.keyDown(window, { key: 'e' })
    expect(onEngage).toHaveBeenCalledOnce()
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onInspect).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onEngage).toHaveBeenCalledOnce()
  })

  it('ao clicar no marco atual, entra no encontro sem segundo clique', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onInspect).not.toHaveBeenCalled()
  })

  it('marcos concluídos abrem registro sem repetir combate', () => {
    const { onEngage, onInspect } = setup('completed')
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onInspect).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onEngage).not.toHaveBeenCalled()
  })

  it('o botão E na tela também começa o encontro (não apenas o teclado)', () => {
    const { onEngage, onInspect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Interagir com ponto próximo' }))
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
    expect(onInspect).not.toHaveBeenCalled()
  })

  it('quando o personagem já está parado no marco, a cena inicia o encontro no próximo frame', () => {
    const { onEngage } = setup()
    expect(frameCallback).not.toBeNull()
    act(() => { frameCallback?.(16) })
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
  })

  it('se o motor recusar o combate, E pode tentar de novo sem ficar travado', () => {
    const { onEngage } = setup('current', 'astravel_fungorro_01', false)
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: 'e' })
    expect(onEngage).toHaveBeenCalledTimes(2)
  })

  it('ao clicar no marco de longe, o personagem percorre a trilha e o combate abre na chegada', () => {
    const { onEngage } = setup('current', 'astravel_entry')
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(onEngage).not.toHaveBeenCalled()
    for (let step = 1; step <= 300 && onEngage.mock.calls.length === 0; step += 1) {
      act(() => { frameCallback?.(step * 40) })
    }
    expect(onEngage).toHaveBeenCalledWith('astravel_fungorro_01')
  })

  it('marcos bloqueados não ficam acessíveis', () => {
    const { onEngage } = setup('locked')
    expect(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' })).toBeDisabled()
    fireEvent.keyDown(window, { key: 'e' })
    expect(onEngage).not.toHaveBeenCalled()
  })
})
