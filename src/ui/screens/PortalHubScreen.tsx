import { useState } from 'react'
import { ArrowLeft, BookOpen, Compass, LockKeyhole, Swords, Trees } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getPortalActivities, type PortalActivity } from '../../domain/exploration/portalActivities'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { playerCopy } from '../text/playerCopy'
import './portalHub.css'

/** VISUAL_DRAFT: direct action buttons, not a separate explorable region.
 * Opening this screen does not start a battle or modify the save. */
export function PortalHubScreen() {
  const save = useGameStore((state) => state.save)
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const enterBiome = useGameStore((state) => state.enterBiome)
  const startPortalWaves = useGameStore((state) => state.startPortalWaves)
  const startPortalHunt = useGameStore((state) => state.startPortalHunt)
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [compactSection, setCompactSection] = useState<'primary' | 'hunts'>('primary')
  const activities = save ? getPortalActivities(save, content) : []

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle || save.world.currentLocationId !== 'location_terran_portal_plaza') {
    return <Navigate to="/play" replace />
  }

  const enter = (activity: PortalActivity) => {
    if (!activity.unlocked) {
      setMessage(playerCopy(activity.requirement))
      return
    }
    if (activity.kind === 'trail') {
      if (activity.id === 'astravel') enterAstravel()
      else enterBiome(activity.id)
    }
    else if (activity.kind === 'waves') startPortalWaves()
    else startPortalHunt(activity.id)

    const next = useGameStore.getState().save
    if (next?.battle || Object.values(content.trails).some((trail) => trail.nodes[0].id === next?.world.currentLocationId)) {
      navigate('/play')
      return
    }
    setMessage('Não foi possível iniciar. Verifique o estado do personagem e os requisitos da atividade.')
  }

  const activityButton = (activity: PortalActivity) => {
    const Icon = activity.kind === 'trail' ? Trees : activity.kind === 'waves' ? Swords : Compass
    return <button
      key={activity.id}
      type="button"
      className={`portal-hub__choice portal-hub__choice--${activity.kind}${activity.unlocked ? ' is-open' : ' is-locked'}`}
      disabled={!activity.unlocked}
      onClick={() => enter(activity)}
      aria-label={`${activity.title} · ${activity.unlocked ? 'Iniciar' : 'Bloqueada: ' + playerCopy(activity.requirement)}`}
      title={activity.unlocked ? `Iniciar ${activity.title}` : playerCopy(activity.requirement)}
    >
      <span className="portal-hub__choice-symbol" aria-hidden="true">
        {activity.unlocked ? <Icon size={25} /> : <LockKeyhole size={24} />}
      </span>
      <span className="portal-hub__choice-content">
        <strong>{activity.title}</strong>
        <span>{playerCopy(activity.description)}</span>
        <small>{playerCopy(activity.detail)}</small>
        <em>{activity.unlocked ? 'SELECIONAR E ENTRAR' : playerCopy(activity.requirement)}</em>
      </span>
    </button>
  }

  return <GameShell fluid immersive><main className="portal-hub" aria-label="Portal de Terran · seleção de atividades">
    <header className="portal-hub__header">
      <button type="button" className="portal-hub__back" onClick={() => navigate('/play')}>
        <ArrowLeft size={16} /> Voltar a Terran
      </button>
      <div>
        <span className="eyebrow">PORTAL DE TERRAN · 0 · ENTRADA</span>
        <h1>Escolha seu destino</h1>
        <p>Escolha uma jornada ou caçada.</p>
      </div>
    </header>
    <div className="portal-hub__content">
      <nav className="portal-hub__compact-tabs" aria-label="Selecionar atividades do Portal">
        <button type="button" aria-pressed={compactSection === 'primary'} onClick={() => setCompactSection('primary')}>Jornadas e desafios</button>
        <button type="button" aria-pressed={compactSection === 'hunts'} onClick={() => setCompactSection('hunts')}>Caçadas do Portal</button>
      </nav>
      <section className={`portal-hub__primary ${compactSection === "primary" ? "is-active-compact" : ""}`} aria-label="Aventuras principais do Portal">
        <div className="portal-hub__section-title">
          <BookOpen size={18} aria-hidden="true" /><h2>Jornada e desafios</h2>
        </div>
        <div className="portal-hub__primary-grid">
          {activities.filter((activity) => activity.kind !== 'hunt').map(activityButton)}
        </div>
      </section>
      <section className={`portal-hub__hunts ${compactSection === "hunts" ? "is-active-compact" : ""}`} aria-label="Caçadas repetíveis">
        <div className="portal-hub__section-title">
          <Swords size={18} aria-hidden="true" /><h2>Caçadas do Portal</h2>
        </div>
        <div className="portal-hub__hunt-grid">
          {activities.filter((activity) => activity.kind === 'hunt').map(activityButton)}
        </div>
      </section>
    </div>
    <footer className="portal-hub__footer">
      <p role="status">{message}</p>
    </footer>
  </main></GameShell>
}
