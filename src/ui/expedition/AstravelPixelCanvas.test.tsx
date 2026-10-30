import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import type { TrailNodeStatus } from '../../domain/game/types'
import { AstravelPixelCanvas } from './AstravelPixelCanvas'

const trail = content.trails.trail_astravel_entry

function setup(fungorro: TrailNodeStatus = 'current') {
  const onEngage = vi.fn()
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
    currentLocationId="astravel_fungorro_01" portraitAssetId="character.terririan.default"
    reducedMotion enabled onInspect={onInspect} onEngage={onEngage} onTravelStart={vi.fn()} />)
  return { onEngage, onInspect }
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

  it('marcos bloqueados não ficam acessíveis', () => {
    const { onEngage } = setup('locked')
    expect(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' })).toBeDisabled()
    fireEvent.keyDown(window, { key: 'e' })
    expect(onEngage).not.toHaveBeenCalled()
  })
})
