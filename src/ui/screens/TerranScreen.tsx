import { BookOpen, CircleUserRound, Gem, GitBranch, MapPin, Package, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TerranLocationDefinition } from '../../content/types'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { getTerranDialogue } from '../../domain/terran/cityDialogue'
import { getVisibleNpcsInLocation } from '../../domain/terran/cityNpcs'
import { getDiscoveredTerranLocationIds, getTerranQuestDestination } from '../../domain/terran/cityEngine'
import { getSkillNodeState } from '../../domain/skillTree/skillTree'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { ClanHallPanel } from '../dashboard/ClanHallPanel'
import { EquipmentCatalog } from '../dashboard/EquipmentCatalog'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { NpcDialog } from '../dashboard/NpcDialog'
import { PortalPanel } from '../dashboard/PortalPanel'
import { SocialQuestDialog } from '../dashboard/SocialQuestDialog'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'
import { PixelCityCanvas } from '../terran/PixelCityCanvas'
import { getCityCast } from '../terran/cityCast'

type Drawer = 'location' | 'nexus' | 'inventory' | 'quests' | 'skills' | null
type Presence = TerranLocationDefinition['npcPresences'][number]

const hud = [
  { id: 'nexus', label: 'Personagem', icon: CircleUserRound },
  { id: 'inventory', label: 'Mochila', icon: Package },
  { id: 'quests', label: 'Missões', icon: BookOpen },
  { id: 'skills', label: 'Evolução', icon: GitBranch },
] as const

function DialogueBox({ save, presence, line, onNext }: { save: GameSave; presence: Presence; line: number; onNext: () => void }) {
  const npc = presence.npcId ? content.npcs[presence.npcId] : null
  const script = getTerranDialogue(save, presence)
  return (
    <div className="terran-dialogue" role="dialog" aria-label={`Conversa com ${presence.label}`}>
      <div className="terran-dialogue__portrait"><AssetImage assetId={npc?.portraitAssetId ?? 'npc.unassigned'} /></div>
      <div className="terran-dialogue__text">
        <span className="eyebrow">DIÁLOGO · {line + 1}/{script.length}</span>
        <strong>{presence.label}</strong>
        <p>{script[line]}</p>
      </div>
      <button type="button" onClick={onNext}>{line < script.length - 1 ? 'Continuar ›' : 'Encerrar ×'}</button>
    </div>
  )
}

function SkillDrawer({ save }: { save: GameSave }) {
  const unlockNode = useGameStore((state) => state.unlockNode)
  const weaponNodes = Object.values(content.skillTreeNodes).filter((node) => node.context === 'weapon')
  const shown = weaponNodes.filter((node) => getSkillNodeState(save, node, content) !== 'hidden')
  return (
    <div className="terran-drawer__section">
      <p>Os Pontos de Essência evoluem o Vínculo, sem depender de trocas de equipamento.</p>
      <div className="terran-points"><Gem size={19} /> {save.essence.essencePoints} ponto(s) disponíveis</div>
      {shown.map((node) => {
        const state = getSkillNodeState(save, node, content)
        return (
          <button className="terran-skill" type="button" key={node.id}
            disabled={state !== 'available'} onClick={() => unlockNode(node.id)}>
            <strong>{node.name}</strong>
            <small>{state === 'unlocked' ? 'Desbloqueado' : state === 'available' ? 'Desbloquear · Ponto de Essência' : 'Bloqueado pela progressão'}</small>
          </button>
        )
      })}
    </div>
  )
}

function QuestDrawer({ save }: { save: GameSave }) {
  const setQuestTracked = useGameStore((state) => state.setQuestTracked)
  const quests = Object.values(save.quests).filter((quest) => ['active', 'ready_to_turn_in', 'completed'].includes(quest.status))
  return (
    <div className="terran-drawer__section">
      <p>Missões são aceitas em diálogo com os NPCs. A cidade continua visível.</p>
      {quests.length === 0 && <div className="terran-drawer__notice">Nenhuma missão no diário. Converse com Eldamar.</div>}
      {quests.map((progress) => {
        const definition = content.quests[progress.questId]
        if (!definition) return null
        return <article className="terran-quest" key={progress.questId}>
          <small>{progress.status.replaceAll('_', ' ').toUpperCase()}</small>
          <strong>{definition.title}</strong>
          <p>{definition.summary}</p>
          {['active', 'ready_to_turn_in'].includes(progress.status) &&
            <button type="button" onClick={() => setQuestTracked(progress.questId, !progress.tracked)}>
              {progress.tracked ? 'Remover marcador' : 'Marcar objetivo'}
            </button>}
        </article>
      })}
    </div>
  )
}

function LocationDrawer({ save, location, onTalk, onVisit }: {
  save: GameSave
  location: TerranLocationDefinition
  onTalk: (presence: Presence) => void
  onVisit: (id: TerranLocationId) => void
}) {
  return (
    <div className="terran-drawer__section">
      <p>{location.description}</p>
      {location.viewKind === 'portal' && <PortalPanel save={save} onGoToEldamar={() => onVisit('location_terran_eldamar_house')} />}
      {location.viewKind === 'workshop' && <><BoundItemsPanel save={save} /><InventoryPanel save={save} /></>}
      {location.viewKind === 'clanHall' && <ClanHallPanel save={save} />}
      <h3>Moradores e representantes</h3>
      <div className="terran-drawer__residents">
        {getVisibleNpcsInLocation(save, location.id as TerranLocationId).map(({ presence }) => (
          <button type="button" key={presence.id} aria-label={`Falar com ${presence.label}`} onClick={() => onTalk(presence)}>
            <span className="terran-npc-avatar">◆</span>
            <span><strong>{presence.label}</strong><small>{presence.roleLabel}</small></span>
            <i>Falar</i>
          </button>
        ))}
      </div>
      {location.services.length > 0 && <><h3>Serviços</h3><div className="terran-drawer__services">
        {location.services.map((service) => <div key={service.id}><strong>{service.name}</strong><small>{service.description}</small></div>)}
      </div></>}
    </div>
  )
}

export function TerranScreen() {
  const save = useGameStore((state) => state.save)
  const travel = useGameStore((state) => state.travelInTerran)
  const recordCutsceneViewed = useGameStore((state) => state.recordCutsceneViewed)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [locationId, setLocationId] = useState<TerranLocationId>('location_terran_portal_plaza')
  const [eldamarOpen, setEldamarOpen] = useState(false)
  const [socialQuestId, setSocialQuestId] = useState<string | null>(null)
  const [dialogue, setDialogue] = useState<Presence | null>(null)
  const [dialogueLine, setDialogueLine] = useState(0)

  if (!save) return <Navigate to="/character/create" replace />

  const scene = getNextCutscene(save)
  const cityCast = getCityCast(save)
  const guidance = getTerranQuestDestination(save, content)
  const discovered = getDiscoveredTerranLocationIds(save).length
  const location = content.terranLocations[locationId]
  const gameEnabled = !scene && !eldamarOpen && !socialQuestId && !dialogue

  const openLocation = (id: TerranLocationId) => {
    travel(id)
    setLocationId(id)
    setDrawer('location')
  }
  const talk = (presence: Presence, sourceId: TerranLocationId = locationId) => {
    travel(sourceId)
    setLocationId(sourceId)
    setDrawer('location')
    if (presence.npcId === 'npc_eldamar') { setEldamarOpen(true); return }
    const quest = Object.values(content.quests).find((candidate) => candidate.giverNpcId === presence.npcId &&
      ['available', 'offered', 'active', 'ready_to_turn_in'].includes(save.quests[candidate.id]?.status ?? 'locked'))
    if (quest && content.terranLocations[sourceId].viewKind === 'clanHall') { setSocialQuestId(quest.id); return }
    setDialogueLine(0)
    setDialogue(presence)
  }
  const currentLabel = content.terranLocations[save.world.currentLocationId]?.name ?? 'Terran'
  const activeTitle = drawer === 'location' ? location.name : drawer === 'nexus' ? 'Personagem e Vínculos'
    : drawer === 'inventory' ? 'Mochila e Arsenal' : drawer === 'quests' ? 'Diário de Missões' : 'Evolução do Vínculo'

  return (
    <GameShell fluid immersive>
      <div className="terran-game">
        <header className="terran-game__topbar">
          <div><span className="eyebrow">HOME · CIDADE-BASE DO JOGADOR</span><h1>Terran</h1></div>
          <div className="terran-game__readout"><MapPin size={16} /> TERRAN &gt; {currentLabel.toUpperCase()}<span>{discovered}/{TERRAN_LOCATION_IDS.length} descobertos</span></div>
        </header>
        <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
          <section className="terran-game__stage" aria-label="Cenário contínuo de Terran">
            <PixelCityCanvas portraitAssetId={save.character.portraitAssetId} reducedMotion={save.settings.reducedMotion}
              currentLocationId={save.world.currentLocationId}
              enabled={gameEnabled} objectiveId={guidance?.locationId ?? null}
              actors={cityCast} onEnter={openLocation} onTalk={(id, presence) => talk(presence, id)} />
            <div className="terran-game__hud" aria-label="Ações do personagem">
              {hud.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={drawer === id ? 'active' : ''}
                  aria-label={`Abrir ${label}`} aria-pressed={drawer === id}
                  onClick={() => setDrawer(drawer === id ? null : id)}>
                  <Icon size={19} /><span>{label}</span>
                </button>
              ))}
            </div>
            <div className="terran-game__quest">
              <Sparkles size={16} />
              <span>{guidance ? `Objetivo: ${content.terranLocations[guidance.locationId].name}` : 'Explore a cidade · converse com Eldamar'}
                <small>WASD / setas para andar · toque ou clique para caminhar · E para interagir</small></span>
            </div>
            {dialogue && <DialogueBox save={save} presence={dialogue} line={dialogueLine} onNext={() => {
              const length = getTerranDialogue(save, dialogue).length
              if (dialogueLine + 1 < length) setDialogueLine(dialogueLine + 1)
              else setDialogue(null)
            }} />}
          </section>
          {drawer && <aside className="terran-game__drawer" aria-label={`Painel lateral: ${activeTitle}`}>
            <header><span className="eyebrow">NEXO · INTERAÇÃO CONTÍNUA</span><h2>{activeTitle}</h2>
              <button type="button" onClick={() => setDrawer(null)} aria-label="Fechar painel"><X size={19} /></button>
            </header>
            <div className="terran-game__drawer-content">
              {drawer === 'location' && <LocationDrawer save={save} location={location} onTalk={talk} onVisit={openLocation} />}
              {drawer === 'inventory' && <><InventoryPanel save={save} /><EquipmentCatalog /></>}
              {drawer === 'nexus' && <><div className="terran-game__identity"><AssetImage assetId={save.character.portraitAssetId} /><span><strong>{save.character.name}</strong><small>Nível {save.character.level} · {save.character.clan.clanId ?? 'Sem Clã'} · {save.character.classProgression.classId ?? 'Sem Classe'}</small></span></div><ProgressBar value={save.character.xp} max={save.character.xpRequired} label="Experiência" /><ProgressBar value={save.essence.current} max={save.essence.required} label="Essência" tone="essence" /><BoundItemsPanel save={save} /></>}
              {drawer === 'quests' && <QuestDrawer save={save} />}
              {drawer === 'skills' && <SkillDrawer save={save} />}
            </div>
          </aside>}
        </div>
        <NpcDialog open={eldamarOpen} onClose={() => setEldamarOpen(false)} save={save} />
        <SocialQuestDialog questId={socialQuestId} save={save} onClose={() => setSocialQuestId(null)} />
        {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId}
          reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
      </div>
    </GameShell>
  )
}
