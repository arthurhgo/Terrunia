import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { findAstravelPath, getAstravelPoint, isAstravelWalkable } from './astravelNavigation'

const trail = content.trails.trail_astravel_entry

describe('malha navegável da Floresta de Astravél', () => {
  it('mantém todos os nós oficiais transitáveis, inclusive a ruína', () => {
    for (const node of trail.nodes) expect(isAstravelWalkable(getAstravelPoint(node), trail)).toBe(true)
    expect(isAstravelWalkable({ x: 5, y: 5 }, trail)).toBe(false)
    expect(isAstravelWalkable({ x: 369, y: 15 }, trail)).toBe(false)
  })

  it('encontra rotas conectadas entre todos os nós sem cruzar a vegetação', () => {
    for (let i = 1; i < trail.nodes.length; i += 1) {
      const destination = getAstravelPoint(trail.nodes[i])
      const path = findAstravelPath(getAstravelPoint(trail.nodes[i - 1]), destination, trail)
      expect(path.length).toBeGreaterThan(0)
      expect(path.every((point) => isAstravelWalkable(point, trail))).toBe(true)
      expect(path.at(-1)).toEqual(destination)
    }
  })

  it('mantém o movimento restrito à rota sem modificar os dados de progressão', () => {
    const initial = structuredClone(trail)
    const path = findAstravelPath(getAstravelPoint(trail.nodes[0]), { x: 380, y: 12 }, trail)
    expect(path.length).toBeGreaterThan(0)
    expect(path.every((point) => isAstravelWalkable(point, trail))).toBe(true)
    expect(trail).toEqual(initial)
  })
})
