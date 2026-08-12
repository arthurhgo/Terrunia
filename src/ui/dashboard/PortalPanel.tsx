import {
  BookOpen,
  LockKeyhole,
  MapPinned,
  Search,
  Skull,
  Swords,
  TentTree,
  Trees,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getActiveTrailNode } from '../../domain/exploration/trailEngine'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'

export function PortalPanel({ save, onGoToEldamar }: { save: GameSave; onGoToEldamar: () => void }) {
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const resolveCurrentTrailNode = useGameStore((state) => state.resolveCurrentTrailNode)
  const startBattle = useGameStore((state) => state.startBattle)
  const navigate = useNavigate()
  const trail = content.trails.trail_astravel_entry
  const quest = save.quests.vs_astravel_first_contact
  const currentNode = getActiveTrailNode(save, trail)

  const enter = () => enterAstravel()
  const fight = (nodeId: string) => {
    startBattle(nodeId)
    navigate('/battle')
  }

  const action = (() => {
    if (['available', 'offered'].includes(quest.status)) {
      return <GameButton variant="secondary" full onClick={onGoToEldamar}><BookOpen size={17} /> Ir à Casa de Eldamar</GameButton>
    }
    if (currentNode?.type === 'entry') {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Entrar em Astravél</GameButton>
    }
    if (currentNode?.type === 'battle') {
      return <GameButton variant="primary" full onClick={() => fight(currentNode.id)}><Swords size={17} /> {currentNode.actionLabel ?? currentNode.label}</GameButton>
    }
    if (currentNode?.type === 'boss') {
      return <GameButton variant="primary" full onClick={() => fight(currentNode.id)}><Skull size={17} /> {currentNode.actionLabel ?? currentNode.label}</GameButton>
    }
    if (currentNode?.type === 'camp') {
      return <GameButton variant="primary" full onClick={resolveCurrentTrailNode}><TentTree size={17} /> {currentNode.interaction?.actionLabel}</GameButton>
    }
    if (currentNode?.type === 'event') {
      return <GameButton variant="primary" full onClick={resolveCurrentTrailNode}><Search size={17} /> {currentNode.interaction?.actionLabel}</GameButton>
    }
    if (save.world.trailNodeStates.astravel_boss_preview === 'completed') {
      return <GameButton variant="ghost" full disabled><Skull size={17} /> Câmaras Fúngicas concluídas</GameButton>
    }
    return <GameButton variant="ghost" full disabled><LockKeyhole size={17} /> Câmaras Fúngicas bloqueadas</GameButton>
  })()

  return (
    <ArcanePanel title="Instância disponível" eyebrow="ACESSO DE EXPEDIÇÃO" className="portal-panel" as="aside">
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
          <path d="M58 54 C105 68 128 92 154 111 S122 177 100 197 S161 239 205 254 S132 305 128 327 S188 359 230 367" />
        </svg>
        {trail.nodes.map((node, index) => {
          const status = save.world.trailNodeStates[node.id] ?? 'locked'
          const className = `trail-node trail-node--${status} trail-node--${node.type}`
          return (
            <div
              key={node.id}
              className={className}
              style={{
                '--node-index': index,
                left: `${node.position.x}%`,
                top: `${node.position.y}%`,
              } as React.CSSProperties}
            >
              {node.type === 'boss' ? <Skull size={19} /> : node.index}
              <span>{node.label}</span>
            </div>
          )
        })}
        <span className="map-label map-label--terran">Terran</span>
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
