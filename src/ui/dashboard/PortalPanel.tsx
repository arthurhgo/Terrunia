import {
  BookOpen,
  Infinity as InfinityIcon,
  LockKeyhole,
  MapPinned,
  Repeat2,
  Skull,
  Sparkles,
  Swords,
  Trees,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getActiveTrailNode } from '../../domain/exploration/trailEngine'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'

export function PortalPanel({ save, onGoToEldamar, navigateOnEnter = true }: {
  save: GameSave
  onGoToEldamar: () => void
  navigateOnEnter?: boolean
}) {
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const startPortalHunt = useGameStore((state) => state.startPortalHunt)
  const startPortalWave = useGameStore((state) => state.startPortalWave)
  const navigate = useNavigate()
  const trail = content.trails.trail_astravel_entry
  const quest = save.quests.vs_astravel_first_contact
  const currentNode = getActiveTrailNode(save, trail)
  const hunts = Object.values(content.encounters).filter((encounter) => encounter.portalMode === 'hunt')

  const enter = () => {
    enterAstravel()
    if (navigateOnEnter) navigate('/expedition')
  }

  const enterCombat = (start: () => void) => {
    start()
    if (navigateOnEnter && useGameStore.getState().save?.battle) navigate('/battle')
  }

  const action = (() => {
    if (save.world.trailNodeStates.astravel_entry === 'completed' && currentNode) {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Retomar exploração em Astravél</GameButton>
    }
    if (['available', 'offered'].includes(quest.status)) {
      return <GameButton variant="secondary" full onClick={onGoToEldamar}><BookOpen size={17} /> Ir à Casa de Eldamar</GameButton>
    }
    if (quest.status === 'active' && currentNode?.type === 'entry') {
      return <GameButton variant="primary" full onClick={enter}><Trees size={17} /> Entrar em Astravél</GameButton>
    }
    if (save.world.trailNodeStates.astravel_boss_preview === 'completed') {
      return <GameButton variant="secondary" full onClick={enter}><Skull size={17} /> Revisitar Astravél · ruína concluída</GameButton>
    }
    return <GameButton variant="ghost" full disabled><LockKeyhole size={17} /> Aceite a missão para partir</GameButton>
  })()

  return (
    <ArcanePanel title="Central de instâncias" eyebrow="ACESSO DE EXPEDIÇÃO" className="portal-panel" as="aside">
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

      <section className="portal-combat-hub" aria-labelledby="portal-hunts-title">
        <div className="portal-combat-hub__heading">
          <Repeat2 size={18} />
          <div><p className="eyebrow">COMBATE REPETÍVEL</p><h3 id="portal-hunts-title">Caçadas do Portal</h3></div>
        </div>
        <div className="portal-hunt-grid">
          {hunts.map((encounter, index) => (
            <article key={encounter.id}>
              <span className="portal-hunt-grid__rank">NÍVEL {index + 1}</span>
              <Swords size={18} />
              <strong>{encounter.name}</strong>
              <small>{encounter.enemyDefinitionIds.map((id) => content.enemies[id]?.name).filter(Boolean).join(' + ')}</small>
              <button type="button" onClick={() => enterCombat(() => startPortalHunt(encounter.id))}>Iniciar caçada</button>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-wave-card" aria-labelledby="portal-wave-title">
        <div className="portal-wave-card__sigil"><InfinityIcon size={28} /></div>
        <div>
          <p className="eyebrow">MODO ONDAS · SEM LIMITE</p>
          <h3 id="portal-wave-title">Portal sem Fim</h3>
          <p>Inimigos e atributos escalam a cada onda. Chefes surgem a cada cinco ondas e todos os drops devem ser recolhidos antes de avançar.</p>
          <div className="portal-wave-stats">
            <span><Trophy size={15} /> Recorde <strong>{save.portalCombat.bestWave}</strong></span>
            <span><Sparkles size={15} /> Ondas vencidas <strong>{save.portalCombat.totalWavesCleared}</strong></span>
          </div>
        </div>
        <GameButton variant="primary" onClick={() => enterCombat(startPortalWave)}>
          <InfinityIcon size={17} /> {save.portalCombat.activeRun ? `Continuar onda ${save.portalCombat.activeRun.currentWave}` : 'Iniciar onda 1'}
        </GameButton>
      </section>
    </ArcanePanel>
  )
}
