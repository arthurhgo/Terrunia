import { Backpack, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TerranLocationDefinition } from '../../content/types'
import { type TerranLocationId } from '../../content/terran'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { getTerranDialogue } from '../../domain/terran/cityDialogue'
import { getVisibleNpcsInLocation } from '../../domain/terran/cityNpcs'
import { getTerranQuestDestination } from '../../domain/terran/cityEngine'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ClanHallPanel } from '../dashboard/ClanHallPanel'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { NpcDialog } from '../dashboard/NpcDialog'
import { PortalPanel } from '../dashboard/PortalPanel'
import { DialogueWindow } from '../terran/DialogueWindow'
import { ForgePanel } from '../terran/ForgePanel'
import { getPresencePortrait } from '../../content/npcVisuals'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'
import { PixelCityCanvas } from '../terran/PixelCityCanvas'
import { getVisualEquipment } from '../characters/equipmentVisuals'
import { PixelInteriorCanvas } from '../terran/PixelInteriorCanvas'
import { QuestObjectPuzzle } from '../terran/QuestObjectPuzzle'
import { NpcMissionHub } from '../terran/NpcMissionHub'
import { getNpcSubtitle } from '../terran/NpcNameplate'
import { EldamarRecords } from '../terran/EldamarRecords'
import { RosettaGuide } from '../terran/RosettaGuide'
import { TerranCharacterHud } from '../terran/TerranCharacterHud'
import { TerranQuickJournal } from '../terran/TerranQuickJournal'
import { hasTerranInterior } from '../terran/interiorLayout'
import { getRoomName, PLAYER_HOME_DOOR, PLAYER_HOME_INTERIOR_ID, roomFurniture, type RoomFurniture, type TerranInteriorId } from '../terran/roomContent'
import { streetNpcPlacements } from '../../content/streetNpcs'
import type { WorldPoint } from '../terran/pixelCityArt'
import { getCityCast } from '../terran/cityCast'
import { BaseChest, DaerynServices, HomeDrawer, QuestNpcPanel, VorrenBestiary } from '../terran/TerranServices'
import { MarketNpcPanel } from '../terran/MarketServices'
import { isMarketNpc } from '../../domain/terran/market'
import { BASE_LOCATION_ID, hasPlayerHomeKey, isPlayerHomeDoorOpen } from '../../domain/terran/base'
import { getNpcActionableQuests } from '../../domain/quests/questSelectors'
import { type TerranLandmark } from '../../content/terranExploration'
import { CityLandmarkDialog } from '../terran/CityLandmarkDialog'
import { Modal } from '../components/Modal'
import { getReadyDeliveryQuestRoute, getRosettaQuestRoutes, getTrackedQuestRoute } from '../../domain/terran/rosettaGuide'

type Drawer = 'location' | 'market' | 'home' | 'chest' | 'records' | 'forge' | null
type Presence = TerranLocationDefinition['npcPresences'][number]

function DialogueBox({ save, presence, onClose }: { save: GameSave; presence: Presence; onClose: () => void }) {
  const script = getTerranDialogue(save, presence)
  return <DialogueWindow save={save} title={presence.label} portraitAssetId={getPresencePortrait(presence)}
    lines={[...script]} eyebrow={presence.roleLabel} onClose={onClose} />
}

function LocationDrawer({ save, location, onTalk, onVisit, unified = false }: {
  save: GameSave
  location: TerranLocationDefinition
  onTalk: (presence: Presence) => void
  onVisit: (id: TerranLocationId) => void
  unified?: boolean
}) {
  return (
    <div className="terran-drawer__section">
      <p>{location.description}</p>
      {location.viewKind === 'portal' && <PortalPanel save={save} navigateOnEnter={!unified} onGoToEldamar={() => onVisit('location_terran_eldamar_house')} />}
      {location.viewKind === 'workshop' && <p>O Mercado de Terran distribui os serviços entre os moradores: Valmira e Edran vendem itens; Feril paga Ouro; Lorian transforma drops em Essência; Lithwynn e Talia aplicam melhorias aos Vínculos. Aproxime-se e converse com cada NPC.</p>}
      {location.viewKind === 'clanHall' && <ClanHallPanel save={save} />}
      {location.viewKind === 'daeryn' && <DaerynServices save={save} />}
      {location.viewKind === 'vorren' && <VorrenBestiary save={save} />}
      <h3>Moradores e representantes</h3>
      <div className="terran-drawer__residents">
        {getVisibleNpcsInLocation(save, location.id as TerranLocationId).map(({ presence }) => (
          <button type="button" key={presence.id} aria-label={`Falar com ${presence.label}`} onClick={() => onTalk(presence)}>
            <AssetImage assetId={getPresencePortrait(presence)} className="terran-npc-avatar" />
            <span><strong>{presence.label}</strong><small>{getNpcSubtitle(presence)}</small></span>
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

export function TerranScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const travel = useGameStore((state) => state.travelInTerran)
  const recordCutsceneViewed = useGameStore((state) => state.recordCutsceneViewed)
  const restAtHome = useGameStore((state) => state.restAtHome)
  const enterBase = useGameStore((state) => state.enterBase)
  const unlockBaseWithKey = useGameStore((state) => state.unlockBaseWithKey)
  const leaveBase = useGameStore((state) => state.leaveBase)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const [locationId, setLocationId] = useState<TerranLocationId>('location_terran_portal_plaza')
  const [interiorId, setInteriorId] = useState<TerranInteriorId | null>(
    save?.world.currentLocationId === BASE_LOCATION_ID ? PLAYER_HOME_INTERIOR_ID : null)
  const [waking, setWaking] = useState(() => Boolean(save?.world.currentLocationId === BASE_LOCATION_ID &&
    save.eventLog.at(-1) === 'PlayerRespawnedAtBase'))
  const [streetSpawn, setStreetSpawn] = useState<WorldPoint | null>(null)
  const [inspected, setInspected] = useState<RoomFurniture | null>(null)
  const [eldamarOpen, setEldamarOpen] = useState(false)
  const [rosettaOpen, setRosettaOpen] = useState(false)
  const [rosettaPathsPinned, setRosettaPathsPinned] = useState(false)
  const [backpackOpen, setBackpackOpen] = useState(false)
  const [dialogue, setDialogue] = useState<Presence | null>(null)
  const [localQuestId, setLocalQuestId] = useState<string | null>(null)
  const [marketNpc, setMarketNpc] = useState<Presence | null>(null)
  const [cityLandmark, setCityLandmark] = useState<TerranLandmark | null>(null)
  const [baseDoorPrompt, setBaseDoorPrompt] = useState(false)
  const [activeQuestObjectId, setActiveQuestObjectId] = useState<string | null>(null)
  const [missionNpc, setMissionNpc] = useState<{ presence: Presence; questId: string; sourceId: TerranLocationId } | null>(null)

  useEffect(() => {
    if (drawer) drawerRef.current?.scrollTo?.({ top: 0, behavior: 'auto' })
  }, [drawer, localQuestId])

  useEffect(() => {
    if (!waking) return
    const timer = window.setTimeout(() => setWaking(false), 1900)
    return () => window.clearTimeout(timer)
  }, [waking])

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle) return <Navigate to="/battle" replace />
  if (save.world.currentLocationId === content.dungeons.dungeon_fungal_chambers.id) return <Navigate to="/dungeon" replace />
  if (content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId)) {
    return <Navigate to="/expedition" replace />
  }

  const scene = getNextCutscene(save)
  const cityCast = getCityCast(save)
  const guidance = getTerranQuestDestination(save, content)
  const trackedRoute = getTrackedQuestRoute(save, content) ?? getReadyDeliveryQuestRoute(save, content)
  const location = content.terranLocations[locationId]
  const gameEnabled = !scene && !eldamarOpen && !rosettaOpen && !dialogue && !inspected && !cityLandmark && !baseDoorPrompt && !activeQuestObjectId && !missionNpc && !localQuestId && !['records', 'market', 'forge'].includes(drawer ?? '')

  const openLocation = (id: TerranLocationId) => {
    setStreetSpawn(null)
    setInspected(null)
    setActiveQuestObjectId(null)
    setMissionNpc(null)
    travel(id)
    setLocationId(id)
    setLocalQuestId(null)
    setMarketNpc(null)
    setDialogue(null)
    // The seven institutions have walkable interiors; the Portal remains outdoors.
    if (hasTerranInterior(id)) {
      setInteriorId(id)
      setDrawer(null)
    } else {
      setInteriorId(null)
      setDrawer('location')
    }
  }
  const showHomeInterior = () => {
    setStreetSpawn({ ...PLAYER_HOME_DOOR })
    setInteriorId(PLAYER_HOME_INTERIOR_ID)
    setLocationId('location_terran_portal_plaza')
    setDrawer(null)
    setInspected(null)
  }
  const enterHome = () => {
    if (!isPlayerHomeDoorOpen(save)) { setBaseDoorPrompt(true); return }
    if (enterBase()) showHomeInterior()
  }
  const confirmHomeKey = () => {
    if (!unlockBaseWithKey()) return
    setBaseDoorPrompt(false)
    showHomeInterior()
  }
  const openRoomServices = (id: TerranInteriorId) => {
    setDrawer(id === PLAYER_HOME_INTERIOR_ID ? 'home' : id === 'location_terran_forge' ? 'forge' : 'location')
    setLocalQuestId(null)
  }
  const inspectFurniture = (furniture: RoomFurniture) => {
    if (furniture.behavior === 'quest' && furniture.questId) {
      setActiveQuestObjectId(furniture.questId)
    } else if (furniture.behavior === 'archive' && interiorId === 'location_terran_eldamar_house') {
      setDrawer('records')
    } else if (furniture.behavior === 'storage') {
      setDrawer('chest')
    } else if (furniture.behavior === 'rest') {
      restAtHome()
      setDrawer('home')
    } else if (furniture.behavior === 'services') {
      if (interiorId) openRoomServices(interiorId)
    } else {
      setInspected(furniture)
    }
  }
  const exitInterior = () => {
    if (interiorId === PLAYER_HOME_INTERIOR_ID) leaveBase()
    setInteriorId(null)
    setDrawer(null)
    setDialogue(null)
    setLocalQuestId(null)
    setMarketNpc(null)
    setInspected(null)
    setActiveQuestObjectId(null)
    setMissionNpc(null)
  }
  const talk = (presence: Presence, sourceId: TerranLocationId = locationId) => {
    if (presence.npcId === 'npc_rosetta') {
      travel('location_terran_portal_plaza')
      setLocationId('location_terran_portal_plaza')
      setDialogue(null)
      setMissionNpc(null)
      setDrawer(null)
      setRosettaOpen(true)
      return
    }
    const isStreetNpc = streetNpcPlacements.some((entry) => entry.id === presence.id)
    travel(sourceId)
    setLocationId(sourceId)
    setLocalQuestId(null)
    setDialogue(null)
    setMarketNpc(null)
    setMissionNpc(null)
    // The first face of a conversation with an actionable quest is that quest.
    // Eldamar discovery remains authoritative and is performed before re-reading offers.
    if (presence.npcId === 'npc_eldamar' && !save.relationships.npc_eldamar.discovered) {
      useGameStore.getState().discoverEldamar()
    }
    const currentSave = useGameStore.getState().save ?? save
    const quest = presence.npcId ? getNpcActionableQuests(currentSave, presence.npcId, content)[0] : undefined
    if (quest) {
      setDrawer(null)
      setMissionNpc({ presence, questId: quest.id, sourceId })
      return
    }
    if (sourceId === 'location_terran_forge') {
      if (interiorId === sourceId) setDrawer('forge')
      else openLocation(sourceId)
      return
    }
    if (sourceId === 'location_terran_bond_workshop' && interiorId === sourceId && isMarketNpc(presence.id)) {
      setMarketNpc(presence)
      setDrawer('market')
      return
    }
    if (presence.npcId === 'npc_eldamar') {
      setEldamarOpen(true)
      return
    }
    if (isStreetNpc) setDrawer(null)
    else setDrawer('location')
    setDialogue(presence)
  }
  const forgeQuest = getNpcActionableQuests(save, 'npc_durnan', content)[0]
  const activeTitle = drawer === 'forge' ? 'Casa do Ferreiro' : drawer === 'location' ? (
    localQuestId && content.quests[localQuestId]?.giverNpcId.startsWith('npc_street_') ? 'Missão nas ruas de Terran' : location.name
  ) : drawer === 'market' ? `Mercado · ${marketNpc?.label ?? 'Serviços'}` : drawer === 'home' ? 'Minha Base' : drawer === 'records' ? 'Estante dos Registros' : 'Baú Pessoal'

  const sceneContent = (
    <div className="terran-game">
        <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
          <div className="terran-game__frame" data-testid="terran-centered-gameplay">
          <aside className="terran-game__fixed-left" aria-label="Diário de missões">
            <TerranQuickJournal save={save} />
          </aside>
          <section className="terran-game__stage" aria-label="Cenário contínuo de Terran">
            <button type="button" className="terran-game__backpack-toggle" aria-label={backpackOpen ? 'Recolher mochila' : 'Mochila'}
              title={backpackOpen ? 'Recolher mochila' : 'Abrir mochila'} aria-expanded={backpackOpen}
              aria-controls="terran-backpack-panel" onClick={() => setBackpackOpen((open) => !open)}>
              <Backpack size={23} strokeWidth={1.7} aria-hidden="true" />
            </button>
            {backpackOpen && <aside id="terran-backpack-panel" className="terran-game__backpack-panel" aria-label="Mochila expandida">
              <InventoryPanel save={save} compact />
            </aside>}
            {interiorId ? <PixelInteriorCanvas key={interiorId} save={save} locationId={interiorId} enabled={gameEnabled}
                questRoutes={getRosettaQuestRoutes(save, content)} showQuestRoutes={rosettaPathsPinned}
                showTrackedQuestRoute={Boolean(trackedRoute)} trackedQuestRoute={trackedRoute}
                onTalk={(presence) => { if (interiorId !== PLAYER_HOME_INTERIOR_ID) talk(presence, interiorId) }}
                onServices={() => {
                  if (interiorId === PLAYER_HOME_INTERIOR_ID) {
                    const bed = roomFurniture[PLAYER_HOME_INTERIOR_ID].find((furniture) => furniture.id === 'home_bed')
                    if (bed) inspectFurniture(bed)
                  } else openRoomServices(interiorId)
                }}
                onFurniture={inspectFurniture}
                onExit={exitInterior} />
              : <PixelCityCanvas portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save)} guideHasOffers={getNpcActionableQuests(save, 'npc_rosetta', content).some((quest) => ['available', 'offered'].includes(save.quests[quest.id]?.status ?? 'locked'))} reducedMotion={save.settings.reducedMotion}
                  currentLocationId={save.world.currentLocationId} spawnPoint={streetSpawn}
                  homeUnlocked={isPlayerHomeDoorOpen(save)} onEnterHome={enterHome}
                  enabled={gameEnabled} objectiveId={guidance?.locationId ?? null}
                  actors={cityCast} onEnter={openLocation} onTalk={(id, presence) => talk(presence, id)}
                  questRoutes={getRosettaQuestRoutes(save, content)} showQuestRoutes={rosettaPathsPinned}
                  showTrackedQuestRoute={Boolean(trackedRoute)} trackedQuestRoute={trackedRoute}
                  onHideQuestRoutes={() => setRosettaPathsPinned(false)}
                  landmarkFlags={save.world.worldFlags} onInspectLandmark={(landmark) => {
                    useGameStore.getState().inspectCityLandmark(landmark.id)
                    setCityLandmark(landmark)
                  }} />}
            {cityLandmark && <CityLandmarkDialog landmark={cityLandmark} save={save} onClose={() => setCityLandmark(null)} />}
            <Modal open={baseDoorPrompt} title="Porta da Base do Terrírian" eyebrow="TERRAN · ACESSO À CASA"
              className="terran-base-key-modal" onClose={() => setBaseDoorPrompt(false)}
              footer={hasPlayerHomeKey(save)
                ? <div className="terran-base-key-modal__actions">
                    <button type="button" onClick={() => setBaseDoorPrompt(false)}>Agora não</button>
                    <button type="button" onClick={confirmHomeKey}>Usar chave na porta</button>
                  </div>
                : <button type="button" className="terran-service-action" onClick={() => setBaseDoorPrompt(false)}>Voltar à cidade</button>}>
              {hasPlayerHomeKey(save)
                ? <p>Você possui a <strong>Chave de Daeryn</strong> na mochila. Usá-la destranca esta porta permanentemente e consome a chave.</p>
                : <p>A porta está trancada. Conclua a missão <strong>Um Lugar em Terran</strong> com Daeryn para receber a chave e usá-la aqui.</p>}
            </Modal>
            {waking && interiorId === PLAYER_HOME_INTERIOR_ID && <div className="terran-base__waking" role="status">Você acorda na Base. Descanse para recuperar Vida e Mana.</div>}
            {inspected && <div className="pixel-interior__inspection" role="dialog" aria-label={`Inspecionar ${inspected.name}`}>
              <strong>{inspected.name}</strong><p>{inspected.description}</p>
              <button type="button" onClick={() => setInspected(null)}>Continuar explorando</button>
            </div>}
            {rosettaOpen && <RosettaGuide save={save} onClose={() => setRosettaOpen(false)}
              onOpenInventory={() => { setRosettaOpen(false); setDrawer(null); setBackpackOpen(true) }}
              onShowPaths={() => { setRosettaOpen(false); setDrawer(null); setRosettaPathsPinned(true) }}
              onOpenQuests={() => { setRosettaOpen(false); setDrawer(null) }} />}
            {dialogue && <DialogueBox save={save} presence={dialogue} onClose={() => setDialogue(null)} />}
            {missionNpc && <NpcMissionHub save={save} presence={missionNpc.presence}
              initialQuestId={missionNpc.questId}
              onClose={() => setMissionNpc(null)}
              onServices={missionNpc.sourceId === 'location_terran_forge' ||
                (missionNpc.sourceId === 'location_terran_bond_workshop' && isMarketNpc(missionNpc.presence.id))
                ? () => {
                    const from = missionNpc
                    setMissionNpc(null)
                    if (from.sourceId === 'location_terran_forge') setDrawer('forge')
                    else { setMarketNpc(from.presence); setDrawer('market') }
                  } : undefined} />}
            {activeQuestObjectId && <QuestObjectPuzzle key={activeQuestObjectId} save={save}
              questId={activeQuestObjectId} onClose={() => setActiveQuestObjectId(null)} />}
          </section>
          <TerranCharacterHud save={save} />
          {drawer && <aside ref={drawerRef} className={`terran-game__drawer ${eldamarOpen || localQuestId || dialogue || drawer === 'market' || drawer === 'forge' ? 'terran-game__drawer--dialogue' : ''}`} aria-label={`Painel lateral: ${activeTitle}`}>
            <header><span className="eyebrow">NEXO · INTERAÇÃO CONTÍNUA</span><h2>{activeTitle}</h2>
              <button type="button" onClick={() => { setDrawer(null); setLocalQuestId(null) }} aria-label="Fechar painel"><X size={19} /></button>
            </header>
            <div className="terran-game__drawer-content">
              {drawer === 'forge' && <ForgePanel save={save} onClose={() => setDrawer(null)}
                onQuest={forgeQuest ? () => { setLocalQuestId(forgeQuest.id); setDrawer('location') } : undefined} />}
              {drawer === 'location' && (localQuestId
                ? <QuestNpcPanel save={save} questId={localQuestId} onSelectQuest={setLocalQuestId} onClose={() => {
                  if (content.quests[localQuestId]?.giverNpcId.startsWith('npc_street_')) setDrawer(null)
                  setLocalQuestId(null)
                }} />
                : <LocationDrawer save={save} location={location} onTalk={talk} onVisit={openLocation} unified={unified} />)}
              {drawer === 'market' && marketNpc && interiorId === 'location_terran_bond_workshop' && <MarketNpcPanel
                save={save} presence={marketNpc} onClose={() => { setMarketNpc(null); setDrawer('location') }}
                onQuest={marketNpc.npcId && Object.values(content.quests).some((quest) => quest.giverNpcId === marketNpc.npcId && ['available', 'offered', 'active', 'ready_to_turn_in'].includes(save.quests[quest.id]?.status ?? 'locked'))
                  ? () => {
                    const quest = getNpcActionableQuests(save, marketNpc.npcId!, content)[0]
                    if (quest) { setLocalQuestId(quest.id); setMarketNpc(null); setDrawer('location') }
                  } : undefined} />}
              {drawer === 'records' && interiorId === 'location_terran_eldamar_house' && <EldamarRecords save={save} />}
              {drawer === 'home' && <HomeDrawer save={save} canRest={interiorId === PLAYER_HOME_INTERIOR_ID} />}
              {drawer === 'chest' && <BaseChest save={save} />}
            </div>
          </aside>}
          </div>
        </div>
        <NpcDialog open={eldamarOpen} onClose={() => setEldamarOpen(false)} save={save} />
        {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save)}
          reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>
  )

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function TerranScreen() {
  return <TerranScene />
}
