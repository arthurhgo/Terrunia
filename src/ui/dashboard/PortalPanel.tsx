import { BookOpen, LockKeyhole, MapPinned, Skull, Swords, Trees } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'

export function PortalPanel({ save, onTalk }: { save: GameSave; onTalk: () => void }) {
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const startBattle = useGameStore((state) => state.startBattle)
  const navigate = useNavigate()
  const trail = content.trails.trail_astravel_entry
  const quest = save.quests.vs_astravel_first_contact

  const enter = () => enterAstravel()
  const fight = () => {
    startBattle()
    navigate('/battle')
  }

  const action = (() => {
    if (quest.status === 'available') {
      return <GameButton variant="primary" full onClick={onTalk}><BookOpen size={17} /> Falar com Eldamar</GameButton>
    }
    if (save.world.trailNodeStates.astravel_entry === 'current') {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Entrar em Astravél</GameButton>
    }
    if (save.world.trailNodeStates.astravel_fungorro_01 === 'current') {
      return <GameButton variant="primary" full onClick={fight}><Swords size={17} /> Enfrentar Fungorro</GameButton>
    }
    return <GameButton variant="ghost" full disabled><LockKeyhole size={17} /> Próxima rota bloqueada</GameButton>
  })()

  return (
    <ArcanePanel title="Portal" eyebrow="PARA ONDE VOU AGORA" className="portal-panel" as="aside">
      <div className="portal-heading">
        <MapPinned size={20} />
        <div><p className="eyebrow">EXPLORAÇÃO DE TERRÚNIA</p><h3>{trail.name}</h3><small>{trail.actLabel}</small></div>
      </div>

      <div className="difficulty-tabs" aria-label="Dificuldade">
        <button type="button" className="active">Normal</button>
        <button type="button" disabled>Elite <LockKeyhole size={11} /></button>
        <button type="button" disabled>Pesadelo <LockKeyhole size={11} /></button>
      </div>

      <div className="trail-map" aria-label="Mapa de nós da Floresta de Astravél">
        <div className="trail-map__texture" aria-hidden="true" />
        <svg viewBox="0 0 320 410" aria-hidden="true" className="trail-paths">
          <path d="M72 72 C130 72 108 145 164 151 S228 222 170 268 S114 335 226 352" />
        </svg>
        {trail.nodes.map((node, index) => {
          const status = save.world.trailNodeStates[node.id] ?? 'locked'
          const className = `trail-node trail-node--${status} trail-node--${node.type}`
          return (
            <div key={node.id} className={className} style={{ '--node-index': index } as React.CSSProperties}>
              {node.type === 'boss' ? <Skull size={19} /> : node.index}
              <span>{node.label}</span>
            </div>
          )
        })}
        <span className="map-label map-label--terran">Terran</span>
        <span className="map-label map-label--ruins">Câmaras</span>
      </div>

      <div className="trail-legend">
        <span><i className="completed" /> Concluído</span>
        <span><i className="current" /> Atual</span>
        <span><i className="locked" /> Bloqueado</span>
        <span><i className="boss" /> Chefe</span>
      </div>

      <div className="portal-rewards">
        <p className="eyebrow">RECOMPENSAS POSSÍVEIS</p>
        <div>
          <span title="Essência"><i className="reward-crystal" /></span>
          <span title="Ouro">◉</span>
          <span title="Drop fúngico">✦</span>
          <span title="Conteúdo futuro" className="locked">?</span>
        </div>
      </div>
      {action}
    </ArcanePanel>
  )
}
