import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { findAstravelPath, getAstravelDecorations, getAstravelPoint, isAstravelWalkable } from './astravelNavigation'

const trail = content.trails.trail_astravel_entry

describe('malha navegável da Floresta de Astravél', () => {
  it('mantém todos os nós oficiais transitáveis, inclusive a ruína', () => {
    for (const node of trail.nodes) expect(isAstravelWalkable(getAstravelPoint(node), trail)).toBe(true)
    expect(isAstravelWalkable({ x: 5, y: 5 }, trail)).toBe(false)
    expect(isAstravelWalkable({ x: 369, y: 15 }, trail)).toBe(false)
  })

  it('encontra rotas conectadas entre todos os nós sem cruzar árvores', () => {
    for (let i = 1; i < trail.nodes.length; i += 1) {
      const destination = getAstravelPoint(trail.nodes[i])
      const path = findAstravelPath(getAstravelPoint(trail.nodes[i - 1]), destination, trail)
      expect(path.length).toBeGreaterThan(0)
      expect(path.every((point) => isAstravelWalkable(point, trail))).toBe(true)
      expect(path.at(-1)).toEqual(destination)
    }
  })

  it('libera exploração fora da rota sem modificar os dados de progressão', () => {
    const initial = structuredClone(trail)
    const destination = { x: 340, y: 40 }
    expect(isAstravelWalkable(destination, trail)).toBe(true)
    const path = findAstravelPath(getAstravelPoint(trail.nodes[0]), destination, trail)
    expect(path.length).toBeGreaterThan(0)
    expect(path.every((point) => isAstravelWalkable(point, trail))).toBe(true)
    expect(path.at(-1)).toEqual(destination)
    expect(trail).toEqual(initial)
  })

  it('mantém colisão somente em obstáculos visíveis', () => {
    const tree = getAstravelDecorations(trail).find((decoration) => decoration.kind === 'tree')
    expect(tree).toBeDefined()
    expect(isAstravelWalkable(tree!, trail)).toBe(false)
  })
})
