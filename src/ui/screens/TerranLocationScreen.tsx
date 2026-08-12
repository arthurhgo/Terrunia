import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleDot,
  Crosshair,
  FlaskConical,
  GitBranch,
  LockKeyhole,
  Map,
  MapPinned,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TerranLocationDefinition } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getNpcQuestMarker } from '../../domain/quests/questSelectors'
import { isTerranLocationId } from '../../domain/terran/cityEngine'
import { useGameStore } from '../../state/gameStore'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { NpcDialog } from '../dashboard/NpcDialog'
import { PortalPanel } from '../dashboard/PortalPanel'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { TerranIcon } from '../terran/TerranIcon'
import { TerranMinimap } from '../terran/TerranMinimap'

const presenceLabels = {
  resident: 'Presente',
  conditional: 'Condicional',
  visitor: 'Visitante',
  progressive: 'Progressivo',
  institution: 'Representação',
}

function ServiceBoard({ location }: { location: TerranLocationDefinition }) {
  return (
    <ArcanePanel title="Serviços" eyebrow="FUNÇÃO INSTITUCIONAL" className="terran-service-board">
      <div className="terran-service-list">
        {location.services.map((service) => (
          <article key={service.id} className={`service-card service-card--${service.state}`}>
            {service.state === 'available' ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}
            <span><strong>{service.name}</strong><small>{service.description}</small></span>
            {service.route && <Link to={service.route} aria-label={`Abrir ${service.name}`}><ArrowRight size={15} /></Link>}
          </article>
        ))}
      </div>
    </ArcanePanel>
  )
}

function NpcRoster({ location, save }: { location: TerranLocationDefinition; save: GameSave }) {
  return (
    <ArcanePanel title="Pessoas neste local" eyebrow="DISTRIBUIÇÃO OFICIAL" className="terran-npc-roster">
      <div className="terran-presence-list">
        {location.npcPresences.map((presence) => (
          <article key={presence.id} className={`presence-card presence-card--${presence.presence}`}>
            <span className="presence-card__portrait"><UsersRound size={18} />{presence.npcId && getNpcQuestMarker(save, presence.npcId, content) ? <b className={`npc-quest-marker npc-quest-marker--${getNpcQuestMarker(save, presence.npcId, content)}`}>{getNpcQuestMarker(save, presence.npcId, content) === 'turnIn' ? '✓' : '!'}</b> : null}</span>
            <span><strong>{presence.label}</strong><small>{presence.roleLabel}</small></span>
            <i>{presenceLabels[presence.presence]}</i>
          </article>
        ))}
      </div>
    </ArcanePanel>
  )
}

function EldamarFeature({ save, onTalk }: { save: GameSave; onTalk: () => void }) {
  const progress = save.quests.vs_astravel_first_contact
  const quest = content.quests.vs_astravel_first_contact
  return (
    <ArcanePanel title="Mesa de investigação" eyebrow="REGISTROS ATIVOS" className="location-feature location-feature--eldamar">
      <div className="institution-hero institution-hero--knowledge">
        <BookOpenCheck size={34} />
        <div><p className="eyebrow">{progress.status}</p><h3>{quest.title}</h3><p>{quest.summary}</p></div>
      </div>
      <div className="mission-circulation">
        <span className={['active', 'ready_to_turn_in', 'completed'].includes(progress.status) ? 'done' : 'current'}><i>1</i>Eldamar<strong>Origem e autorização</strong></span>
        <ArrowRight size={16} />
        <span className={progress.status === 'active' ? 'current' : ''}><i>2</i>Praça do Portal<strong>Despacho da instância</strong></span>
        <ArrowRight size={16} />
        <span><i>3</i>Astravél<strong>Objetivo externo</strong></span>
      </div>
      <GameButton variant="primary" onClick={onTalk}>
        <ScrollText size={17} /> {['available', 'offered'].includes(progress.status) ? 'Ver oferta de Eldamar' : progress.status === 'ready_to_turn_in' ? 'Entregar missão' : 'Consultar Eldamar'}
      </GameButton>
    </ArcanePanel>
  )
}

function VorrenFeature({ save, goToPortal }: { save: GameSave; goToPortal: () => void }) {
  const trail = content.trails.trail_astravel_entry
  const completedNodes = trail.nodes.filter((node) => save.world.trailNodeStates[node.id] === 'completed').length
  const knownEnemyIds = new Set(
    save.world.completedEncounterIds.flatMap((encounterId) => content.encounters[encounterId]?.enemyDefinitionIds ?? []),
  )
  return (
    <ArcanePanel title="Mesa de campo" eyebrow="BESTIÁRIO E CARTOGRAFIA" className="location-feature location-feature--vorren">
      <div className="field-metrics">
        <div><Crosshair size={20} /><span>Criaturas registradas<strong>{knownEnemyIds.size}</strong></span></div>
        <div><Map size={20} /><span>Nós reconhecidos<strong>{completedNodes}/{trail.nodes.length}</strong></span></div>
        <div><CircleDot size={20} /><span>Região ativa<strong>Astravél</strong></span></div>
      </div>
      <div className="bestiary-strip">
        {Object.values(content.enemies).map((enemy) => (
          <article key={enemy.id} className={knownEnemyIds.has(enemy.id) ? 'known' : 'unknown'}>
            <AssetImage assetId={enemy.assetId} />
            <span><strong>{knownEnemyIds.has(enemy.id) ? enemy.name : 'Registro oculto'}</strong><small>{knownEnemyIds.has(enemy.id) ? `Nv. ${enemy.level} · ${enemy.weaknessTags.join(', ')}` : 'Encontre a criatura em uma expedição.'}</small></span>
          </article>
        ))}
      </div>
      <GameButton variant="secondary" onClick={goToPortal}><MapPinned size={17} /> Ir à Praça para partir</GameButton>
    </ArcanePanel>
  )
}

function WorkshopFeature({ save }: { save: GameSave }) {
  return (
    <div className="workshop-feature">
      <BoundItemsPanel save={save} />
      <InventoryPanel save={save} />
      <div className="economy-strip">
        <span><i className="essence-gem" /> Essência <strong>{save.essence.current}</strong></span>
        <span><i className="essence-gem" /> Pontos <strong>{save.essence.essencePoints}</strong></span>
        <span><i className="gold-coin" /> Ouro <strong>{save.wallet.gold.toLocaleString('pt-BR')}</strong></span>
      </div>
    </div>
  )
}

function ZarethFeature({ save }: { save: GameSave }) {
  const bossDefeated = save.world.worldFlags.includes('colossus_mycelium_defeated')
  const thresholdFound = save.world.worldFlags.includes('fungal_chambers_threshold_discovered')
  return (
    <ArcanePanel title="Quadro de defesa" eyebrow="AMEAÇAS E PATRULHAS" className="location-feature location-feature--zareth">
      <div className="defense-status">
        <ShieldCheck size={42} />
        <div><span>ESTADO DE TERRAN</span><strong>{bossDefeated ? 'Ameaça Fungorra contida' : thresholdFound ? 'Alerta nas Câmaras Fúngicas' : 'Vigilância ativa'}</strong></div>
      </div>
      <div className="threat-board">
        <article className={thresholdFound ? 'known' : ''}><span>Fungorros</span><strong>{thresholdFound ? 'LOCALIZADOS' : 'EM INVESTIGAÇÃO'}</strong></article>
        <article className={bossDefeated ? 'resolved' : ''}><span>Colosso Micélio</span><strong>{bossDefeated ? 'DERROTADO' : 'AMEAÇA NÃO RESOLVIDA'}</strong></article>
        <article><span>Bounties</span><strong>CONTEÚDO PROGRESSIVO</strong></article>
      </div>
      <Link className="panel-link" to="/quests">Abrir quadro de missões <ArrowRight size={16} /></Link>
    </ArcanePanel>
  )
}

function ClanHallFeature({ save, location }: { save: GameSave; location: TerranLocationDefinition }) {
  const representatives = location.npcPresences.filter((presence) => presence.presence === 'institution')
  return (
    <ArcanePanel title="Câmara de filiação" eyebrow="CLÃ · CLASSE · MAIN LORE" className="location-feature location-feature--clan">
      <div className="clan-state-banner">
        <UsersRound size={34} />
        <span>ESTADO DO PERSONAGEM<strong>{save.character.clan.clanId ? `Clã ${save.character.clan.clanId} · Rank ${save.character.clan.rank}` : 'Terrírian sem filiação'}</strong><small>Classe: {save.character.classProgression.classId ?? 'ainda não desenvolvida'}</small></span>
      </div>
      <div className="clan-representatives">
        {representatives.map((presence) => (
          <article key={presence.id}><Sparkles size={17} /><strong>{presence.label}</strong><small>Conhecer → ajudar → provar → filiar-se</small></article>
        ))}
      </div>
      <div className="clan-actions">
        <Link className="panel-link" to="/npcs">Ver relações <ArrowRight size={16} /></Link>
        <Link className="panel-link" to="/skill-tree">Abrir progressão <GitBranch size={16} /></Link>
      </div>
    </ArcanePanel>
  )
}

function DaerynFeature({ save }: { save: GameSave }) {
  const consumables = save.inventory.filter((instance) => content.items[instance.definitionId]?.category === 'consumable')
  return (
    <ArcanePanel title="Mesa de preparação" eyebrow="CURA E ALQUIMIA" className="location-feature location-feature--daeryn">
      <div className="preparation-score">
        <FlaskConical size={38} />
        <span>PREPARO ATUAL<strong>{consumables.length > 0 ? 'Com suprimentos' : 'Sem consumíveis'}</strong><small>{consumables.reduce((total, item) => total + item.quantity, 0)} unidade(s) pronta(s)</small></span>
      </div>
      <div className="preparation-inventory">
        {consumables.length > 0 ? consumables.map((instance) => {
          const item = content.items[instance.definitionId]
          return <article key={instance.instanceId}><AssetImage assetId={item.iconAssetId} /><span><strong>{item.name}</strong><small>{item.description}</small></span><b>×{instance.quantity}</b></article>
        }) : <div className="preparation-empty"><FlaskConical size={25} /><span>Nenhum preparo carregado.<small>Alquimia, antídotos e resistências avançam por conteúdo aprovado.</small></span></div>}
      </div>
      <p className="owner-decision-note"><strong>Serviços progressivos:</strong> receitas, antídotos e resistências serão liberados por missões e conhecimento alquímico.</p>
    </ArcanePanel>
  )
}

function PortalFeature({ save, goToEldamar }: { save: GameSave; goToEldamar: () => void }) {
  const questActive = save.quests.vs_astravel_first_contact?.status === 'active'
  const routeAuthorized = save.world.trailNodeStates.astravel_entry === 'current' || save.world.unlockedLocationIds.includes('astravel_entry')
  return (
    <div className="portal-location-feature">
      <ArcanePanel title="Guardião do Portal" eyebrow="VALIDAÇÃO E REGISTRO" className="portal-guardian-panel">
        <div className="guardian-identity"><Sparkles size={38} /><span>GUARDIÃO DO PORTAL<strong>Ofício da Praça Central</strong><small>Validação · despacho · registro de retorno</small></span></div>
        <div className="guardian-checks">
          <div className={questActive ? 'met' : 'unmet'}>{questActive ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}<span>Missão ativa<strong>{questActive ? 'VALIDADA' : 'PROCURE A INSTITUIÇÃO RESPONSÁVEL'}</strong></span></div>
          <div className={routeAuthorized ? 'met' : 'unmet'}>{routeAuthorized ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}<span>Rota reconhecida<strong>{routeAuthorized ? 'ASTRAVÉL DISPONÍVEL' : 'SEM AUTORIZAÇÃO'}</strong></span></div>
        </div>
      </ArcanePanel>
      <PortalPanel save={save} onGoToEldamar={goToEldamar} />
    </div>
  )
}

function LocationFeature({ location, save, onTalk, goTo }: { location: TerranLocationDefinition; save: GameSave; onTalk: () => void; goTo: (locationId: string) => void }): ReactNode {
  switch (location.viewKind) {
    case 'eldamar': return <EldamarFeature save={save} onTalk={onTalk} />
    case 'vorren': return <VorrenFeature save={save} goToPortal={() => goTo('location_terran_portal_plaza')} />
    case 'workshop': return <WorkshopFeature save={save} />
    case 'zareth': return <ZarethFeature save={save} />
    case 'clanHall': return <ClanHallFeature save={save} location={location} />
    case 'daeryn': return <DaerynFeature save={save} />
    case 'portal': return <PortalFeature save={save} goToEldamar={() => goTo('location_terran_eldamar_house')} />
  }
}

export function TerranLocationScreen() {
  const { locationId = '' } = useParams()
  const save = useGameStore((state) => state.save)
  const travel = useGameStore((state) => state.travelInTerran)
  const navigate = useNavigate()
  const [npcOpen, setNpcOpen] = useState(false)
  const location = content.terranLocations[locationId]
  const currentLocationId = save?.world.currentLocationId
  const resolvedLocationId = location?.id
  const hasSave = Boolean(save)

  useEffect(() => {
    if (hasSave && resolvedLocationId && currentLocationId !== resolvedLocationId) {
      travel(resolvedLocationId)
    }
  }, [currentLocationId, hasSave, resolvedLocationId, travel])

  if (!save) return <Navigate to="/character/create" replace />
  if (!location || !isTerranLocationId(locationId)) return <Navigate to="/terran" replace />

  const goTo = (targetId: string) => {
    travel(targetId)
    navigate(`/terran/${targetId}`)
  }

  return (
    <GameShell fluid>
      <div className={`terran-location terran-location--${location.tone}`}>
        <header className="terran-location__heading">
          <Link to="/terran" className="back-to-city"><ArrowLeft size={16} /> Mapa de Terran</Link>
          <div className="terran-location__identity">
            <span className="location-seal"><TerranIcon iconId={location.iconId} size={34} /></span>
            <div><p className="eyebrow">{location.verb} · {location.role}</p><h1>{location.name}</h1><p>{location.description}</p></div>
          </div>
          <div className="location-readout"><MapPinned size={18} /><span>VOCÊ ESTÁ EM<strong>TERRAN &gt; {location.name.toUpperCase()}</strong></span></div>
        </header>

        <div className="terran-location__layout">
          <main className="terran-location__main">
            <LocationFeature location={location} save={save} onTalk={() => setNpcOpen(true)} goTo={goTo} />
            {location.viewKind !== 'workshop' && <ServiceBoard location={location} />}
          </main>
          <aside className="terran-location__sidebar">
            <ArcanePanel title="Minimapa" eyebrow="LOCALIZAÇÃO PERSISTENTE" className="terran-compact-map-panel">
              <TerranMinimap save={save} compact />
              <Link className="panel-link" to="/terran">Abrir mapa completo <ArrowRight size={15} /></Link>
            </ArcanePanel>
            <NpcRoster location={location} save={save} />
          </aside>
        </div>
      </div>
      <NpcDialog open={npcOpen} onClose={() => setNpcOpen(false)} save={save} />
    </GameShell>
  )
}
