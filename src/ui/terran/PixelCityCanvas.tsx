import { useEffect, useRef, type PointerEvent } from 'react'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { resolveAsset } from '../../assets/assetRegistry'
import {
  CITY_HEIGHT, CITY_WIDTH, drawPixelCity, getCityDoor, getCityPoint,
  type WorldPoint,
} from './pixelCityArt'

type Direction = 'up' | 'down' | 'left' | 'right'
type Props = {
  portraitAssetId: string
  currentLocationId: string
  enabled: boolean
  objectiveId: string | null
  onEnter: (locationId: TerranLocationId) => void
}

const nearestSite = (position: WorldPoint, radius: number): TerranLocationId | null => {
  let nearest: TerranLocationId | null = null
  let distance = radius
  for (const id of TERRAN_LOCATION_IDS) {
    const door = getCityDoor(id)
    const candidate = Math.hypot(door.x - position.x, door.y - position.y)
    if (candidate < distance) { distance = candidate; nearest = id }
  }
  return nearest
}

export function PixelCityCanvas({ portraitAssetId, currentLocationId, enabled, objectiveId, onEnter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef(new Set<Direction>())
  const targetRef = useRef<{ point: WorldPoint; site: TerranLocationId | null } | null>(null)
  const initialId = TERRAN_LOCATION_IDS.find((id) => id === currentLocationId) ?? 'location_terran_portal_plaza'
  const playerRef = useRef<WorldPoint>({ ...getCityDoor(initialId) })
  const enabledRef = useRef(enabled)
  const enterRef = useRef(onEnter)
  enabledRef.current = enabled
  enterRef.current = onEnter

  useEffect(() => {
    if (!enabled) {
      keysRef.current.clear()
      targetRef.current = null
    }
  }, [enabled])

  const walkTo = (site: TerranLocationId) => {
    if (!enabledRef.current) return
    const point = getCityDoor(site)
    if (Math.hypot(playerRef.current.x - point.x, playerRef.current.y - point.y) < 20) {
      enterRef.current(site)
    } else {
      targetRef.current = { point, site }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    let frame = 0
    let raf = 0
    let previous = 0
    const sprite = new Image()
    sprite.src = resolveAsset(portraitAssetId).path
    sprite.onerror = () => {
      sprite.onerror = null
      sprite.src = resolveAsset(portraitAssetId).fallback
    }

    const directions: Record<string, Direction> = {
      arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
      arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    }
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if (directions[key]) {
        keysRef.current.add(directions[key])
        targetRef.current = null
        event.preventDefault()
      }
      if (key === 'e' || key === 'enter') {
        const site = nearestSite(playerRef.current, 29)
        if (site) enterRef.current(site)
      }
    }
    const keyup = (event: KeyboardEvent) => {
      const direction = directions[event.key.toLowerCase()]
      if (direction) keysRef.current.delete(direction)
    }
    const blur = () => keysRef.current.clear()
    const tick = (now: number) => {
      const delta = Math.min(0.05, previous ? (now - previous) / 1000 : 0)
      previous = now
      frame += 1
      let walking = false
      if (enabledRef.current) {
        let dx = Number(keysRef.current.has('right')) - Number(keysRef.current.has('left'))
        let dy = Number(keysRef.current.has('down')) - Number(keysRef.current.has('up'))
        const target = targetRef.current
        if (dx === 0 && dy === 0 && target) {
          const distance = Math.hypot(target.point.x - playerRef.current.x, target.point.y - playerRef.current.y)
          if (distance < 3.5) {
            playerRef.current = { ...target.point }
            targetRef.current = null
            if (target.site) enterRef.current(target.site)
          } else {
            dx = (target.point.x - playerRef.current.x) / distance
            dy = (target.point.y - playerRef.current.y) / distance
          }
        }
        const magnitude = Math.hypot(dx, dy)
        if (magnitude > 0) {
          walking = true
          const speed = 72 * delta / magnitude
          playerRef.current.x = Math.max(13, Math.min(CITY_WIDTH - 13, playerRef.current.x + dx * speed))
          playerRef.current.y = Math.max(30, Math.min(CITY_HEIGHT - 8, playerRef.current.y + dy * speed))
        }
      }
      drawPixelCity(ctx, playerRef.current, sprite, frame, walking)
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
    }
  }, [portraitAssetId])

  const pointerWalk = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.round((event.clientX - bounds.left) / bounds.width * CITY_WIDTH)
    const y = Math.round((event.clientY - bounds.top) / bounds.height * CITY_HEIGHT)
    const site = nearestSite({ x, y }, 32)
    targetRef.current = site
      ? { point: getCityDoor(site), site }
      : { point: { x: Math.max(13, Math.min(CITY_WIDTH - 13, x)), y: Math.max(30, Math.min(CITY_HEIGHT - 8, y)) }, site: null }
  }

  const press = (direction: Direction) => keysRef.current.add(direction)
  const release = (direction: Direction) => keysRef.current.delete(direction)

  return (
    <div className="pixel-city" aria-label="Terran — mundo pixelado explorável">
      <canvas ref={canvasRef} width={CITY_WIDTH} height={CITY_HEIGHT} onPointerDown={pointerWalk}
        className="pixel-city__canvas" role="img" aria-label="Terran vista superior 3/4; caminhe por WASD, setas ou toque" />
      <div className="pixel-city__sites">
        {TERRAN_LOCATION_IDS.map((id) => {
          const { x, y } = getCityPoint(id)
          return (
            <button key={id} type="button"
              className={`pixel-city__site ${objectiveId === id ? 'is-objective' : ''}`}
              style={{ left: `${x / CITY_WIDTH * 100}%`, top: `${(y - 31) / CITY_HEIGHT * 100}%` }}
              aria-label={`Ir para ${content.terranLocations[id].name}`}
              onClick={() => walkTo(id)} disabled={!enabled}>
              {content.terranLocations[id].shortName}
              {objectiveId === id ? <b aria-label="Objetivo">!</b> : null}
            </button>
          )
        })}
      </div>
      <div className="pixel-city__dpad" aria-label="Controle de movimento">
        {(['up', 'left', 'down', 'right'] as const).map((direction) => (
          <button key={direction} type="button" className={`pixel-city__direction pixel-city__direction--${direction}`}
            aria-label={`Mover ${direction}`} disabled={!enabled}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(direction) }}
            onPointerUp={() => release(direction)} onPointerCancel={() => release(direction)}
            onLostPointerCapture={() => release(direction)}>
            {{ up: '▲', left: '◀', down: '▼', right: '▶' }[direction]}
          </button>
        ))}
        <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={() => {
          const site = nearestSite(playerRef.current, 29)
          if (site) enterRef.current(site)
        }}>E</button>
      </div>
    </div>
  )
}
