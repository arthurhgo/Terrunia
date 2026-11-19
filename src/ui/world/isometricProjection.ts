// Orthographic camera above the east and south axes, shared by the city, rooms and dice.
const diagonal = Math.SQRT1_2
const elevation = Math.atan(diagonal)
export const pitchSin = Math.sin(elevation)
export const pitchCos = Math.cos(elevation)

export function projectIsometric(east: number, south: number, height = 0) {
  const forward = (east + south) * diagonal
  return {
    x: (east - south) * diagonal,
    y: forward * pitchSin - height * pitchCos,
    depth: forward * pitchCos + height * pitchSin,
  }
}

export function isometricGround(x: number, y: number) {
  const right = x * diagonal
  const forward = y / pitchSin * diagonal
  return { x: forward + right, y: forward - right }
}
