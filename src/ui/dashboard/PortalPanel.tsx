import { useState } from 'react'
import { BookOpen, Compass, LockKeyhole, Swords, Trees } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getPortalActivities, type PortalActivity } from '../../domain/exploration/portalActivities'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { playerCopy } from '../text/playerCopy'
import './portalPanelEmbedded.css'

/** v0.5.11: one action surface inside the Praça do Portal. No intermediate menu.
 * Activities and gates are provided by the existing domain selectors.
 */
export function PortalPanel({ save, onGoToEldamar, navigateOnEnter = true }: {
  save: GameSave; onGoToEldamar: () => void; navigateOnEnter?: boolean
}) {
  const enterAstravel = useGameStore((s) => s.enterAstravel)
  const enterBiome = useGameStore((s) => s.enterBiome)
  const startPortalWaves = useGameStore((s) => s.startPortalWaves)
  const startPortalHunt = useGameStore((s) => s.startPortalHunt)
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const activities = getPortalActivities(save, content)
  const selectActivity = (activity: PortalActivity) => {
    if (!activity.unlocked) return
    if (activity.kind === 'trail') {
      if (activity.id === 'astravel') enterAstravel()
      else enterBiome(activity.id)
    } else if (activity.kind === 'waves') startPortalWaves()
    else startPortalHunt(activity.id)
    const next = useGameStore.getState().save
    if (next?.battle || Object.values(content.trails).some((trail) =>
      trail.nodes[0]?.id === next?.world.currentLocationId ||
      trail.nodes.some((node) => node.id === next?.world.currentLocationId))) {
      if (navigateOnEnter) navigate('/play')
    } else setMessage('Não foi possível iniciar. Confira os requisitos da atividade.')
  }
  const render = (activity: PortalActivity) => {
    const Icon = activity.kind === 'trail' ? Trees : activity.kind === 'waves' ? Swords : Compass
    const detail = playerCopy(activity.detail.replace(/\s*·\s*(?:CONTENT_DRAFT|BALANCE_DRAFT|OWNER_DECISION)/g, ''))
    const requirement = playerCopy(activity.requirement)
    return <button type="button" key={activity.id} className="portal-actions__activity"
      disabled={!activity.unlocked}
      aria-label={`${activity.title} · ${activity.unlocked ? 'Iniciar' : 'Bloqueada: ' + requirement}`}
      title={activity.unlocked ? `Entrar em ${activity.title}` : requirement}
      onClick={() => selectActivity(activity)}>
      <span className="portal-actions__symbol">{activity.unlocked ? <Icon size={17}/> : <LockKeyhole size={15}/>}</span>
      <span className="portal-actions__information"><strong>{activity.title}</strong>
        <small>{activity.unlocked ? detail : requirement}</small></span>
    </button>
  }
  return <section className="portal-actions" aria-label="Atividades da Praça do Portal">
    <header className="portal-actions__header">
      <span className="eyebrow">ACESSO DE EXPEDIÇÃO</span>
      <strong>Escolha sua jornada</strong>
      <small>Selecione uma atividade para entrar. O Portal não inicia combates automaticamente.</small>
    </header>
    <div className="portal-actions__columns">
      <section aria-label="Jornadas e desafios">
        <h3><BookOpen size={15}/> Jornadas e desafios</h3>
        <div>{activities.filter((activity) => activity.kind !== 'hunt').map(render)}</div>
      </section>
      <section aria-label="Caçadas do Portal">
        <h3><Swords size={15}/> Caçadas do Portal</h3>
        <div>{activities.filter((activity) => activity.kind === 'hunt').map(render)}</div>
      </section>
    </div>
    {!activities.some((activity) => activity.unlocked) && <button className="portal-actions__eldamar"
      type="button" onClick={onGoToEldamar}>Conversar com Eldamar sobre a primeira expedição</button>}
    {message && <p role="status">{message}</p>}
  </section>
}
