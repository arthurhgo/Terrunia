import { describe, expect, it } from 'vitest'
import { makeBattleDieMesh, projectBattleDie } from './battleDieGeometry'

describe('polyhedral battle dice', () => {
  it.each([[4, 3], [6, 4], [8, 3], [10, 4], [12, 5]] as const)(
    'd%i has matching physical faces with %i vertices each', (sides, corners) => {
      const die = makeBattleDieMesh(sides)
      expect(die.faces).toHaveLength(sides)
      expect(die.faces.every(face => face.indices.length === corners)).toBe(true)
      expect(die.faces.map(face => face.value).sort((a,b)=>a-b)).toEqual(Array.from({ length: sides }, (_, i) => i+1))
      const edges = new Set(die.faces.flatMap(face => face.indices.map((vertex,i) => {
        const next = face.indices[(i+1) % corners]
        return [vertex,next].sort((a,b)=>a-b).join(':')
      })))
      expect(die.vertices.length - edges.size + die.faces.length).toBe(2)
      for (let face = 1; face <= sides; face++) {
        const triangle = projectBattleDie(sides, face).find(facet => facet.value === face)
        expect(triangle?.area).toBeGreaterThan(0.16)
      }
    },
  )
})
