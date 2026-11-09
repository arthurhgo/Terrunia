import { useEffect, useMemo, useRef, useState } from 'react'
import { Backpack, Bomb, BookOpen, Crosshair, Gem, ScrollText, Shield, Sparkles, Swords, Zap } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { isProtectedBoss, submitBattleCommand as previewBattleCommand } from '../../domain/combat/engine'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { getTrailByNodeId } from '../../domain/exploration/trailEngine'
import { useGameStore } from '../../state/gameStore'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { CharacterPortrait } from '../characters/CharacterSprite'
import { AssetImage } from '../components/AssetImage'
import { EnemyMotionSprite } from '../battle/EnemyMotionSprite'
import { getEnemyFormationSlot } from '../battle/enemyFormation'
import { GameShell } from '../components/GameShell'
import { BattleArenaBackdrop } from '../battle/BattleArenaBackdrop'
import { BattleEquipmentHud } from '../battle/BattleEquipmentHud'
import { BattleDicePlatform, type BattleDiceEvent } from '../battle/BattleDicePlatform'
import { DraggableBattleDie } from '../battle/DraggableBattleDie'
import { BattleTimeline } from '../battle/BattleTimeline'
import { SkillCard } from '../battle/SkillCard'
import { SkillTooltip } from '../battle/SkillTooltip'
import { previewCombatSkill } from '../../domain/combat/skillPreview'
import type { CombatSkillDefinition } from '../../content/types'
import { BATTLE_PRESENTATION } from '../battle/presentationTiming'
import { groupBattleLoot } from '../../domain/inventory/battleLoot'
import './battlePixel.css'
import './battleRemake.css'
import './battleTimeline.css'
import './battleCinematic.css'
import './gameplayV057.css'
import './battleV0513.css'

type Menu = 'attack' | 'skills' | 'magic' | 'items' | 'throwables' | 'runes' | 'essences' | null
const POTION_CARD_ID = 'skill.use-healing-potion'
const clampPercent = (value: number, max: number) => max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0

const getBattleStrikeFx = (event: BattleDiceEvent) => {
  const action = event.action.toLowerCase()
  const style = /pulso ressonante|golpe ressonante/i.test(action) ? 'resonance' as const
    : /ataque em área/i.test(action) ? 'area' as const
    : /arco|bow|flecha|arremess|projectile/i.test(action) ? 'projectile' as const
    : /arcano|magic|magia|arcane|runa|scepter|staff|grimoire|spell/i.test(action) ? 'arcane' as const
      : 'slash' as const
  return {
    actorId: event.actorId ?? (event.actorSide === 'enemy' ? '' : 'combatant_player'),
    targetId: event.targetId ?? (event.actorSide === 'enemy' ? 'combatant_player' : ''),
    style,
  }
}

/** Presentation timers are independent of React re-renders so repeated rolls
 * continue in sequence even when effects, tests or rendering are batched. */
export function BattleScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const submit = useGameStore((state) => state.submitBattleCommand)
  const claim = useGameStore((state) => state.claimBattleRewards)
  const nextWave = useGameStore((state) => state.continuePortalWave)
  const finishBattleIntoExpedition = useGameStore((state) => state.finishBattleIntoExpedition)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const navigate = useNavigate()
  const battle = save?.battle
  const enemies = useMemo(() => battle
    ? Object.values(battle.combatants).filter((actor) => actor.side === 'enemy')
    : [], [battle])
  const player = battle?.combatants.combatant_player
  const [targetId, setTargetId] = useState('')
  const [menu, setMenu] = useState<Menu>(null)
  const [rollReturnMenu, setRollReturnMenu] = useState<Menu>(null)
  const [confirmDefense, setConfirmDefense] = useState(false)
  const [selectedConsumableId, setSelectedConsumableId] = useState('')
  const [hit, setHit] = useState<'player' | 'enemy' | null>(null)
  const [turnCue, setTurnCue] = useState(false)
  const [roundCurtain, setRoundCurtain] = useState<string | null>(null)
  const announcedRound = useRef<{ battleId: string; round: number } | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [activeDice, setActiveDice] = useState<BattleDiceEvent | null>(null)
  const [diceStage, setDiceStage] = useState<'focus' | 'impact'>('focus')
  const [stagedHp, setStagedHp] = useState<Record<string, number> | null>(null)
  const [revealedInitiative, setRevealedInitiative] = useState<Record<string, number>>({})
  const [impactEventId, setImpactEventId] = useState<string | null>(null)
  const [diceQueue, setDiceQueue] = useState<BattleDiceEvent[]>([])
  const [resolvingRolls, setResolvingRolls] = useState(false)
  const [diceAwaitingClick, setDiceAwaitingClick] = useState(false)
  const [initiativeReady, setInitiativeReady] = useState(false)
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null)
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null)
  const [pinnedSkillId, setPinnedSkillId] = useState<string | null>(null)
  const [strikeFx, setStrikeFx] = useState<{ actorId: string; targetId: string; style: 'arcane' | 'projectile' | 'slash' | 'resonance' | 'area' } | null>(null)
  const pendingRollsRef = useRef<{ rolls: BattleDiceEvent[]; cursor: number; commit: () => void } | null>(null)
  const previewTimer = useRef<number | null>(null)
  const seenDiceLog = useRef<{ id: string; count: number } | null>(null)
  const previous = useRef<{ id: string; hp: Record<string, number> } | null>(null)
  const skipPreviewCommitHit = useRef(false)
  const reducedMotion = Boolean(save?.settings.reducedMotion)
  const defeated = battle?.phase === 'Defeat' && player?.hp === 0

  useEffect(() => {
    if (!defeated) return
    const timer = window.setTimeout(() => returnToTerran(), reducedMotion ? 600 : 2800)
    return () => window.clearTimeout(timer)
  }, [battle?.id, defeated, reducedMotion, returnToTerran])

  useEffect(() => {
    if (!enemies.some((enemy) => enemy.id === targetId && enemy.alive && (!battle || !isProtectedBoss(battle, enemy)))) {
      setTargetId(enemies.find((enemy) => enemy.alive && (!battle || !isProtectedBoss(battle, enemy)))?.id ?? '')
    }
  }, [battle, enemies, targetId])
  useEffect(() => {
    setMenu(null)
    setConfirmDefense(false)
    setRollReturnMenu(null)
    setActiveDice(null)
    setDiceStage('focus')
    setStagedHp(null)
    setRevealedInitiative({})
    setImpactEventId(null)
    setDiceQueue([])
    setResolvingRolls(false)
    setDiceAwaitingClick(false)
    setInitiativeReady(false)
    setRoundCurtain(null)
    setStrikeFx(null)
    announcedRound.current = null
    setHoveredEnemyId(null)
    setHoveredSkillId(null)
    setPinnedSkillId(null)
    pendingRollsRef.current = null
    if (previewTimer.current !== null) window.clearTimeout(previewTimer.current)
    previewTimer.current = null
    seenDiceLog.current = null
    previous.current = null
  }, [battle?.id])
  useEffect(() => {
    if (!battle) return
    const hp = Object.fromEntries(Object.values(battle.combatants).map((actor) => [actor.id, actor.hp]))
    const old = previous.current
    previous.current = { id: battle.id, hp }
    if (skipPreviewCommitHit.current) { skipPreviewCommitHit.current = false; return }
    if (reducedMotion || old?.id !== battle.id) return
    const playerHit = player && player.hp < (old.hp[player.id] ?? player.hp)
    const enemyHit = enemies.some((enemy) => enemy.hp < (old.hp[enemy.id] ?? enemy.hp))
    if (!playerHit && !enemyHit) return
    setHit(playerHit ? 'player' : 'enemy')
    setTurnCue(Boolean(playerHit))
    const timer = window.setTimeout(() => { setHit(null); setTurnCue(false) }, 620)
    return () => window.clearTimeout(timer)
  }, [battle, enemies, player, reducedMotion])

  useEffect(() => () => {
    if (previewTimer.current !== null) window.clearTimeout(previewTimer.current)
  }, [])

  // Domain log records actual dice faces, including enemy attacks.
  useEffect(() => {
    if (!battle) return
    const cursor = seenDiceLog.current
    const start = cursor?.id === battle.id ? cursor.count : battle.log.length
    seenDiceLog.current = { id: battle.id, count: battle.log.length }
    const incoming: BattleDiceEvent[] = battle.log.slice(start).flatMap((entry) => {
      if (entry.tone !== 'damage' || !entry.roll) return []
      const damage = entry.message.match(/ causa (\d+) de dano /)
      if (!damage) return []
      const actor = battle.combatants[entry.roll.actorId]
      return [{
        id: entry.id, sides: entry.roll.sides, face: entry.roll.face,
        actorId: entry.roll.actorId, targetId: entry.roll.targetId ?? (actor?.side === 'enemy' ? 'combatant_player' : targetId),
        damage: Number(damage[1]), action: entry.roll.action,
        actorName: actor?.name ?? 'Combatente', actorSide: actor?.side ?? 'enemy',
      }]
    })
    if (incoming.length) setDiceQueue((queue) => [...queue, ...incoming])
  }, [battle])

  useEffect(() => {
    if (activeDice || resolvingRolls || !diceQueue.length) return
    setDiceStage('focus')
    setActiveDice(diceQueue[0])
    setDiceQueue((queue) => queue.slice(1))
  }, [activeDice, diceQueue, resolvingRolls])

  // Committed/legacy dice have no staged domain command. Keep their presentation
  // separate from the explicit player/enemy roll queue below.
  useEffect(() => {
    if (!activeDice || resolvingRolls || diceAwaitingClick) return
    const event = activeDice
    const focusMs = reducedMotion ? BATTLE_PRESENTATION.reducedMotionDieMs
      : BATTLE_PRESENTATION.dieSpinMs + BATTLE_PRESENTATION.dieResultHoldMs
    const impactMs = event.kind === 'damage' ? (reducedMotion ? 160 : 450) : 80
    const reveal = window.setTimeout(() => {
      setDiceStage('impact')
      if (event.kind === 'initiative' && event.initiativeTotal !== undefined && event.actorId) {
        const actorId = event.actorId
        const total = event.initiativeTotal
        setRevealedInitiative((current) => ({ ...current, [actorId]: total }))
      }
      if (event.kind === 'damage') {
        setImpactEventId(event.id)
        if (!reducedMotion) setStrikeFx(getBattleStrikeFx(event))
      }
    }, focusMs)
    const finish = window.setTimeout(() => {
      setActiveDice(null)
      setDiceStage('focus')
      setImpactEventId(null)
      setStrikeFx(null)
    }, focusMs + impactMs)
    return () => { window.clearTimeout(reveal); window.clearTimeout(finish) }
  }, [activeDice, diceAwaitingClick, reducedMotion, resolvingRolls])

  // Round separators belong to the presentation layer. One banner per real round
  // even when several enemies are resolved inside the same domain command.
  useEffect(() => {
    if (!battle || battle.phase === 'Victory' || battle.phase === 'Defeat') return
    const last = announcedRound.current
    if (last?.battleId === battle.id && last.round === battle.round) return
    announcedRound.current = { battleId: battle.id, round: battle.round }
    setRoundCurtain('TURNO ' + battle.round)
    const timer = window.setTimeout(() => setRoundCurtain(null),
      reducedMotion ? BATTLE_PRESENTATION.reducedMotionBannerMs : BATTLE_PRESENTATION.roundBannerMs)
    return () => window.clearTimeout(timer)
  }, [battle?.id, battle?.round, reducedMotion])

  // First announce the round, then invite the player to roll real initiative.
  useEffect(() => {
    if (!battle || battle.phase !== 'AwaitingInitiative') return
    setInitiativeReady(false)
    const timer = window.setTimeout(() => {
      setInitiativeReady(true)
    }, reducedMotion ? 400 : 950)
    return () => window.clearTimeout(timer)
  }, [battle?.id, battle?.phase, reducedMotion])

  if (!save) return <Navigate to="/terran" replace />
  if (!battle) {
    const destination = save.world.currentLocationId === FUNGAL_DUNGEON_ID ? '/dungeon'
      : content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId) ? '/expedition' : '/terran'
    return <Navigate to={destination} replace />
  }
  if (!player || !enemies.length) return <Navigate to="/terran" replace />

  const target = enemies.find((enemy) => enemy.id === targetId && enemy.alive && !isProtectedBoss(battle, enemy))
    ?? enemies.find((enemy) => enemy.alive && !isProtectedBoss(battle, enemy)) ?? enemies[0]
  const encounter = content.encounters[battle.encounterId]
  const battleTitle = `${encounter?.locationLabel ?? 'ASTRAVÉL'}: ${encounter?.name ?? (battle.waveIndex ? 'ONDA ' + battle.waveIndex : 'COMBATE')}`
  const skills = player.skillIds.map((id) => content.combatSkills[id]).filter((skill) => Boolean(skill))
  const inspectedSkill = skills.find((skill) => skill.id === (pinnedSkillId ?? hoveredSkillId))
  const healingPotion = save.inventory.find((instance) =>
    content.items[instance.definitionId]?.combatUseMode === 'freeHealingPotion' && instance.quantity > 0)
  const potionSkill: CombatSkillDefinition = {
    id: POTION_CARD_ID, name: 'Tomar Poção',
    description: 'Usa 1 Poção Restauradora sem consumir a ação. Regenera 10% da Vida em dois turnos.',
    target: 'self', mpCost: 0, cooldownTurns: 2, damageDieSteps: 0,
    iconAssetId: POTION_CARD_ID,
    effects: [{ type: 'restoreHp', value: Math.ceil(player.maxHp * 0.1) }],
    status: 'BALANCE_DRAFT',
  }
  const potionInspected = menu === 'items' && (hoveredSkillId === POTION_CARD_ID || pinnedSkillId === POTION_CARD_ID)
  const potionUnavailable = !healingPotion ? 'Nenhuma Poção Restauradora'
    : (player.potionCooldown ?? 0) > 0 || (player.potionHealingTicks ?? 0) > 0 ? 'Poção em recarga'
      : player.hp >= player.maxHp ? 'Vida cheia' : null
  const consumables = save.inventory.filter((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.category === 'consumable' && definition.combatEffects.length > 0
      && !definition.combatKind && definition.combatUseMode !== 'freeHealingPotion'
  })
  const categoryItems = (kind: 'throwable' | 'rune' | 'essence') =>
    save.inventory.filter((instance) => content.items[instance.definitionId]?.combatKind === kind)
  const isMagicSkill = (id: string) => content.combatSkills[id]?.presentationGroup === 'magic'
  const skillPickerOpen = menu === 'skills' || menu === 'magic' || menu === 'attack'
  const visibleSkills = menu === 'magic' || menu === 'skills'
    ? skills.filter((skill) => menu === 'magic' ? isMagicSkill(skill.id) : !isMagicSkill(skill.id))
    : []
  const attackCards: CombatSkillDefinition[] = [
    {id:'attack_single_v05141',name:'Ataque Único',description:'Ataque concentrado no inimigo selecionado, com força integral.',target:'enemy',mpCost:0,cooldownTurns:0,damageDieSteps:0,iconAssetId:'action.attack-single',effects:[{type:'damage',powerBonus:0}],status:'BALANCE_DRAFT'},
    {id:'skill_basic_area_attack',name:'Ataque em Área',description:'60% do ataque no alvo central + 30% desse dano no inimigo de cada lado.',target:'enemy',mpCost:0,cooldownTurns:0,damageDieSteps:0,iconAssetId:'action.attack-area',effects:[{type:'damage',powerBonus:0}],status:'BALANCE_DRAFT'},
  ]
  const skillColumns = Math.max(1, Math.min(4, visibleSkills.length))
  const skillRows = Math.max(1, Math.ceil(visibleSkills.length / skillColumns))
  const hasUsefulSupplies = (kind: 'throwable' | 'rune' | 'essence') =>
    categoryItems(kind).some((instance) => content.items[instance.definitionId].combatEffects.some((effect) =>
      effect.type === 'damage' || effect.type === 'applyStatus' ||
      (effect.type === 'restoreHp' && player.hp < player.maxHp) ||
      (effect.type === 'restoreMp' && player.mp < player.maxMp) ||
      (effect.type === 'cleanseHarmful' && player.statusEffects.some((status) =>
        content.statusEffects[status.definitionId]?.tone === 'harmful'))))
  const selectedItem = consumables.find((item) => item.instanceId === selectedConsumableId) ?? consumables[0]
  const itemDefinition = selectedItem ? content.items[selectedItem.definitionId] : undefined
  const itemUseful = Boolean(itemDefinition?.combatEffects.some((effect) =>
    effect.type === 'restoreHp' && player.hp < player.maxHp
    || effect.type === 'restoreMp' && player.mp < player.maxMp
    || effect.type === 'cleanseHarmful' && player.statusEffects.some((status) => content.statusEffects[status.definitionId]?.tone === 'harmful'),
  ))
  const hasUsableConsumable = Boolean(healingPotion) || consumables.some((item) => content.items[item.definitionId].combatEffects.some((effect) =>
    (effect.type === 'restoreHp' && player.hp < player.maxHp) ||
    (effect.type === 'restoreMp' && player.mp < player.maxMp) ||
    (effect.type === 'cleanseHarmful' && player.statusEffects.some((status) =>
      content.statusEffects[status.definitionId]?.tone === 'harmful'))))
  const isPlayerTurn = battle.phase === 'AwaitingAction' && !roundCurtain && !turnCue && !activeDice && !diceQueue.length && !resolvingRolls
  // A read-only diagnostic for UI tests and future support investigations.
  // Combat authority remains in the domain state machine.
  const actionGate = battle.phase !== 'AwaitingAction' ? battle.phase
    : roundCurtain ? 'round-curtain'
      : turnCue ? 'enemy-reaction'
        : activeDice ? diceAwaitingClick ? 'player-die' : 'die-presentation'
          : diceQueue.length ? 'queued-dice'
            : resolvingRolls ? 'resolving-rolls'
              : target.alive ? 'ready' : 'no-live-target'
  const biome = getTrailByNodeId(content, battle.trailNodeId)?.regionId
  const battleBiome = biome === 'cerrado' || biome === 'elduran' ? biome : 'astravel'
  const drops = battle.rewards.lootDefinitionIds
  const lootGroups = groupBattleLoot(drops)

  const playVisualRoll = (event: BattleDiceEvent) => {
    const focusMs = reducedMotion ? BATTLE_PRESENTATION.reducedMotionDieMs
      : BATTLE_PRESENTATION.dieSpinMs + BATTLE_PRESENTATION.dieResultHoldMs
    const impactMs = event.kind === 'damage' ? (reducedMotion ? 160 : 450) : 80
    previewTimer.current = window.setTimeout(() => {
      // A roll becomes public only after its own die focus finishes.
      setDiceStage('impact')
      if (event.kind === 'initiative' && event.initiativeTotal !== undefined && event.actorId) {
        const actorId = event.actorId
        const total = event.initiativeTotal
        setRevealedInitiative((current) => ({ ...current, [actorId]: total }))
      }
      if (event.kind === 'damage') {
        if (event.targetId) {
          setStagedHp((current) => current ? {
            ...current,
            [event.targetId!]: Math.max(0, (current[event.targetId!] ?? 0) - event.damage),
          } : current)
        }
        setImpactEventId(event.id)
        if (!reducedMotion) setStrikeFx(getBattleStrikeFx(event))
      }
      previewTimer.current = window.setTimeout(() => {
        setStrikeFx(null)
        setImpactEventId(null)
        setDiceStage('focus')
        const sequence = pendingRollsRef.current
        if (!sequence) { setActiveDice(null); previewTimer.current = null; return }
        sequence.cursor += 1
        if (sequence.cursor >= sequence.rolls.length) {
          pendingRollsRef.current = null
          previewTimer.current = null
          setActiveDice(null)
          setDiceAwaitingClick(false)
          setResolvingRolls(false)
          skipPreviewCommitHit.current = true
          sequence.commit()
          setStagedHp(null)
          return
        }
        const next = sequence.rolls[sequence.cursor]
        setActiveDice(next)
        const awaitingPlayerThrow = next.actorSide === 'player' && next.kind !== 'initiative'
          && !/Pulso Ressonante|Ataque em Área/.test(next.action)
        setDiceAwaitingClick(awaitingPlayerThrow)
        if (!awaitingPlayerThrow) playVisualRoll(next)
      }, impactMs)
    }, focusMs)
  }

  const releasePlayerDie = () => {
    if (!diceAwaitingClick || !pendingRollsRef.current) return
    setDiceAwaitingClick(false)
    playVisualRoll(pendingRollsRef.current.rolls[pendingRollsRef.current.cursor])
  }
  // The domain preview has NOT been committed while the player's die is awaiting
  // input. Canceling must discard the preview atomically, not spend MP or a turn.
  const cancelPendingRoll = () => {
    if (!diceAwaitingClick || !pendingRollsRef.current) return
    if (previewTimer.current !== null) window.clearTimeout(previewTimer.current)
    previewTimer.current = null
    pendingRollsRef.current = null
    setActiveDice(null)
    setDiceStage('focus')
    setDiceQueue([])
    setStagedHp(null)
    setImpactEventId(null)
    setDiceAwaitingClick(false)
    setResolvingRolls(false)
    setMenu(rollReturnMenu)
  }
  const send = (command: Parameters<typeof submit>[0]) => {
    const initiative = command.type === 'rollInitiative'
    if (initiative ? battle.phase !== 'AwaitingInitiative' || !initiativeReady || Boolean(roundCurtain) : !isPlayerTurn) return
    setRollReturnMenu(menu)
    setMenu(null)
    setConfirmDefense(false)
    const preview = previewBattleCommand(battle, command, content, save.inventory)
    if (!preview.ok) { submit(command); return }

    const rolls: BattleDiceEvent[] = preview.value.log.slice(battle.log.length).flatMap<BattleDiceEvent>((entry) => {
      if (!entry.roll) return []
      const roll = entry.roll
      const actor = preview.value.combatants[roll.actorId]
      if (roll.action === 'Iniciativa') {
        return [{
          id: entry.id, sides: roll.sides, face: roll.face,
          actorId: roll.actorId, targetId: undefined,
          damage: 0, action: 'Iniciativa', kind: 'initiative' as const,
          initiativeTotal: actor?.initiative,
          actorName: actor?.name ?? 'Combatente', actorSide: actor?.side ?? 'enemy' as const,
        }]
      }
      if (entry.tone !== 'damage') return []
      const match = entry.message.match(/ causa (\d+) de dano /)
      if (!match) return []
      return [{
        id: entry.id, sides: roll.sides, face: roll.face, damage: Number(match[1]),
        actorId: roll.actorId, targetId: roll.targetId ?? (actor?.side === 'enemy' ? player.id : target.id),
        action: roll.action, kind: 'damage' as const,
        ...(roll.weaponBonusRoll ? { weaponBonusRoll: roll.weaponBonusRoll } : {}),
        actorName: actor?.name ?? 'Combatente', actorSide: actor?.side ?? 'enemy' as const,
      }]
    })
    if (!rolls.length) { submit(command); return }
    setStagedHp(Object.fromEntries(Object.values(battle.combatants).map((actor) => [actor.id, actor.hp])))
    setImpactEventId(null)
    setResolvingRolls(true)
    setDiceStage('focus')
    setActiveDice(rolls[0])
    const requireClick = !initiative && rolls[0].actorSide === 'player'
    setDiceAwaitingClick(requireClick)
    const originalBattleId = battle.id
    const logCount = preview.value.log.length
    pendingRollsRef.current = {
      rolls, cursor: 0,
      commit: () => {
        seenDiceLog.current = { id: originalBattleId, count: logCount }
        submit(command)
      },
    }
    if (!requireClick) playVisualRoll(rolls[0])
  }
  const openMenu = (next: Menu) => {
    setHoveredSkillId(null)
    setPinnedSkillId(null)
    setConfirmDefense(false)
    setMenu(menu === next ? null : next)
  }
  const end = (toCity: boolean) => {
    if (toCity) returnToTerran()
    else finishBattleIntoExpedition()
    if (!unified) navigate(toCity || battle.clanTrialQuestId || battle.clanBossQuestId ? '/terran' : save.world.currentLocationId === FUNGAL_DUNGEON_ID ? '/dungeon' : '/expedition')
  }
  const button = (label: string, icon: React.ReactNode, onClick: () => void, disabled = false, selected = false) => (
    <button key={label} type="button"
      className={`pixel-battle__command ${label === 'ATAQUE' ? 'is-primary' : ''} ${selected ? 'is-selected' : ''}`}
      disabled={disabled} aria-disabled={disabled} title={disabled ? `${label}: ação indisponível` : label}
      onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  )

  // During the visual die preview, show only the HP committed to the save.
  const visualHp = (id: string) => stagedHp?.[id] ?? battle.combatants[id]?.hp ?? 0
  // VISUAL_DRAFT: announce the real timeline actor, including enemy initiative.
  // This reads domain turns/rolls; it never alters action order or HP.
  const actorCueName = activeDice?.kind === 'damage'
    ? activeDice.actorName
    : battle.phase === 'AwaitingAction' && !roundCurtain
      ? battle.combatants[battle.actorId]?.name ?? player.name
      : null
  const actingId = activeDice?.actorId ?? battle.actorId
  const receivingId = diceStage === 'impact' && activeDice?.kind === 'damage' ? activeDice.targetId : undefined
  const damageRevealed = diceStage === 'impact' && activeDice?.id === impactEventId

  const statusesFor=(actor:NonNullable<typeof player>)=><div className="pixel-battle__status-strip" aria-label="Efeitos ativos">
    {actor.statusEffects.map((effect,index)=>{
      const definition=content.statusEffects[effect.definitionId]
      return <span key={effect.definitionId+'-'+index} title={`${definition?.name??effect.definitionId} · ${effect.remainingTurns} turno(s): ${definition?.description??''}`}>
        <AssetImage assetId={`status.${effect.definitionId}`} alt={definition?.name??effect.definitionId}/>
        <b>{effect.remainingTurns}T</b>
      </span>
    })}
  </div>
  const scene = <section className={`pixel-battle ${activeDice && diceStage === 'focus' ? "pixel-battle--dice-pending" : ""} ${diceAwaitingClick ? "pixel-battle--dice-awaiting" : ""}`} role="region" aria-label="Viewport unificada de combate">
    <header className="pixel-battle__header" aria-label="Encontro de combate">
      <strong>TERRÚNIA</strong>
      <div className="pixel-battle__encounter-label"><h1 title={battleTitle}>{battleTitle}</h1></div>
      <small>{battle.waveIndex ? 'ONDA ' + battle.waveIndex + ' · ' : ''}RODADA {battle.round} · {activeDice?.actorName ? 'VEZ DE ' + activeDice.actorName.toLocaleUpperCase('pt-BR') : turnCue ? 'REAÇÃO INIMIGA' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : battle.phase === 'AwaitingInitiative' ? 'INICIATIVA PENDENTE' : 'TURNO DO JOGADOR'}</small>
    </header>
    <BattleTimeline battle={battle} revealedInitiative={revealedInitiative} activeActorId={actingId} stagedHp={stagedHp} playerAppearance={save.character.appearance} playerPortraitAssetId={save.character.portraitAssetId} />
    <main className="pixel-battle__arena" aria-label="Campo de batalha por turnos">
      <BattleArenaBackdrop dungeon={save.world.currentLocationId === FUNGAL_DUNGEON_ID} biome={battleBiome} />
      <div className={`pixel-battle__hero ${hit === 'player' ? 'is-hit' : ''} ${!player.alive ? 'is-fallen' : ''} ${strikeFx?.actorId === player.id ? 'is-striking' : ''} ${strikeFx?.targetId === player.id ? 'is-strike-target' : ''} ${activeDice && diceStage === 'impact' && actingId === player.id ? 'is-acting' : ''} ${receivingId === player.id ? 'is-receiving' : ''}`}>
        {damageRevealed && receivingId === player.id && <b className="pixel-battle__damage-number" role="status">−{activeDice?.damage}</b>}
        <EquippedCharacter save={save} facing="right" alt={player.alive ? 'Terrírian voltado para os inimigos' : 'Terrírian derrotado'} />
      </div>
      <div className={`pixel-battle__enemies pixel-battle__enemies--${enemies.length}`}>
        {enemies.map((enemy, i) => <button type="button" key={enemy.id}
          style={{ '--enemy-x': `${getEnemyFormationSlot(i, enemies.length).xPercent}%`,
            '--enemy-depth': `${getEnemyFormationSlot(i, enemies.length).depthPx}px`,
            '--enemy-width': `${getEnemyFormationSlot(i, enemies.length).widthPercent}%`,
            zIndex: getEnemyFormationSlot(i, enemies.length).layer } as React.CSSProperties}
          data-granite-golem={enemy.definitionId === 'enemy_granite_golem' ? 'true' : undefined}
          className={`pixel-battle__enemy ${enemy.id === target.id ? 'is-target' : ''} ${visualHp(enemy.id) === 0 ? 'is-dead' : ''} ${hit === 'enemy' && enemy.id === target.id ? 'is-hit' : ''} ${strikeFx?.actorId === enemy.id ? 'is-striking' : ''} ${strikeFx?.targetId === enemy.id ? 'is-strike-target' : ''} ${activeDice && diceStage === 'impact' && actingId === enemy.id ? 'is-acting' : ''} ${receivingId === enemy.id ? 'is-receiving' : ''}`}
          onClick={() => enemy.alive && !isProtectedBoss(battle, enemy) && setTargetId(enemy.id)}
           disabled={!enemy.alive || isProtectedBoss(battle, enemy)}
          onMouseEnter={() => setHoveredEnemyId(enemy.id)} onMouseLeave={() => setHoveredEnemyId(null)}
          onFocus={() => setHoveredEnemyId(enemy.id)} onBlur={() => setHoveredEnemyId(null)}
          aria-describedby={hoveredEnemyId === enemy.id ? 'enemy-status-' + i : undefined}
          aria-label={isProtectedBoss(battle, enemy)
             ? `${enemy.name} protegido: derrote os fungos para alvejar a Sentinela`
             : `Selecionar ${enemy.name} ${i + 1}, ${visualHp(enemy.id)} de ${enemy.maxHp} de Vida`}
          aria-pressed={enemy.id === target.id}>
          {isProtectedBoss(battle, enemy) && <span className="pixel-battle__boss-lock" aria-hidden="true">🔒</span>}
           {enemy.alive && enemy.id === target.id && <span className="pixel-battle__target-arrow" aria-hidden="true">◆</span>}
          <span className="pixel-battle__enemy-bar" role="progressbar" aria-label={`Vida de ${enemy.name} ${i + 1}`}
            aria-valuenow={visualHp(enemy.id)} aria-valuemin={0} aria-valuemax={enemy.maxHp}>
            <i style={{ width: clampPercent(visualHp(enemy.id), enemy.maxHp) + '%' }} />
            <b>{visualHp(enemy.id)} / {enemy.maxHp}</b>
          </span>
          {statusesFor(enemy)}
          <EnemyMotionSprite
            assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'}
            reducedMotion={reducedMotion}
            motion={visualHp(enemy.id) <= 0 ? 'defeat'
              : strikeFx?.actorId === enemy.id ? 'attack'
                : strikeFx?.targetId === enemy.id || receivingId === enemy.id ? 'hit' : 'idle'} />
          {damageRevealed && receivingId === enemy.id && <b className="pixel-battle__damage-number" role="status">−{activeDice?.damage}</b>}
           <small>{enemy.name}</small>
          {hoveredEnemyId === enemy.id && <span className="pixel-battle__enemy-tooltip" role="tooltip"
            aria-label={'Status de ' + enemy.name} id={'enemy-status-' + i}>
            <strong>{enemy.name}</strong>
            <span>Vida: {visualHp(enemy.id)}/{enemy.maxHp} · Mana: {enemy.mp}/{enemy.maxMp}</span>
            <span>Nível {content.enemies[enemy.definitionId]?.level ?? 1} · Ataque: {enemy.attackPower} · Defesa: {enemy.mitigation}</span>
            <span>Iniciativa: {battle.phase === 'AwaitingInitiative' ? (revealedInitiative[enemy.id] ?? 'pendente') : enemy.initiative} · Dado d{enemy.attackDie ?? 4}</span>
            <span>{enemy.statusEffects.length ? enemy.statusEffects.map((status) =>
              content.statusEffects[status.definitionId]?.name ?? status.definitionId).join(', ') : 'Sem efeitos ativos'}</span>
          </span>}
        </button>)}
      </div>
      {battle.bossMechanics && <div className="pixel-battle__boss-timers" role="status">
         <strong>☷ Núcleo da Ruína · {Object.values(battle.combatants).filter((actor) => actor.side === 'enemy' && actor.alive && actor.id !== battle.bossMechanics?.bossId).length}/3 guardiões</strong>
         <span>Invocação: {5 - battle.round % 5} rodadas · Cura: {2 - battle.round % 2} rodadas</span>
         <small>{Object.values(battle.combatants).some((actor) => actor.side === 'enemy' && actor.alive && actor.id !== battle.bossMechanics?.bossId)
           ? 'Derrote os fungos para atingir a Sentinela' : 'Sentinela vulnerável'}</small>
       </div>}
       {actorCueName && <div className="pixel-battle__actor-cue" role="status" aria-live="polite">
        TURNO DE {actorCueName.toLocaleUpperCase('pt-BR')}
      </div>}
      {roundCurtain && !activeDice && <div className="pixel-battle__round-curtain" role="status" aria-label="Separador de turno">
        <span>✧</span><strong>{roundCurtain}</strong>
      </div>}
      {activeDice && diceStage === 'focus' && <BattleDicePlatform key={activeDice.id} roll={activeDice} reducedMotion={reducedMotion}
          awaitingClick={diceAwaitingClick} playerAppearance={save.character.appearance}
          playerPortraitAssetId={save.character.portraitAssetId}
          enemyPortraitAssetId={activeDice.actorId && battle.combatants[activeDice.actorId]
            ? content.enemies[battle.combatants[activeDice.actorId].definitionId]?.assetId : undefined} />}
      {strikeFx && <span className={`pixel-battle__strike-fx
        ${strikeFx.actorId === player.id ? 'to-enemy' : 'to-player'} is-${strikeFx.style}`} aria-hidden="true" />}
      {defeated && <div className="pixel-battle__death" role="status" aria-label="Terrírian derrotado">
        <div className="pixel-battle__death-aura" aria-hidden="true" />
        <div className="pixel-battle__death-character">
          <EquippedCharacter save={save} alt="Personagem caindo ao perder toda a Vida" />
        </div>
        <strong>O TERRÍRIAN CAIU</strong>
        <small>Seu Nexo desperta na Base de Terran...</small>
        <button type="button" onClick={() => end(true)}>ACORDAR NA BASE</button>
      </div>}
      {battle.phase === 'Victory' && !battle.claimed && <div className="pixel-battle__drops" aria-label="Espólios disponíveis">
        <strong>ESPÓLIOS · RECOLHA TUDO EM UMA AÇÃO</strong>
        {lootGroups.map(({ definitionId, quantity }) => <div key={definitionId} className="pixel-battle__loot-stack">
          <AssetImage assetId={content.items[definitionId]?.iconAssetId ?? 'item.fungal-nucleus'}
            alt={content.items[definitionId]?.name ?? definitionId} />
          <span>{content.items[definitionId]?.name ?? definitionId}{quantity > 1 ? ` ×${quantity}` : ''}</span>
        </div>)}
        {lootGroups.length === 0 && <small>Nenhum item material. Ouro e XP serão recebidos normalmente.</small>}
      </div>}
    </main>
    <div className="pixel-battle__foot">
      <section className="pixel-battle__panel pixel-battle__stats">
        <h2>TERRÍRIAN</h2>
        <div className="pixel-battle__stat-body">
          <CharacterPortrait appearance={save.character.appearance} portraitAssetId={save.character.portraitAssetId} alt="" className="pixel-battle__portrait" />
          <div>
            <strong>{player.name}</strong>
            <div className="pixel-battle__meter hp" role="progressbar" aria-label="Vida" aria-valuenow={visualHp(player.id)} aria-valuemin={0} aria-valuemax={player.maxHp}><i style={{ width: clampPercent(visualHp(player.id), player.maxHp) + '%' }} /><span>VIDA {visualHp(player.id)} / {player.maxHp}</span></div>
            <div className="pixel-battle__meter mp" role="progressbar" aria-label="Mana" aria-valuenow={player.mp} aria-valuemin={0} aria-valuemax={player.maxMp}><i style={{ width: clampPercent(player.mp, player.maxMp) + '%' }} /><span>MANA {player.mp} / {player.maxMp}</span></div>
          </div>
        </div>
        {statusesFor(player)}
        <BattleEquipmentHud save={save} />
      </section>
      <section className="pixel-battle__panel pixel-battle__actions" aria-label="Ações de combate" data-turn-gate={actionGate}>
        <h2>{diceAwaitingClick ? 'LANCE SEU DADO' : battle.phase === 'AwaitingInitiative' ? 'ROLAGEM DE INICIATIVA' : battle.phase === 'AwaitingAction' ? 'ESCOLHA SUA AÇÃO' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : 'COMBATE'}</h2>
        {diceAwaitingClick && activeDice && <div className="pixel-battle__roll-choice">
          <DraggableBattleDie key={activeDice.id} sides={activeDice.sides}
            onThrow={releasePlayerDie} ariaLabel={`Arrastar dado d${activeDice.sides} para cima para rolar`} />
          <button type="button" className="pixel-battle__roll-back" onClick={cancelPendingRoll}
            aria-label="Voltar antes de lançar o dado">VOLTAR</button>
        </div>}
        {battle.phase === 'AwaitingInitiative' ? <div className="pixel-battle__initiative" aria-label="Preparar rolagem de iniciativa">
          <strong>{initiativeReady ? 'ROLAGEM DE INICIATIVA' : 'TURNO ' + battle.round}</strong>
          <DraggableBattleDie sides={player.initiativeDie ?? 4}
            disabled={!initiativeReady || resolvingRolls || Boolean(roundCurtain)} ariaLabel={`Arrastar dado de iniciativa d${player.initiativeDie ?? 4} para cima para rolar`}
            onThrow={() => send({ type: 'rollInitiative' })} />
          <small>Seu dado de Agilidade define a ordem junto à iniciativa-base. Monstros rolam automaticamente.</small>
        </div> : battle.phase === 'AwaitingAction' ? <>
          <div className="pixel-battle__commands" aria-label="Barra de ações">
            {button('ATAQUE', <Swords />, () => openMenu('attack'), !isPlayerTurn || !target.alive, menu==='attack')}
            {button('HABILIDADES', <BookOpen />, () => openMenu('skills'), !isPlayerTurn || skills.filter((skill) => !isMagicSkill(skill.id)).length === 0, menu === 'skills')}
            {button('MAGIAS', <Sparkles />, () => openMenu('magic'), !isPlayerTurn || skills.filter((skill) => isMagicSkill(skill.id)).length === 0, menu === 'magic')}
            {button('DEFENDER', <Shield />, () => { setConfirmDefense(true); setMenu(null) }, !isPlayerTurn, confirmDefense)}
            {button('POÇÕES', <Backpack />, () => openMenu('items'), !isPlayerTurn || !hasUsableConsumable, menu === 'items')}
            {button('ARREMESSÁVEIS', <Bomb />, () => openMenu('throwables'), !isPlayerTurn || !hasUsefulSupplies('throwable'), menu === 'throwables')}
            {button('RUNAS', <Gem />, () => openMenu('runes'), !isPlayerTurn || !hasUsefulSupplies('rune'), menu === 'runes')}
            {button('ESSÊNCIAS', <Zap />, () => openMenu('essences'), !isPlayerTurn || !hasUsefulSupplies('essence'), menu === 'essences')}
          </div>
          {confirmDefense && <div className="pixel-battle__submenu pixel-battle__submenu--confirm" role="group" aria-label="Confirmar defesa">
            <strong>DEFESA · próximo turno</strong>
            <button type="button" onClick={() => setConfirmDefense(false)} aria-label="Voltar sem defender">VOLTAR</button>
            <button type="button" onClick={() => send({ type: 'defend' })}>CONFIRMAR DEFESA</button>
          </div>}
          {menu && <div className={`pixel-battle__submenu ${skillPickerOpen ? 'pixel-battle__submenu--skill-picker' : ''}`}
            aria-label={skillPickerOpen ? 'Seleção de habilidades sem rolagem' : undefined}>
            <button type="button" aria-label="Voltar sem executar a ação" onClick={() => setMenu(null)}>VOLTAR</button>
            {menu === 'attack' && <div className="pixel-battle__skill-grid pixel-battle__attack-grid" aria-label="Escolher modo de ataque">
              {attackCards.map((attack) => <SkillCard key={attack.id} skill={attack}
                preview={previewCombatSkill(player,target,attack,content)} remaining={0}
                unavailable={!isPlayerTurn?'Aguarde seu turno':!target.alive?'Alvo indisponível':null}
                onInspect={()=>{setPinnedSkillId(null);setHoveredSkillId(attack.id)}} onLeave={()=>setHoveredSkillId(null)}
                onPin={()=>setPinnedSkillId(attack.id)}
                onUse={()=>send(attack.id==='attack_single_v05141'?{type:'attack',targetId:target.id}:{type:'areaAttack',targetId:target.id})}/>) }
            </div>}
            {(menu === 'skills'||menu === 'magic') && <>
              <div className="pixel-battle__skill-grid"
                style={{ '--skill-columns': skillColumns, '--skill-rows': skillRows,
                  '--skill-max-width': `${skillColumns * 106 + (skillColumns - 1) * 6}px` } as React.CSSProperties}>
              {visibleSkills.map((skill) => {
                const remaining = player.skillCooldowns?.[skill.id] ?? 0
                const skillTarget = skill.target === 'self' ? player : target
                const preview = previewCombatSkill(player, skillTarget, skill, content)
                const unavailable = !isPlayerTurn ? 'Aguarde seu turno'
                  : remaining > 0 ? `Recarga: ${remaining} turno(s)`
                    : player.mp < skill.mpCost ? 'Mana insuficiente'
                      : skill.target === 'enemy' && !target.alive ? 'Alvo indisponível' : null
                return <SkillCard key={skill.id} skill={skill} preview={preview} remaining={remaining}
                  unavailable={unavailable}
                  onInspect={() => { setPinnedSkillId(null); setHoveredSkillId(skill.id) }}
                  onLeave={() => setHoveredSkillId(null)}
                  onPin={() => setPinnedSkillId(skill.id)}
                  onUse={() => { if (!unavailable) send({ type: 'skill', skillId: skill.id, targetId: skillTarget.id }) }} />
              })}
              </div>
            </>}
             {menu === 'items' && <>
               <div className="pixel-battle__potion-skill">
                 <SkillCard skill={potionSkill} preview={previewCombatSkill(player, player, potionSkill, content)}
                   remaining={player.potionCooldown ?? 0} unavailable={potionUnavailable}
                   onInspect={() => { setPinnedSkillId(null); setHoveredSkillId(POTION_CARD_ID) }}
                   onLeave={() => setHoveredSkillId(null)}
                   onPin={() => setPinnedSkillId(POTION_CARD_ID)}
                   onUse={() => healingPotion && !potionUnavailable && send({ type: 'item',
                     itemInstanceId: healingPotion.instanceId, targetId: player.id })} />
               </div>
               {consumables.length ? <>
                 <select aria-label="Selecionar consumível" value={selectedItem?.instanceId ?? ''}
                   onChange={(event) => setSelectedConsumableId(event.target.value)}>
                   {consumables.map((item) => <option key={item.instanceId} value={item.instanceId}>{content.items[item.definitionId].name} ×{item.quantity}</option>)}
                 </select>
                 <button disabled={!itemUseful} onClick={() => selectedItem && send({ type: 'item', itemInstanceId: selectedItem.instanceId, targetId: player.id })}>USAR CONSUMÍVEL</button>
               </> : <span className="pixel-battle__potion-caption">Outros consumíveis não disponíveis.</span>}
             </>}
             {(['throwables', 'runes', 'essences'] as const).includes(menu as 'throwables' | 'runes' | 'essences') ? (() => {
              const kind = menu === 'throwables' ? 'throwable' : menu === 'runes' ? 'rune' : 'essence'
              const supplies = categoryItems(kind)
              return supplies.length ? supplies.map((instance) => {
                const item = content.items[instance.definitionId]
                const itemTargetId = item.combatTarget === 'enemy' ? target.id : player.id
                const useful = item.combatEffects.some((effect) =>
                  (effect.type === 'restoreHp' && player.hp < player.maxHp)
                  || (effect.type === 'restoreMp' && player.mp < player.maxMp)
                  || effect.type === 'damage' || effect.type === 'applyStatus' || effect.type === 'cleanseHarmful')
                return <button key={instance.instanceId} disabled={!useful || (item.combatTarget === 'enemy' && !target.alive)}
                  onClick={() => send({ type: 'item', itemInstanceId: instance.instanceId, targetId: itemTargetId })}>
                  {item.name} ×{instance.quantity} · {item.combatTarget === 'enemy' ? target.name : 'Terrírian'}</button>
              }) : <span>Você não possui {kind === 'throwable' ? 'arremessáveis' : kind === 'rune' ? 'runas de campo' : 'essências de combate'}. Encontre suprimentos em Terran.</span>
            })() : null}

          </div>}
        </> : battle.phase === 'Victory' ? <div className="pixel-battle__result">
          <p>+{battle.rewards.characterXp} XP · +{battle.rewards.gold} Ouro · {drops.length} drops</p>
          {!battle.claimed ? <button type="button" onClick={claim}>RECOLHER TODOS OS ESPÓLIOS</button> : <>
            {battle.waveIndex ? <button onClick={nextWave}>PRÓXIMA ONDA · {battle.waveIndex + 1}</button> :
              battle.portalHuntId ? null : <button onClick={() => end(false)}>{battle.clanTrialQuestId || battle.clanBossQuestId ? 'VOLTAR AO SALÃO DOS CLÃS' : 'CONTINUAR EXPEDIÇÃO'}</button>}
            <button onClick={() => end(true)}>{battle.portalHuntId ? 'VOLTAR AO PORTAL' : 'RETORNAR A TERRAN'}</button>
          </>}
        </div> : <div className="pixel-battle__result"><p>O Nexo retorna à Base. Sem perda de XP, Ouro ou equipamentos nesta versão.</p>
          <button onClick={() => end(true)}>DESPERTAR NA BASE</button></div>}
      </section>
      <section className="pixel-battle__panel pixel-battle__target">
        <h2>ALVO <button type="button" onClick={() => setShowLog(!showLog)} aria-expanded={showLog} aria-label="Abrir registro de combate"><ScrollText size={16} /></button></h2>
        {showLog ? <div className="pixel-battle__log" aria-live="polite">
          {battle.log.slice(-8).map((entry) => <p key={entry.id}>R{entry.round} · {entry.message}</p>)}
        </div> : <div className="pixel-battle__target-info">
          <AssetImage assetId={content.enemies[target.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} alt="" />
          <div><strong>{target.name}</strong>
            <div className="pixel-battle__meter hp" role="progressbar" aria-label="Vida do alvo" aria-valuenow={visualHp(target.id)} aria-valuemin={0} aria-valuemax={target.maxHp}><i style={{ width: clampPercent(visualHp(target.id), target.maxHp) + '%' }} /><span>VIDA {visualHp(target.id)} / {target.maxHp}</span></div></div>
        </div>}
        <p className="pixel-battle__hint"><Crosshair size={14} /> {battle.phase === 'Victory' ? 'Recolha tudo de uma vez e continue.' : battle.phase === 'Defeat' ? 'A expedição foi interrompida.' : 'Selecione um inimigo e escolha sua ação.'}</p>
      </section>
    </div>
    {potionInspected && <SkillTooltip skill={potionSkill} preview={previewCombatSkill(player, player, potionSkill, content)}
      remaining={player.potionCooldown ?? 0} unavailable={potionUnavailable}
      onClose={() => { setHoveredSkillId(null); setPinnedSkillId(null) }}
      onUse={() => { setHoveredSkillId(null); setPinnedSkillId(null)
        if (healingPotion && !potionUnavailable) send({ type: 'item', itemInstanceId: healingPotion.instanceId, targetId: player.id })
      }} />}
    {menu==='attack' && attackCards.find(a=>a.id===(pinnedSkillId??hoveredSkillId)) && (()=>{const attack=attackCards.find(a=>a.id===(pinnedSkillId??hoveredSkillId))!;return <SkillTooltip skill={attack} preview={previewCombatSkill(player,target,attack,content)} remaining={0}
      unavailable={!isPlayerTurn?'Aguarde seu turno':!target.alive?'Alvo indisponível':null}
      onClose={()=>{setHoveredSkillId(null);setPinnedSkillId(null)}}
      onUse={()=>{setHoveredSkillId(null);setPinnedSkillId(null);send(attack.id==='attack_single_v05141'?{type:'attack',targetId:target.id}:{type:'areaAttack',targetId:target.id})}}/>})()}
    {(menu === 'skills' || menu === 'magic') && inspectedSkill && <SkillTooltip skill={inspectedSkill}
      preview={previewCombatSkill(player, inspectedSkill.target === 'self' ? player : target, inspectedSkill, content)}
      remaining={player.skillCooldowns?.[inspectedSkill.id] ?? 0}
      unavailable={!isPlayerTurn ? 'Aguarde seu turno' :
        (player.skillCooldowns?.[inspectedSkill.id] ?? 0) > 0 ? 'Habilidade em recarga' :
          player.mp < inspectedSkill.mpCost ? 'Mana insuficiente' :
            inspectedSkill.target === 'enemy' && !target.alive ? 'Alvo indisponível' : null}
      onClose={() => { setPinnedSkillId(null); setHoveredSkillId(null) }}
      onUse={() => { const skillTargetId = inspectedSkill.target === 'self' ? player.id : target.id
        setPinnedSkillId(null); setHoveredSkillId(null)
        send({ type: 'skill', skillId: inspectedSkill.id, targetId: skillTargetId }) }} />}
  </section>

  return unified ? scene : <GameShell fluid immersive>{scene}</GameShell>
}

export function BattleScreen() { return <BattleScene /> }
