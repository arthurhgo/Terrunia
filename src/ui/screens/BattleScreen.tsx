import { useEffect, useMemo, useState } from 'react'
import {
  Backpack, BookOpen, Check, CircleDot, Crosshair, Footprints, Gem,
  MousePointerClick, ScrollText, Shield, Sparkles, Swords, UserRound, X,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { ItemDefinition } from '../../content/types'
import type { BattleCommand, BattleLogEntry, Combatant } from '../../domain/combat/types'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import type { InventoryItemInstance } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { CombatPlayerSprite } from '../combat/CombatPlayerSprite'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

type ActionFamily = 'attack' | 'magic' | 'throwable' | 'rune' | 'essence' | 'equipment'

const actionFamilies = [
  { id: 'attack', label: 'Ataque', icon: Swords },
  { id: 'magic', label: 'Magias', icon: Sparkles },
  { id: 'throwable', label: 'Arremessáveis', icon: CircleDot },
  { id: 'rune', label: 'Runas', icon: BookOpen },
  { id: 'essence', label: 'Essências', icon: Gem },
  { id: 'equipment', label: 'Equipamentos', icon: Backpack },
] satisfies Array<{ id: ActionFamily; label: string; icon: typeof Swords }>

const statusName = (definitionId: string) =>
  content.statusEffects[definitionId]?.name ?? definitionId

function StatusList({ combatant }: { combatant: Combatant }) {
  if (combatant.statusEffects.length === 0) return <span className="status-empty">Sem efeitos</span>
  return (
    <div className="battle-status-list" aria-label={`Efeitos de ${combatant.name}`}>
      {combatant.statusEffects.map((status) => (
        <span key={status.definitionId} title={content.statusEffects[status.definitionId]?.description}>
          {statusName(status.definitionId)} · {status.remainingTurns}T
        </span>
      ))}
    </div>
  )
}

function CombatItemButton({ instance, definition, disabled, onUse }: {
  instance: InventoryItemInstance
  definition: ItemDefinition
  disabled: boolean
  onUse: () => void
}) {
  return (
    <button type="button" className="battle-option" onClick={onUse} disabled={disabled} title={definition.description}>
      <AssetImage assetId={definition.iconAssetId} />
      <span><strong>{definition.name}</strong><small>{definition.combatTarget === 'enemy' ? 'Alvo inimigo' : 'Usar no Terrírian'} · ×{instance.quantity}</small></span>
    </button>
  )
}

export function BattleScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const submit = useGameStore((state) => state.submitBattleCommand)
  const claim = useGameStore((state) => state.claimBattleRewards)
  const finishBattleIntoExpedition = useGameStore((state) => state.finishBattleIntoExpedition)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const navigate = useNavigate()

  const battle = save?.battle
  const enemies = useMemo(
    () => battle ? Object.values(battle.combatants).filter((combatant) => combatant.side === 'enemy') : [],
    [battle],
  )
  const firstLivingEnemyId = enemies.find((enemy) => enemy.alive)?.id ?? ''
  const [selectedTargetId, setSelectedTargetId] = useState(firstLivingEnemyId)
  const [drawer, setDrawer] = useState<'status' | 'log' | null>(null)
  const [actionFamily, setActionFamily] = useState<ActionFamily>('attack')
  const [presentationEntries, setPresentationEntries] = useState<BattleLogEntry[]>([])
  const [presentationIndex, setPresentationIndex] = useState(0)
  const [collectedDrops, setCollectedDrops] = useState<string[]>([])
  const activePresentation = presentationEntries[presentationIndex]
  const presentationBusy = Boolean(activePresentation)

  useEffect(() => {
    const selected = enemies.find((enemy) => enemy.id === selectedTargetId)
    if (!selected?.alive && firstLivingEnemyId) setSelectedTargetId(firstLivingEnemyId)
  }, [enemies, firstLivingEnemyId, selectedTargetId])

  useEffect(() => {
    setCollectedDrops([])
    setPresentationEntries([])
    setPresentationIndex(0)
  }, [battle?.id])

  useEffect(() => {
    if (!activePresentation) {
      if (presentationEntries.length > 0) {
        setPresentationEntries([])
        setPresentationIndex(0)
      }
      return
    }
    const duration = activePresentation.event?.type === 'turnStarted'
      ? 680
      : activePresentation.event?.type === 'damage' ? 560 : 440
    const timer = window.setTimeout(() => setPresentationIndex((current) => current + 1), duration)
    return () => window.clearTimeout(timer)
  }, [activePresentation, presentationEntries.length])

  if (!save) return <Navigate to="/terran" replace />
  if (!save.battle) {
    const destination = save.world.currentLocationId === FUNGAL_DUNGEON_ID
      ? '/dungeon'
      : content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId) ? '/expedition' : '/terran'
    return <Navigate to={destination} replace />
  }

  const activeBattle = save.battle
  const player = Object.values(activeBattle.combatants).find((combatant) => combatant.side === 'player')
  if (!player || enemies.length === 0) return <Navigate to="/terran" replace />

  const selectedEnemy = enemies.find((enemy) => enemy.id === selectedTargetId) ?? enemies[0]
  const encounter = content.encounters[activeBattle.encounterId]
  const activeWeapon = save.boundItems[save.character.bondedEquipment.weapon ?? '']
  const playerSkills = player.skillIds.map((skillId) => content.combatSkills[skillId]).filter((skill) => Boolean(skill))
  const itemsByKind = (kind: Exclude<ActionFamily, 'attack' | 'magic'>) => save.inventory.flatMap((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.combatKind === kind && definition.combatEffects.length > 0 ? [{ instance, definition }] : []
  })
  const hitTargetId = activePresentation?.event?.type === 'damage' ? activePresentation.event.targetId : ''
  const healedTargetId = activePresentation?.event?.type === 'heal' ? activePresentation.event.targetId : ''
  const turnLabel = activePresentation?.event?.type === 'turnStarted'
    ? activePresentation.event.side === 'player' ? 'SEU TURNO' : 'TURNO DOS INIMIGOS'
    : activePresentation?.message

  const leave = () => {
    returnToTerran()
    if (!unified) navigate('/terran')
  }
  const continueExpedition = () => {
    finishBattleIntoExpedition()
    if (!unified) navigate(save.world.currentLocationId === FUNGAL_DUNGEON_ID ? '/dungeon' : '/expedition')
  }
  const executeCommand = (command: BattleCommand) => {
    if (presentationBusy || activeBattle.phase !== 'AwaitingAction') return
    const previousLogLength = activeBattle.log.length
    submit(command)
    const nextBattle = useGameStore.getState().save?.battle
    if (!nextBattle || save.settings.reducedMotion) return
    const entries = nextBattle.log.slice(previousLogLength).filter((entry) => Boolean(entry.event))
    if (entries.length > 0) {
      setPresentationEntries(entries)
      setPresentationIndex(0)
    }
  }
  const attack = () => {
    if (selectedEnemy?.alive) executeCommand({ type: 'attack', targetId: selectedEnemy.id })
  }
  const handleSkill = (skillId: string) => {
    const skill = content.combatSkills[skillId]
    const targetId = skill?.target === 'self' ? player.id : selectedEnemy?.id
    if (skill && targetId && (skill.target === 'self' || selectedEnemy?.alive)) {
      executeCommand({ type: 'skill', skillId: skill.id, targetId })
    }
  }
  const handleItem = (instance: InventoryItemInstance, definition: ItemDefinition) => {
    const targetId = definition.combatTarget === 'enemy' ? selectedEnemy?.id : player.id
    if (targetId) executeCommand({ type: 'item', itemInstanceId: instance.instanceId, targetId })
  }

  const familyItems = actionFamily === 'attack' || actionFamily === 'magic' ? [] : itemsByKind(actionFamily)
  const rewardDrops = activeBattle.rewards.lootDefinitionIds.map((definitionId, index) => ({
    key: `${definitionId}_${index}`,
    definition: content.items[definitionId],
  }))
  const allDropsCollected = rewardDrops.every((drop) => collectedDrops.includes(drop.key))

  const renderActionOptions = () => {
    if (actionFamily === 'attack') {
      return <>
        <button type="button" className="battle-option battle-option--primary" onClick={attack} disabled={!selectedEnemy?.alive}>
          <Swords size={22} /><span><strong>Atacar</strong><small>Golpe básico com a arma vinculada</small></span>
        </button>
        <button type="button" className="battle-option" onClick={() => executeCommand({ type: 'defend' })}>
          <Shield size={22} /><span><strong>Defender</strong><small>Reduz o próximo dano recebido</small></span>
        </button>
        <button type="button" className="battle-option" onClick={() => executeCommand({ type: 'flee' })} disabled={!activeBattle.canFlee}>
          <Footprints size={22} /><span><strong>Fugir</strong><small>{activeBattle.canFlee ? 'Tentar deixar o encontro' : 'Bloqueado neste encontro'}</small></span>
        </button>
      </>
    }
    if (actionFamily === 'magic') {
      if (playerSkills.length === 0) return <p className="battle-options-empty">Nenhuma magia ou técnica foi liberada pela arma e pela árvore atual.</p>
      return playerSkills.map((skill) => (
        <button key={skill.id} type="button" className="battle-option" onClick={() => handleSkill(skill.id)}
          disabled={player.mp < skill.mpCost || (skill.target === 'enemy' && !selectedEnemy?.alive)} title={skill.description}>
          <Sparkles size={22} /><span><strong>{skill.name}</strong><small>{skill.mpCost} MP · {skill.target === 'self' ? 'Terrírian' : 'Alvo inimigo'}</small></span>
        </button>
      ))
    }
    if (familyItems.length === 0) {
      const familyName = actionFamilies.find((family) => family.id === actionFamily)?.label
      return <p className="battle-options-empty">Sem {familyName?.toLowerCase()} disponíveis. Encontre suprimentos e drops durante a instância.</p>
    }
    return familyItems.map(({ instance, definition }) => (
      <CombatItemButton key={instance.instanceId} instance={instance} definition={definition}
        disabled={definition.combatTarget === 'enemy' ? !selectedEnemy?.alive : player.hp <= 0}
        onUse={() => handleItem(instance, definition)} />
    ))
  }

  const sceneContent = (
    <div className="terran-game battle-game battle-game--turn-based">
      <header className="terran-game__topbar battle-game__topbar">
        <div><span className="eyebrow">ENCONTRO · COMBATE POR TURNOS</span><h1>{encounter?.name ?? 'Combate'}</h1></div>
        <div className="terran-game__readout"><Crosshair size={16} /> {encounter?.locationLabel ?? 'ASTRAVÉL'}<span>Rodada {activeBattle.round}</span></div>
      </header>

      <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage battle-game__stage battle-game__stage--arena" aria-label="Viewport unificada de combate">
          <div className={`pixel-battle-arena ${save.world.currentLocationId === FUNGAL_DUNGEON_ID ? 'pixel-battle-arena--dungeon' : ''}`}>
            <div className="pixel-battle-arena__sky" aria-hidden="true" />
            <div className="pixel-battle-arena__hills" aria-hidden="true" />
            <div className="pixel-battle-arena__treeline" aria-hidden="true" />
            <div className="pixel-battle-arena__ground" aria-hidden="true" />
            <div className="pixel-battle-platform pixel-battle-platform--enemy" aria-hidden="true" />
            <div className="pixel-battle-platform pixel-battle-platform--player" aria-hidden="true" />

            <div className={`battle-turn-banner ${presentationBusy ? 'is-visible' : ''}`} role="status" aria-live="polite"><span>{turnLabel}</span></div>

            <div className={`battle-enemy-party battle-enemy-party--${enemies.length}`}>
              {enemies.map((enemy, index) => (
                <button key={enemy.id} type="button"
                  className={`battle-enemy ${content.enemies[enemy.definitionId]?.boss ? 'battle-enemy--boss' : ''} ${!enemy.alive ? 'defeated' : ''} ${selectedEnemy?.id === enemy.id ? 'selected' : ''} ${hitTargetId === enemy.id ? 'is-hit' : ''}`}
                  onClick={() => enemy.alive && setSelectedTargetId(enemy.id)} disabled={!enemy.alive}
                  aria-label={`Selecionar alvo ${enemy.name} ${index + 1}`} aria-pressed={selectedEnemy?.id === enemy.id}>
                  <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
                  <span>{enemy.name}</span><i><b style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} /></i>
                  {selectedEnemy?.id === enemy.id && enemy.alive ? <Crosshair size={18} /> : null}
                </button>
              ))}
            </div>

            <div className={`battle-player-actor ${hitTargetId === player.id ? 'is-hit' : ''} ${healedTargetId === player.id ? 'is-healed' : ''}`}>
              <CombatPlayerSprite portraitAssetId={save.character.portraitAssetId} defeated={!player.alive} hit={hitTargetId === player.id} />
              <span className="battle-player-actor__aura" aria-hidden="true" />
            </div>

            <div className="battle-game__vitals battle-game__vitals--player">
              <strong>{player.name}</strong><span>{player.hp}/{player.maxHp} PV · {player.mp}/{player.maxMp} MP</span>
              <i><b style={{ width: `${player.hp / player.maxHp * 100}%` }} /></i>
            </div>
            {selectedEnemy ? <div className="battle-game__vitals battle-game__vitals--enemy">
              <strong>{selectedEnemy.name}</strong><span>{selectedEnemy.hp}/{selectedEnemy.maxHp} PV</span>
              <i><b style={{ width: `${selectedEnemy.hp / selectedEnemy.maxHp * 100}%` }} /></i>
            </div> : null}

            <div className="terran-game__hud battle-game__menu" aria-label="Informações do combate">
              <button type="button" className={drawer === 'status' ? 'active' : ''} aria-label="Abrir Status de combate"
                aria-pressed={drawer === 'status'} onClick={() => setDrawer(drawer === 'status' ? null : 'status')}><UserRound size={19} /><span>Status</span></button>
              <button type="button" className={drawer === 'log' ? 'active' : ''} aria-label="Abrir Registro de batalha"
                aria-pressed={drawer === 'log'} onClick={() => setDrawer(drawer === 'log' ? null : 'log')}><ScrollText size={19} /><span>Registro</span></button>
            </div>

            {activeBattle.phase === 'AwaitingAction' && !presentationBusy ? <div className="battle-command-deck">
              <div className="battle-command-deck__prompt"><span className="eyebrow">SEU TURNO</span><strong>O que {player.name} fará?</strong><small>Alvo: {selectedEnemy?.name ?? 'nenhum'}</small></div>
              <div className="battle-action-options" aria-label={`Opções de ${actionFamily}`}>{renderActionOptions()}</div>
              <nav className="battle-action-families" aria-label="Famílias de ação">
                {actionFamilies.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" className={actionFamily === id ? 'active' : ''} aria-pressed={actionFamily === id} onClick={() => setActionFamily(id)}><Icon size={18} /><span>{label}</span></button>
                ))}
              </nav>
            </div> : null}

            {activeBattle.phase === 'Victory' && !presentationBusy ? <div className="battle-result battle-result--victory battle-game__result battle-loot-result">
              <div className="battle-loot-result__heading"><Sparkles size={24} /><div><p className="eyebrow">VITÓRIA</p><h2>{encounter?.victoryTitle ?? 'A rota foi preservada'}</h2><p>{encounter?.victorySummary}</p></div></div>
              {!activeBattle.claimed ? <>
                <div className="battle-loot-result__instruction"><MousePointerClick size={17} /><span>Clique em cada item antes de encerrar o combate.</span></div>
                <div className="battle-drops" aria-label="Drops da batalha">
                  {rewardDrops.length > 0 ? rewardDrops.map(({ key, definition }) => {
                    const collected = collectedDrops.includes(key)
                    return <button key={key} type="button" className={collected ? 'is-collected' : ''}
                      onClick={() => setCollectedDrops((current) => current.includes(key) ? current : [...current, key])}
                      aria-pressed={collected} disabled={collected}>
                      {definition ? <AssetImage assetId={definition.iconAssetId} /> : <Backpack size={30} />}
                      <span>{definition?.name ?? 'Drop desconhecido'}</span>{collected ? <Check size={18} /> : <MousePointerClick size={16} />}
                    </button>
                  }) : <span className="battle-drops__empty">Nenhum item físico neste encontro.</span>}
                </div>
                <div className="battle-loot-result__summary">+{activeBattle.rewards.characterXp} XP · +{activeBattle.rewards.gold} Ouro · +{activeBattle.rewards.boundResonance} Ressonância</div>
                <GameButton variant="primary" onClick={claim} disabled={!allDropsCollected}>Confirmar coleta</GameButton>
              </> : <div className="battle-loot-result__exit"><span><Check size={17} /> Recompensas preservadas no save.</span>
                <GameButton variant="primary" onClick={continueExpedition}>Continuar expedição</GameButton>
                <GameButton variant="ghost" onClick={leave}>Retornar a Terran</GameButton>
              </div>}
            </div> : null}

            {activeBattle.phase === 'Defeat' && !presentationBusy ? <div className="battle-result battle-result--defeat battle-game__result">
              <Shield size={26} /><div><p className="eyebrow">DERROTA</p><h2>Retirada necessária</h2><p>A punição final de derrota permanece OWNER_DECISION.</p></div>
              <GameButton variant="secondary" onClick={leave}>Retornar a Terran</GameButton>
            </div> : null}
          </div>
        </section>

        {drawer ? <aside className="terran-game__drawer battle-game__drawer" aria-label={`Painel lateral: ${drawer === 'status' ? 'Status de combate' : 'Registro de batalha'}`}>
          <header><span className="eyebrow">MÁQUINA DE ESTADOS · {activeBattle.phase}</span><h2>{drawer === 'status' ? 'Status de combate' : 'Registro de batalha'}</h2>
            <button type="button" onClick={() => setDrawer(null)} aria-label="Fechar painel"><X size={19} /></button>
          </header>
          <div className="terran-game__drawer-content">
            {drawer === 'status' ? <>
              <div className="battle-game__identity"><AssetImage assetId={save.character.portraitAssetId} /><div><span className="eyebrow">TERRÍRIAN</span><strong>{player.name}</strong><small>Arma G{activeWeapon?.grade ?? 1} · {activeWeapon?.resonance ?? 0} R</small></div></div>
              <ProgressBar value={player.hp} max={player.maxHp} label="Vida" tone="health" /><ProgressBar value={player.mp} max={player.maxMp} label="Mana" />
              <dl className="combat-stats"><div><dt>Ataque</dt><dd>{player.attackPower}</dd></div><div><dt>Mitigação</dt><dd>{player.mitigation}</dd></div><div><dt>Iniciativa</dt><dd>{player.initiative}</dd></div></dl>
              <StatusList combatant={player} />
              <div className="enemy-roster">{enemies.map((enemy, index) => <button key={enemy.id} type="button"
                className={selectedEnemy?.id === enemy.id ? 'selected' : ''} onClick={() => enemy.alive && setSelectedTargetId(enemy.id)} disabled={!enemy.alive}>
                <span>{index + 1}</span><div><strong>{enemy.name}</strong><small>{enemy.hp}/{enemy.maxHp} Vida</small></div>{enemy.alive ? <Crosshair size={15} /> : <span>×</span>}
              </button>)}</div>
              {selectedEnemy ? <div className="target-inspector"><AssetImage assetId={content.enemies[selectedEnemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
                <p className="eyebrow">ALVO SELECIONADO</p><strong>{selectedEnemy.name}</strong><ProgressBar value={selectedEnemy.hp} max={selectedEnemy.maxHp} label="Vida" tone="health" /><StatusList combatant={selectedEnemy} /></div> : null}
              <div className="initiative-strip" aria-label="Ordem de iniciativa">{activeBattle.initiativeOrder.map((combatantId, index) => {
                const combatant = activeBattle.combatants[combatantId]
                return <span key={combatantId} className={activeBattle.actorId === combatantId ? 'active' : ''}>{index + 1}. {combatant.name}</span>
              })}</div>
            </> : <div className="battle-log-panel"><div className="battle-log" aria-live="polite">
              {activeBattle.log.slice(-18).map((entry) => <p key={entry.id} className={`battle-log__${entry.tone}`}><span>[R{entry.round}]</span> {entry.message}</p>)}
            </div><details><summary>Inspecionar fases resolvidas</summary><code>{activeBattle.phaseHistory.join(' → ')}</code></details></div>}
          </div>
        </aside> : null}
      </div>
    </div>
  )

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function BattleScreen() {
  return <BattleScene />
}
