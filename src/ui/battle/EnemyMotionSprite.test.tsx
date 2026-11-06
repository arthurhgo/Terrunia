/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveAsset } from '../../assets/assetRegistry'
import { EnemyMotionSprite } from './EnemyMotionSprite'

const assets = [
  'enemy.fungorro-thornback', 'enemy.spore-bulwark',
  'enemy.mycelial-stalker', 'enemy.ruin-warden',
]

afterEach(cleanup)

describe('v0.5.9 — sprites animados individuais', () => {
  it('registra quatro arquivos RGBA 128×128 com 16 quadros distintos de 32 pixels', () => {
    const rhythms = new Set<string>()
    for (const assetId of assets) {
      const sheet = resolveAsset(assetId).motionSheet
      expect(sheet, assetId).toBeDefined()
      if (!sheet) continue
      rhythms.add(sheet.rhythm)
      expect(sheet.idleMs).toBeGreaterThan(0)
      expect(sheet.defeatMs).toBeGreaterThan(sheet.hitMs)
      const image = readFileSync(join(process.cwd(), 'public', sheet.path.slice(1)))
      expect(image.subarray(1, 4).toString('ascii')).toBe('PNG')
      expect(image.readUInt32BE(16)).toBe(128)
      expect(image.readUInt32BE(20)).toBe(128)
      expect(image[25]).toBe(6)
      const parts: Buffer[] = []
      let offset = 8
      while (offset < image.length) {
        const count = image.readUInt32BE(offset)
        const kind = image.subarray(offset + 4, offset + 8).toString('ascii')
        if (kind === 'IDAT') parts.push(image.subarray(offset + 8, offset + 8 + count))
        offset += 12 + count
      }
      const decoded = inflateSync(Buffer.concat(parts))
      expect(decoded.length).toBe(128 * (128 * 4 + 1))
      const hashes: string[] = []
      for (let row = 0; row < 4; row++) for (let frame = 0; frame < 4; frame++) {
        const pixels = Buffer.alloc(32 * 32 * 4)
        for (let y = 0; y < 32; y++) {
          const offset = ((row * 32 + y) * (128 * 4 + 1)) + 1 + frame * 32 * 4
          decoded.copy(pixels, y * 128, offset, offset + 128)
        }
        hashes.push(createHash('sha256').update(pixels).digest('hex'))
      }
      expect(new Set(hashes).size, assetId).toBe(16)
    }
    expect(rhythms.size).toBe(4)
  })

  it('anima o frame correto e respeita a preferência por movimento reduzido', () => {
    const { rerender, container } = render(<EnemyMotionSprite assetId={assets[0]} motion="attack" />)
    const sheet = document.querySelector('.enemy-motion-sprite')
    expect(sheet).toHaveAttribute('data-motion', 'attack')
    expect(sheet).toHaveAttribute('data-asset', assets[0])
    rerender(<EnemyMotionSprite assetId={assets[0]} motion="defeat" />)
    expect(document.querySelector('.enemy-motion-sprite')).toHaveAttribute('data-motion', 'defeat')
    rerender(<EnemyMotionSprite assetId={assets[0]} reducedMotion />)
    expect(document.querySelector('.enemy-motion-sprite')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', resolveAsset(assets[0]).path)
  })

  it('não quebra para inimigos antigos ou sprites indisponíveis', () => {
    const { rerender, container } = render(<EnemyMotionSprite assetId="enemy.fungorro-crawler" />)
    expect(container.querySelector('img')).toBeInTheDocument()
    rerender(<EnemyMotionSprite assetId="enemy.unknown-id" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/assets/placeholders/generic.svg')
  })
})
