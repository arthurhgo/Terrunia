import { useState } from 'react'
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
  const location = content.terranLocations[selected]
  if (!save) return <div className="iso-preview__fallback"><Link to="/">Retornar ao jogo</Link></div>

  return (
    <main className="iso-preview" aria-label="Prévia experimental isométrica de Terran">
      <header className="iso-preview__header">
        <div><span>Terrúnia · VISUAL_DRAFT</span><h1>Terran em perspectiva isométrica</h1><p>v0.6 · Prévia visual isolada, sem alteração no progresso</p></div>
        <Link to="/play" className="iso-preview__return">Voltar ao jogo funcional</Link>
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
                  onClick={() => setSelected(id)}
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
          </div>
        </div>
        <div className="iso-preview__legend">Visualização técnica em CSS 3D · Geometria e materiais temporários</div>
      </div>
      <footer className="iso-preview__footer">
        <section aria-live="polite"><span>LOCAL SELECIONADO</span><h2>{location.name}</h2><p>{location.description}</p><Link to={`/terran/${location.id}`}>Abrir serviços existentes de {location.shortName}</Link></section>
        <div className="iso-preview__controls"><button type="button" onClick={() => setZoom((v) => Math.max(.7, Math.round((v - .1) * 10) / 10))} aria-label="Afastar câmera">−</button><output>{Math.round(zoom * 100)}%</output><button type="button" onClick={() => setZoom((v) => Math.min(1.4, Math.round((v + .1) * 10) / 10))} aria-label="Aproximar câmera">+</button></div>
      </footer>
    </main>
  )
}
