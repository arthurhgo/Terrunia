import type { AttributeDie } from '../../domain/game/types'
import { projectIsometric } from '../world/isometricProjection'

type Vector = [number, number, number]
type Plane = { indices: number[]; normal: Vector; distance: number }
const add = (a: Vector, b: Vector): Vector => [a[0]+b[0], a[1]+b[1], a[2]+b[2]]
const sub = (a: Vector, b: Vector): Vector => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
const times = ([x,y,z]: Vector, k: number): Vector => [x*k,y*k,z*k]
const dot = (a: Vector, b: Vector) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const cross = (a: Vector, b: Vector): Vector => [
  a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0],
]
const magnitude = (v: Vector) => Math.hypot(...v)
const unit = (v: Vector) => times(v, 1 / magnitude(v))
const mean = (vectors: readonly Vector[]) => times(vectors.reduce(add, [0,0,0]), 1 / vectors.length)

// Collect each supporting plane once, keeping coplanar vertices as a single face.
function hull(vertices: readonly Vector[]): Plane[] {
  const seen = new Set<string>()
  const planes: Plane[] = []
  const epsilon = 1e-6
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      for (let k = j + 1; k < vertices.length; k++) {
        const raw = cross(sub(vertices[j], vertices[i]), sub(vertices[k], vertices[i]))
        if (magnitude(raw) < epsilon) continue
        const normal = unit(times(raw, dot(raw, vertices[i]) < 0 ? -1 : 1))
        const distance = dot(normal, vertices[i])
        const offsets = vertices.map(vertex => dot(normal, vertex) - distance)
        if (offsets.some(offset => offset > epsilon)) continue
        const indices = offsets.flatMap((offset, index) => Math.abs(offset) < epsilon ? [index] : [])
        const key = indices.join(',')
        if (seen.has(key)) continue
        seen.add(key)
        const center = mean(indices.map(index => vertices[index]))
        const right = unit(sub(vertices[indices[0]], center))
        const up = cross(normal, right)
        const angle = (index: number) => {
          const delta = sub(vertices[index], center)
          return Math.atan2(dot(delta, up), dot(delta, right))
        }
        indices.sort((a,b) => angle(a) - angle(b))
        planes.push({ indices, normal, distance })
      }
    }
  }
  return planes
}

const dual = (vertices: readonly Vector[]): Vector[] => hull(vertices)
  .map(({ normal, distance }) => times(normal, 1 / distance))
const signs = [-1, 1]
const cube: Vector[] = signs.flatMap(x => signs.flatMap(y => signs.map((z): Vector => [x,y,z])))
const phi = (1 + Math.sqrt(5)) / 2
const icosahedron = signs.flatMap(a => signs.flatMap((b): Vector[] =>
  [[0,a,b*phi], [a,b*phi,0], [b*phi,0,a]]))
const antiprism = signs.flatMap((side, ring) => Array.from({ length: 5 }, (_, index): Vector => {
  const angle = (index * 2 + ring) * Math.PI / 5
  return [Math.cos(angle), side * 0.5, Math.sin(angle)]
}))

const verticesByDie: Record<AttributeDie, Vector[]> = {
  4: cube.filter(([x,y,z]) => x*y*z > 0),
  6: cube,
  8: [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]],
  10: dual(antiprism),
  12: dual(icosahedron),
}
export const battleDieShape: Record<AttributeDie, string> = {
  4: 'tetraedro', 6: 'cubo', 8: 'octaedro', 10: 'trapezoedro-pentagonal', 12: 'dodecaedro',
}

export function makeBattleDieMesh(sides: AttributeDie) {
  const source = verticesByDie[sides]
  const radius = Math.max(...source.map(magnitude))
  const vertices = source.map(point => times(point, 1 / radius))
  const planes = hull(vertices)
  const values = new Map<number, number>()
  let next = 1
  for (let i = 0; i < planes.length; i++) {
    if (values.has(i)) continue
    values.set(i, next)
    const opposite = planes.findIndex(other => dot(other.normal, planes[i].normal) < -0.99999)
    if (opposite >= 0) values.set(opposite, sides+1-next)
    next++
  }
  return { vertices, faces: planes.map((face,index) => ({ ...face, value: values.get(index)! })) }
}

const meshes = {
  4: makeBattleDieMesh(4), 6: makeBattleDieMesh(6), 8: makeBattleDieMesh(8),
  10: makeBattleDieMesh(10), 12: makeBattleDieMesh(12),
}

function basis(normal: Vector) {
  const vertical: Vector = Math.abs(normal[1]) > 0.98 ? [0,0,1] : [0,1,0]
  const right = unit(cross(vertical, normal))
  return { right, up: cross(normal, right) }
}

const targetNormal = unit([0.42, 0.62, 1])
const targetBasis = basis(targetNormal)
const keyLight = unit([0.25, 0.91, 0.44])
const projection = ([x,y,z]: Vector) => projectIsometric(x,z,y)

export function projectBattleDie(sides: AttributeDie, settleOn?: number, rollProgress?: number) {
  const { vertices, faces } = meshes[sides]
  const normal = faces.find(face => face.value === settleOn)?.normal
  const from = normal && basis(normal)
  const spin = rollProgress === undefined ? 0 : (1 - rollProgress) ** 1.75 * Math.PI * 2
  const rotate = (v: Vector): Vector => {
    const [x,y,z] = normal && from ? add(
      add(times(targetBasis.right,dot(v,from.right)), times(targetBasis.up,dot(v,from.up))),
      times(targetNormal,dot(v,normal))) : v
    if (spin === 0) return [x,y,z]
    const a = spin * 3, b = spin * 2
    const tippedY = y*Math.cos(a)-z*Math.sin(a)
    const tippedZ = y*Math.sin(a)+z*Math.cos(a)
    return [x*Math.cos(b)+tippedZ*Math.sin(b), tippedY, -x*Math.sin(b)+tippedZ*Math.cos(b)]
  }
  const points = vertices.map(vertex => projection(rotate(vertex)))
  return faces.flatMap(face => {
    const outward = rotate(face.normal)
    if (projection(outward).depth <= 0.015) return []
    const polygon = face.indices.map(index => points[index])
    const center = polygon.reduce((sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y, depth: sum.depth + p.depth }),
      { x: 0, y: 0, depth: 0 })
    const area = Math.abs(polygon.reduce((sum,p,i) => {
      const next = polygon[(i+1)%polygon.length]
      return sum + p.x*next.y - next.x*p.y
    }, 0)) * 0.5
    return [{
      value: face.value,
      points: polygon.map(p => `${(48+p.x*42).toFixed(2)},${(48+p.y*42).toFixed(2)}`).join(' '),
      x: 48+42*center.x/polygon.length,
      y: 48+42*center.y/polygon.length,
      depth: center.depth/polygon.length,
      light: 0.46+0.54*Math.max(0,dot(outward,keyLight)),
      area,
    }]
  }).sort((a,b) => a.depth-b.depth)
}
