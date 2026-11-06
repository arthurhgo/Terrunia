import { useEffect, useState } from 'react'
import { ArrowLeft, Compass, LockKeyhole, Swords, Trees } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { PORTAL_HUNT_IDS } from '../../domain/combat/portalHunts'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import './portalHub.css'

/** VISUAL_DRAFT: a navigable selection layer, not a new canonical region or a save location. */
type Site = { id: string; title: string; x: number; y: number; unlocked: boolean; description: string }
type Point = { x: number; y: number }
const ENTRY: Point = { x: 12, y: 72 }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const clamp = (value: number) => Math.max(5, Math.min(95, value))

export function PortalHubScreen() {
  const save = useGameStore((state) => state.save)
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const startPortalWaves = useGameStore((state) => state.startPortalWaves)
  const startPortalHunt = useGameStore((state) => state.startPortalHunt)
  const navigate = useNavigate()
  const [player, setPlayer] = useState<Point>(ENTRY)
  const [goal, setGoal] = useState<Point | null>(null)
  const [facing, setFacing] = useState<'left' | 'right' | 'up' | 'down'>('down')
  const [selected, setSelected] = useState<string>('astravel')
  const [message, setMessage] = useState('Caminhe pelo mapa. Clique em uma entrada, aproxime-se e pressione E.')

  const waveUnlocked = save?.world.trailNodeStates.astravel_fungorro_01 === 'completed'
  const astravelUnlocked = save?.world.trailNodeStates.astravel_entry === 'completed'
    || save?.quests.vs_astravel_first_contact?.status === 'active'
  const sites: Site[] = [
    { id: 'astravel', title: 'Floresta de Astravél', x: 67, y: 64,
      unlocked: Boolean(astravelUnlocked), description: 'Expedição externa · começa no marco 0 — Entrada' },
    { id: 'waves', title: 'Modo Ondas', x: 66, y: 24,
      unlocked: Boolean(waveUnlocked), description: 'Combates progressivos · altar de desafios' },
    ...PORTAL_HUNT_IDS.map((id, i) => ({
      id, title: content.encounters[id]?.name ?? 'Caçada', x: 39 + i * 17, y: 42,
      unlocked: Boolean(waveUnlocked), description: 'Caçada repetível · escolha consciente',
    })),
  ]
  const selectedSite = sites.find((site) => site.id === selected)

  const activate = (site: Site) => {
    setSelected(site.id)
    if (!site.unlocked) { setMessage('Bloqueado · complete os requisitos desta atividade.'); return }
    if (distance(player, site) > 11) {
      setGoal({ x: site.x, y: site.y + 7 })
      setMessage('Caminhando para ' + site.title + ' · pressione E quando chegar.')
      return
    }
    if (site.id === 'astravel') enterAstravel()
    else if (site.id === 'waves') startPortalWaves()
    else startPortalHunt(site.id)
    const current = useGameStore.getState().save
    if (current?.battle || current?.world.currentLocationId === 'astravel_entry') navigate('/play')
  }

  // Presentation movement only. Domain transitions happen solely on intentional interaction.
  useEffect(() => {
    if (!goal) return
    const tick = window.setInterval(() => setPlayer((old) => {
      const gap = distance(old, goal)
      if (gap <= 1.1) return old
      const step = Math.min(gap, 1.8)
      setFacing(Math.abs(goal.x - old.x) > Math.abs(goal.y - old.y)
        ? goal.x > old.x ? 'right' : 'left' : goal.y > old.y ? 'down' : 'up')
      return { x: clamp(old.x + (goal.x - old.x) / gap * step), y: clamp(old.y + (goal.y - old.y) / gap * step) }
    }), 38)
    return () => window.clearInterval(tick)
  }, [goal])

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (/input|textarea|select/i.test((event.target as HTMLElement)?.tagName ?? '')) return
      const selectedSite = sites.find((site) => site.id === selected)
      const key = event.key.toLowerCase()
      const step = key === 'arrowleft' || key === 'a' ? [-2.4, 0, 'left'] as const
        : key === 'arrowright' || key === 'd' ? [2.4, 0, 'right'] as const
        : key === 'arrowup' || key === 'w' ? [0, -2.4, 'up'] as const
        : key === 'arrowdown' || key === 's' ? [0, 2.4, 'down'] as const : null
      if (step) {
        event.preventDefault()
        setGoal(null)
        setFacing(step[2])
        setPlayer((p) => ({ x: clamp(p.x + step[0]), y: clamp(p.y + step[1]) }))
      } else if ((key === 'e' || key === 'enter') && selectedSite && distance(player, selectedSite) < 11) {
        event.preventDefault()
        activate(selectedSite)
      }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  })

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle || save.world.currentLocationId !== 'location_terran_portal_plaza') return <Navigate to="/play" replace />
  return <GameShell fluid immersive><main className="portal-hub" aria-label="Mapa interativo de instâncias do Portal">
    <header><button type="button" onClick={() => navigate('/play')}><ArrowLeft size={16}/> Terran</button>
      <div><span className="eyebrow">PORTAL DE TERRAN · EXPLORAÇÃO</span><h1>Mapa de Instâncias</h1>
        <p>Entre caminhando na instância que deseja visitar. Nenhum combate começa automaticamente.</p></div>
    </header>
    <div className="portal-hub__viewport" onPointerDown={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      setGoal({ x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 })
    }}>
      <div className="portal-hub__path portal-hub__path--horizontal" aria-hidden="true" />
      <div className="portal-hub__path portal-hub__path--vertical" aria-hidden="true" />
      <div className="portal-hub__arrival" style={{ left: ENTRY.x + '%', top: ENTRY.y + '%' }}>0 · ENTRADA</div>
      {sites.map((site) => <button type="button" key={site.id} className={'portal-hub__gate ' + (site.unlocked ? 'is-open ' : 'is-locked ') + (selected === site.id ? 'is-selected' : '')}
        style={{ left: site.x + '%', top: site.y + '%' }} onClick={() => activate(site)}
        aria-label={site.title + (site.unlocked ? ' · instância disponível' : ' · bloqueada')}>
        {site.unlocked ? site.id === 'astravel' ? <Trees size={23}/> : <Swords size={22}/> : <LockKeyhole size={21}/>}
        <strong>{site.title}</strong>
        <small>{site.unlocked ? 'Disponível' : 'Bloqueada'}</small>
      </button>)}
      <div className="portal-hub__player" style={{ left: player.x + '%', top: player.y + '%' }} aria-label="Terrírian no mapa de instâncias">
        <EquippedCharacter save={save} facing={facing} sheathed />
      </div>
    </div>
    <footer><div><Compass size={17}/><span>{selectedSite?.title ?? 'Entrada'} · {selectedSite?.description ?? ''}</span></div>
      <p role="status">{message}</p>
      <button type="button" disabled={!selectedSite?.unlocked} onClick={() => selectedSite && activate(selectedSite)}>
        {selectedSite && distance(player, selectedSite) < 11 ? 'ENTRAR NA INSTÂNCIA' : 'CAMINHAR ATÉ A INSTÂNCIA'}
      </button>
    </footer>
  </main></GameShell>
}
