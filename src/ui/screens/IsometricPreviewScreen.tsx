import { useEffect, useRef, useState } from 'react'
import { IsometricContext } from './IsometricContext'
import { getCityCast } from '../terran/cityCast'
import { CITY_WIDTH, CITY_HEIGHT, getCityDoor, getCityPoint, type WorldPoint } from '../terran/cityWorld'
import { findCityPath, isCityWalkable } from '../terran/cityNavigation'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { useGameStore } from '../../state/gameStore'
import './isometricPreview.css'

/**
 * VISUAL_DRAFT v0.6: an isolated, opt-in perspective scene.
 * World-space interaction and NPC/battle simulation remain authoritative in /play.
 * Do not persist preview camera or selection into the game save.
 */
export function IsometricPreviewScreen() {
  const save = useGameStore((state) => state.save)
  const [selected, setSelected] = useState<TerranLocationId>('location_terran_portal_plaza')
  const [zoom, setZoom] = useState(1)

  const [player, setPlayer] = useState<WorldPoint>({ x: 384, y: 312 })
  const heroRef = useRef(player)
  heroRef.current = player
  const pathRef = useRef<WorldPoint[]>([])
  const keysRef = useRef(new Set<string>())

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) return
      if (event.target instanceof HTMLElement && ['BUTTON', 'INPUT', 'TEXTAREA'].includes(event.target.tagName)) return
      event.preventDefault()
      keysRef.current.add(key)
      pathRef.current = []
    }
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase())
    const clear = () => keysRef.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    const frame = window.setInterval(() => {
      const keys = keysRef.current
      let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
      let dy = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
      const path = pathRef.current
      if (dx === 0 && dy === 0 && path.length) {
        const node = path[0]
        const dist = Math.hypot(node.x - heroRef.current.x, node.y - heroRef.current.y)
        if (dist < 3) { path.shift(); return }
        dx = (node.x - heroRef.current.x) / dist
        dy = (node.y - heroRef.current.y) / dist
      }
      if (dx === 0 && dy === 0) return
      const d = Math.hypot(dx, dy)
      const candidate = { x: heroRef.current.x + dx / d * 2.5, y: heroRef.current.y + dy / d * 2.5 }
      if (isCityWalkable(candidate)) { heroRef.current = candidate; setPlayer(candidate) }
      else pathRef.current = []
    }, 40)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      window.clearInterval(frame)
    }
  }, [])
  const walkTo = (target: WorldPoint) => { pathRef.current = findCityPath(heroRef.current, target) }

  const location = content.terranLocations[selected]
  if (!save) return <div className="iso-preview__fallback"><Link to="/">Retornar ao jogo</Link></div>

  return (
    <main className="iso-preview" aria-label="Prévia experimental isométrica de Terran">
      <header className="iso-preview__header">
        <div><span>Terrúnia · VISUAL_DRAFT</span><h1>Terran isométrica · v0.6</h1><p>v0.6 · Prévia visual isolada, sem alteração no progresso</p></div>
        <Link to="/play" className="iso-preview__return">Continuar no jogo completo</Link>
      </header>
      <div className="iso-preview__viewport">
        <div className="iso-preview__camera" style={{ transform: `scale(${zoom})` }}>
          <div className="iso-preview__world">
            <div className="iso-preview__terrain" />
            <div className="iso-preview__path iso-preview__path--horizontal" />
            <div className="iso-preview__path iso-preview__path--vertical" />
            {TERRAN_LOCATION_IDS.map((id) => {
              const item = content.terranLocations[id]
              const isPortal = id === 'location_terran_portal_plaza'
              const x = item.mapPosition.x
              const y = item.mapPosition.y
              return (
                <button
                  key={id}
                  type="button"
                  className={`iso-preview__building ${selected === id ? 'is-selected' : ''} ${isPortal ? 'is-portal' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => { setSelected(id); walkTo(getCityDoor(id)) }}
                  aria-pressed={selected === id}
                  aria-label={`Selecionar ${item.name}`}
                >
                  <span className="iso-preview__building-volume">
                    <span className="iso-preview__building-roof" />
                    <span className="iso-preview__building-front" />
                    <span className="iso-preview__building-side" />
                    <span className="iso-preview__building-glow" />
                  </span>
                  <span className="iso-preview__building-label">{item.shortName}</span>
                </button>
              )
            })}

            {getCityCast(save).map((actor) => (
              <button key={actor.id} type="button" className="iso-preview__npc-token"
                style={{ left: String(actor.point.x / CITY_WIDTH * 100) + '%',
                  top: String(actor.point.y / CITY_HEIGHT * 100) + '%' }}
                title={actor.presence.label}
                onClick={() => { setSelected(actor.locationId); walkTo(actor.point) }}
                aria-label={'Caminhar até ' + actor.presence.label}>
                <span className="iso-preview__npc-head" />
                {actor.marker && <strong>{actor.marker}</strong>}
              </button>
            ))}
            <div className="iso-preview__hero-token" aria-label="Personagem do jogador" style={{
              left: String(player.x / CITY_WIDTH * 100) + '%',
              top: String(player.y / CITY_HEIGHT * 100) + '%' }}>
              <span />
            </div>
          </div>
        </div>
        <div className="iso-preview__legend">Prévia navegável · WASD/setas para caminhar · clique nos edifícios/NPCs</div>
      </div>
      <footer className="iso-preview__footer">
        <section aria-live="polite"><span>LOCAL SELECIONADO</span><h2>{location.name}</h2><p>{location.description}</p><Link to={`/terran/${location.id}`}>Abrir serviços existentes de {location.shortName}</Link></section>
        <div className="iso-preview__controls"><button type="button" onClick={() => setZoom((v) => Math.max(.7, Math.round((v - .1) * 10) / 10))} aria-label="Afastar câmera">−</button><output>{Math.round(zoom * 100)}%</output><button type="button" onClick={() => setZoom((v) => Math.min(1.4, Math.round((v + .1) * 10) / 10))} aria-label="Aproximar câmera">+</button></div>
      </footer>
      <IsometricContext save={save} selected={selected} />
    </main>
  )
}
