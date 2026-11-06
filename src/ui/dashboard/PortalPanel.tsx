import {
  BookOpen,
  LockKeyhole,
  MapPinned,
  Skull,
  Trees,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { ASTRAVEL_SECTORS } from '../../content/astravel'
import { checkTrailQuestGate, getActiveTrailNode } from '../../domain/exploration/trailEngine'
import { canStartPortalHunt, PORTAL_HUNT_IDS } from '../../domain/combat/portalHunts'
import type { GameSave } from '../../domain/game/types'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'

export function PortalPanel({ save, onGoToEldamar }: {
  save: GameSave
  onGoToEldamar: () => void
  navigateOnEnter?: boolean
}) {
  const navigate = useNavigate()
  const trail = content.trails.trail_astravel_entry
  const quest = save.quests.vs_astravel_first_contact
  const currentNode = getActiveTrailNode(save, trail)
  const gate = currentNode ? checkTrailQuestGate(save, currentNode, content) : null
  const cleared = trail.nodes.filter((node) => node.type !== 'entry' && save.world.trailNodeStates[node.id] === 'completed').length

  const enter = () => navigate('/portal-hub')

  const action = (() => {
    if (save.world.trailNodeStates.astravel_entry === 'completed' && currentNode) {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Escolher destino no Portal</GameButton>
    }
    if (['available', 'offered'].includes(quest.status)) {
      return <GameButton variant="secondary" full onClick={onGoToEldamar}><BookOpen size={17} /> Ir à Casa de Eldamar</GameButton>
    }
    if (quest.status === 'active' && currentNode?.type === 'entry') {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Escolher destino no Portal</GameButton>
    }
    if (save.world.trailNodeStates.astravel_boss_preview === 'completed') {
      return <GameButton variant="secondary" full onClick={enter}><Skull size={17} /> Selecionar retorno a Astravél</GameButton>
    }
    return <GameButton variant="ghost" full disabled><LockKeyhole size={17} /> Aceite a missão para partir</GameButton>
  })()

  return (
    <ArcanePanel title="Instância disponível" eyebrow="ACESSO DE EXPEDIÇÃO" className="portal-panel" as="aside">
      <div className="portal-heading">
        <MapPinned size={20} />
        <div><p className="eyebrow">EXPLORAÇÃO DE TERRÚNIA</p><h3>{trail.name}</h3><small>{trail.actLabel}</small></div>
      </div>

      <div className="portal-sectors" aria-label="Progressão dos três trechos de Astravél">
        {ASTRAVEL_SECTORS.map((sector) => <div key={sector.id} style={{ borderColor: sector.color }}>
          <strong>{sector.name}</strong><small>Encontros {sector.from}–{sector.to}</small>
          <span>{trail.nodes.filter((node) => node.sectorId === sector.id && save.world.trailNodeStates[node.id] === 'completed').length}/5</span>
        </div>)}
      </div>
      <div className="portal-route-progress"><span>{cleared}/15 combates concluídos</span><progress max={15} value={cleared} aria-label="Combates concluídos em Astravél" /></div>
      {gate && !gate.ok && <p className="expedition-tactic">{gate.message}</p>}
      <div className="trail-map trail-map--astravel" aria-label="Mapa de nós da Floresta de Astravél">
        <div className="trail-map__texture" aria-hidden="true" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="trail-paths">
          <polyline points={trail.nodes.map((node) => `${node.position.x},${node.position.y}`).join(' ')} fill="none" vectorEffect="non-scaling-stroke" />
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
              {node.type === 'boss' ? <Skull size={15} /> : node.type === 'entry' ? <Trees size={13} /> : node.index}
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
      {save.world.trailNodeStates.astravel_fungorro_01 === 'completed' && !save.battle && (
        <section className="portal-wave-mode" aria-label="Atividades opcionais do Portal">
          <p className="eyebrow">ONDAS E CAÇADAS</p>
          <p>Recorde de Ondas: <strong>{save.world.portalWaveBest ?? 0}</strong>.</p>
          <p>Caçadas disponíveis: <strong>{PORTAL_HUNT_IDS.filter((id) => canStartPortalHunt(save, id, content).ok).length}/{PORTAL_HUNT_IDS.length}</strong>.</p>
          <small>Abra a seleção do Portal para escolher diretamente a campanha, as ondas ou uma caçada. Requisitos e recompensas aparecem nos botões.</small>
        </section>
      )}
    </ArcanePanel>
  )
}
