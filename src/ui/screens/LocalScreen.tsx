import { ArrowRight, Coins, Compass, Gem, LockKeyhole, MapPin, Shield, Skull, Swords, Waves } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { PORTAL_HUNT_IDS } from '../../domain/combat/portalHunts'
import { getTrackedQuestEntries } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'

type Filter = 'all' | 'portal' | 'hunt' | 'boss' | 'active'
type Instance = {
  id: string
  category: Exclude<Filter, 'all' | 'active'>
  title: string
  description: string
  enemyAssetId: string
  level: number | null
  rewards: string[]
  available: boolean
  accessHint: string
  action: 'trail' | 'waves' | 'hunt'
}

export function LocalScreen() {
  const save = useGameStore((state) => state.save)
  const travel = useGameStore((state) => state.travelInTerran)
  const enterAstravel = useGameStore((state) => state.enterAstravel)
  const startPortalWaves = useGameStore((state) => state.startPortalWaves)
  const startPortalHunt = useGameStore((state) => state.startPortalHunt)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  if (!save) return <Navigate to="/character/create" replace />
  const unlockedHunts = save.world.trailNodeStates.astravel_fungorro_01 === 'completed'
  const canTravel = save.quests.vs_astravel_first_contact?.status === 'active' ||
    save.world.trailNodeStates.astravel_entry === 'completed'
  const readyForBattle = save.vitals.hp > 0 && !save.battle
  const firstEncounter = content.encounters.encounter_fungorro_01
  const boss = content.encounters.encounter_colossus_mycelium_01
  const encounterInfo = (id: string) => {
    const encounter = content.encounters[id]
    return {
      enemyAssetId: content.enemies[encounter.enemyDefinitionIds[0]]?.assetId ?? 'enemy.unassigned',
      level: Math.max(...encounter.enemyDefinitionIds.map((enemyId) => content.enemies[enemyId]?.level ?? 1)),
      rewards: [`+${encounter.rewards.characterXp} XP`, `+${encounter.rewards.gold} Ouro`,
        ...encounter.rewards.lootDefinitionIds.slice(0, 2).map((itemId) => content.items[itemId]?.name ?? itemId)],
    }
  }

  const instances: Instance[] = [
    {
      id: 'astravel', category: 'portal', title: 'Floresta de Astravél',
      description: 'Expedição do prólogo: descubra os encontros da trilha e avance rumo à Ruína.',
      ...encounterInfo(firstEncounter.id), available: canTravel && readyForBattle,
      accessHint: 'Aceite a missão de Eldamar para acessar a trilha.', action: 'trail',
    },
    {
      id: 'fungal', category: 'boss', title: 'Câmaras Fúngicas · Colosso Micélio',
      description: 'Chefe da trilha de Astravél. A câmara é alcançada pela exploração, não por teleporte.',
      ...encounterInfo(boss.id), available: canTravel && readyForBattle,
      accessHint: 'Avance pela trilha de Astravél até a entrada das Câmaras.', action: 'trail',
    },
    {
      id: 'waves', category: 'portal', title: 'Modo Ondas do Portal',
      description: 'Combate repetível com ondas progressivas, sentinelas e saída entre vitórias.',
      enemyAssetId: 'enemy.spore-sower', level: null, rewards: ['Recompensas por onda', 'Ressonância', 'Drops'],
      available: unlockedHunts && readyForBattle, accessHint: 'Conclua o primeiro encontro de Astravél.', action: 'waves',
    },
    ...PORTAL_HUNT_IDS.map((id): Instance => {
      const encounter = content.encounters[id]
      return { id, category: 'hunt', title: encounter.name, description: encounter.locationLabel,
        ...encounterInfo(id), available: unlockedHunts && readyForBattle,
        accessHint: 'Conclua o primeiro encontro de Astravél.', action: 'hunt' }
    }),
  ]
  const shown = instances.filter((entry) => filter === 'all' ||
    (filter === 'active' ? entry.available : entry.category === filter))
  const tracked = getTrackedQuestEntries(save, content)[0]

  const start = (entry: Instance) => {
    if (!entry.available) return
    // All these combat entry points require the real Portal location.
    travel('location_terran_portal_plaza')
    if (entry.action === 'trail') enterAstravel()
    else if (entry.action === 'waves') startPortalWaves()
    else startPortalHunt(entry.id)
    navigate('/play')
  }

  return <GameShell fluid>
    <div className="local-board-screen">
      <header className="local-board__header">
        <div><p className="eyebrow">LOCAL · DESTINOS DE TERRÚNIA</p><h1>Instâncias de Combate</h1>
          <p>Escolha um encontro real de Astravél ou do Portal. Acesso, recompensas e níveis seguem o progresso do seu personagem.</p></div>
        <div className="local-board__summary"><Swords size={17} /> Nível {save.character.level}
          <span><Coins size={14} /> {save.wallet.gold} Ouro</span><span><Gem size={14} /> {save.essence.current} Essência</span>
        </div>
      </header>
      <div className="local-board__filters" role="group" aria-label="Filtrar instâncias de combate">
        {([
          { id: 'all', label: 'Todos', icon: Compass },
          { id: 'portal', label: 'Portal', icon: Waves },
          { id: 'hunt', label: 'Caçadas', icon: Swords },
          { id: 'boss', label: 'Chefes', icon: Skull },
          { id: 'active', label: 'Disponíveis', icon: Shield },
        ] as const).map(({ id, label, icon: Icon }) =>
          <button type="button" key={id} className={filter === id ? 'active' : ''}
            aria-pressed={filter === id} onClick={() => setFilter(id)}><Icon size={15} /> {label}</button>)}
      </div>
      <div className="local-board__layout">
        <div className="local-board__grid" aria-label="Instâncias disponíveis e bloqueadas">
          {shown.map((entry) => <article className={`local-instance local-instance--${entry.category}`} key={entry.id}>
            <div className="local-instance__art"><AssetImage assetId={entry.enemyAssetId} />
              <span>{entry.category === 'hunt' ? 'CAÇADA' : entry.category === 'boss' ? 'CHEFE' : 'PORTAL'}</span>
            </div>
            <div className="local-instance__body">
              <h2>{entry.title}</h2><p>{entry.description}</p>
              <div className="local-instance__metrics">
                <span>{entry.level ? `NÍVEL DOS INIMIGOS · ${entry.level}` : 'ONDAS PROGRESSIVAS'}</span>
                <span>{entry.available ? 'ACESSÍVEL' : 'BLOQUEADO'}</span>
              </div>
              <div className="local-instance__rewards"><small>RECOMPENSAS</small>
                <p>{entry.rewards.join(' · ')}</p></div>
              <button type="button" disabled={!entry.available} onClick={() => start(entry)}
                aria-label={`Entrar em ${entry.title}`}>
                {entry.available ? <><Swords size={15} /> {entry.action === 'trail' ? 'Explorar rota' : 'Entrar'} <ArrowRight size={15} /></> :
                  <><LockKeyhole size={15} /> Bloqueado</>}
              </button>
              {!entry.available && <small className="local-instance__hint">{entry.accessHint}</small>}
            </div>
          </article>)}
          {shown.length === 0 && <p className="local-board__empty">Nenhuma instância se encaixa neste filtro.</p>}
        </div>
        <aside className="local-board__aside" aria-label="Resumo do combate">
          <h3><MapPin size={17} /> Objetivo rastreado</h3>
          {tracked ? <><strong>{tracked.definition.title}</strong>
            <p>{tracked.definition.objectives[0]?.label}</p>
            <small>Progresso: {tracked.definition.objectives.reduce((n, o) => n + Math.min(o.required, tracked.progress.objectives[o.id] ?? 0), 0)}
              /{tracked.definition.objectives.reduce((n, o) => n + o.required, 0)}</small></> :
            <p>Nenhuma missão rastreada. Acompanhe as missões no Registro de Missões.</p>}
          <button type="button" onClick={() => navigate('/quests')}>Ver missões <ArrowRight size={16} /></button>
          <div className="local-board__aside-meta">
            <span>Combates liberados <b>{instances.filter((item) => item.available).length}/{instances.length}</b></span>
            <span>Recorde do Portal <b>{save.world.portalWaveBest ?? 0} ondas</b></span>
          </div>
        </aside>
      </div>
    </div>
  </GameShell>
}
