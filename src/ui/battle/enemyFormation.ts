/** v0.5.11 VISUAL_DRAFT: deterministic, presentation-only actor slots.
 * Offsets affect neither combat turns nor target identity. Coordinates are local
 * to the enemy stage, with the first actor's feet on the player's ground line.
 * Later enemies fan right and slightly toward the viewer (lower on screen).
 */
export type EnemyFormationSlot = {
  xPercent: number
  depthPx: number
  widthPercent: number
  layer: number
}
export function getEnemyFormationSlot(index: number, total: number): EnemyFormationSlot {
  const count = Math.max(1, Math.floor(total))
  const at = Math.max(0, Math.min(count - 1, Math.floor(index)))
  const widthPercent = Math.min(35, 90 / count)
  const step = count > 1 ? (100 - widthPercent) / (count - 1) : 0
  return {
    xPercent: count === 1 ? 35 : Math.round(at * step * 100) / 100,
    depthPx: at * (count >= 4 ? 8 : 12),
    widthPercent,
    layer: at + 3,
  }
}
