import { useEffect, useMemo, useRef, useState } from 'react'
import { Backpack, Bomb, Crosshair, Footprints, Gem, ScrollText, Shield, Swords, Zap } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { submitBattleCommand as previewBattleCommand } from '../../domain/combat/engine'
import type { BattleCommand } from '../../domain/combat/types'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { useGameStore } from '../../state/gameStore'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { CharacterPortrait } from '../characters/CharacterSprite'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { BattleArenaBackdrop } from '../battle/BattleArenaBackdrop'
import { BattleEquipmentHud } from '../battle/BattleEquipmentHud'
import { BattleDicePlatform, type BattleDiceEvent } from '../battle/BattleDicePlatform'
import { DraggableBattleDie } from '../battle/DraggableBattleDie'
import { BattleTimeline } from '../battle/BattleTimeline'
import { BATTLE_PRESENTATION } from '../battle/presentationTiming'
import { groupBattleLoot } from '../../domain/inventory/battleLoot'
import './battlePixel.css'
import './battleRemake.css'
import './battleTimeline.css'
import './battleCinematic.css'
import './gameplayV057.css'

type Menu = 'combat' | 'items' | 'throwables' | 'runes' | 'essences' | null
const clampPercent = (value: number, max: number) => max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0

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
  const [pendingCommand, setPendingCommand] = useState<BattleCommand | null>(null)
  const [selectedConsumableId, setSelectedConsumableId] = useState('')
  const [hit, setHit] = useState<'player' | 'enemy' | null>(null)
  const [turnCue, setTurnCue] = useState(false)
  const [roundCurtain, setRoundCurtain] = useState<string | null>(null)
  const announcedRound = useRef<{ battleId: string; round: number } | null>(null)
  const [showLog, setShowLog] = useState(false)
  const [activeDice, setActiveDice] = useState<BattleDiceEvent | null>(null)
  const [diceQueue, setDiceQueue] = useState<BattleDiceEvent[]>([])
  const [resolvingRolls, setResolvingRolls] = useState(false)
  const [diceAwaitingClick, setDiceAwaitingClick] = useState(false)
  const [initiativeReady, setInitiativeReady] = useState(false)
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null)
  const [strikeFx, setStrikeFx] = useState<{ actorId: string; targetId: string; style: 'arcane' | 'projectile' | 'slash' } | null>(null)
  const pendingRollsRef = useRef<{ rolls: BattleDiceEvent[]; cursor: number; commit: () => void } | null>(null)
  const previewTimer = useRef<number | null>(null)
  const seenDiceLog = useRef<{ id: string; count: number } | null>(null)
  const previous = useRef<{ id: string; hp: Record<string, number> } | null>(null)
  const reducedMotion = Boolean(save?.settings.reducedMotion)
  const defeated = battle?.phase === 'Defeat' && player?.hp === 0

  useEffect(() => {
    if (!defeated) return
    const timer = window.setTimeout(() => returnToTerran(), reducedMotion ? 600 : 2800)
    return () => window.clearTimeout(timer)
  }, [battle?.id, defeated, reducedMotion, returnToTerran])

  useEffect(() => {
    if (!enemies.some((enemy) => enemy.id === targetId && enemy.alive)) {
      setTargetId(enemies.find((enemy) => enemy.alive)?.id ?? '')
    }
  }, [enemies, targetId])
  useEffect(() => {
    setMenu(null)
    setPendingCommand(null)
    setActiveDice(null)
    setDiceQueue([])
    setResolvingRolls(false)
    setDiceAwaitingClick(false)
    setInitiativeReady(false)
    setRoundCurtain(null)
    setStrikeFx(null)
    announcedRound.current = null
    setHoveredEnemyId(null)
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
        actorId: entry.roll.actorId, targetId: actor?.side === 'enemy' ? 'combatant_player' : targetId,
        damage: Number(damage[1]), action: entry.roll.action,
        actorName: actor?.name ?? 'Combatente', actorSide: actor?.side ?? 'enemy',
      }]
    })
    if (incoming.length) setDiceQueue((queue) => [...queue, ...incoming])
  }, [battle])

  useEffect(() => {
    if (activeDice || !diceQueue.length) return
    setActiveDice(diceQueue[0])
    setDiceQueue((queue) => queue.slice(1))
  }, [activeDice, diceQueue])

  useEffect(() => {
    if (!activeDice || resolvingRolls) return
    const timer = window.setTimeout(() => setActiveDice(null), reducedMotion ? BATTLE_PRESENTATION.reducedMotionDieMs : BATTLE_PRESENTATION.queuedDieMs)
    return () => window.clearTimeout(timer)
  }, [activeDice, reducedMotion, resolvingRolls])

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

  // Visual strikes are keyed to the actual logged roll, never to invented damage.
  useEffect(() => {
    setStrikeFx(null)
    if (!activeDice || activeDice.kind !== 'damage' || diceAwaitingClick || reducedMotion) return
    const action = activeDice.action.toLowerCase()
    const style = /arco|bow|flecha|arremess|projectile/i.test(action) ? 'projectile'
      : /arcano|magic|magia|arcane|runa|scepter|staff|grimoire|spell/i.test(action) ? 'arcane'
      : 'slash'
    const fx = { actorId: activeDice.actorId ?? (activeDice.actorSide === 'enemy' ? '' : 'combatant_player'),
      targetId: activeDice.targetId ?? (activeDice.actorSide === 'enemy' ? 'combatant_player' : ''),
      style } as const
    const start = window.setTimeout(() => setStrikeFx(fx), BATTLE_PRESENTATION.dieSpinMs)
    const stop = window.setTimeout(() => setStrikeFx(null), BATTLE_PRESENTATION.dieSpinMs + 710)
    return () => { window.clearTimeout(start); window.clearTimeout(stop) }
  }, [activeDice, diceAwaitingClick, reducedMotion])

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

  const target = enemies.find((enemy) => enemy.id === targetId && enemy.alive) ?? enemies.find((enemy) => enemy.alive) ?? enemies[0]
  const encounter = content.encounters[battle.encounterId]
  const skills = player.skillIds.map((id) => content.combatSkills[id]).filter((skill) => Boolean(skill))
  const consumables = save.inventory.filter((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.category === 'consumable' && definition.combatEffects.length > 0 && !definition.combatKind
  })
  const categoryItems = (kind: 'throwable' | 'rune' | 'essence') =>
    save.inventory.filter((instance) => content.items[instance.definitionId]?.combatKind === kind)
  const isMagicSkill = (id: string) => /scepter|grimoire|staff|spore|arcane|magic|spell/i.test(id)
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
  const hasUsableConsumable = consumables.some((item) => content.items[item.definitionId].combatEffects.some((effect) =>
    (effect.type === 'restoreHp' && player.hp < player.maxHp) ||
    (effect.type === 'restoreMp' && player.mp < player.maxMp) ||
    (effect.type === 'cleanseHarmful' && player.statusEffects.some((status) =>
      content.statusEffects[status.definitionId]?.tone === 'harmful'))))
  const isPlayerTurn = battle.phase === 'AwaitingAction' && !roundCurtain && !turnCue && !activeDice && !diceQueue.length && !resolvingRolls
  const drops = battle.rewards.lootDefinitionIds
  const lootGroups = groupBattleLoot(drops)

  // Queue visual rolls before committing the pure deterministic preview to the save.
  const scheduleRollStep = () => {
    previewTimer.current = window.setTimeout(() => {
      const sequence = pendingRollsRef.current
      if (!sequence) return
      sequence.cursor += 1
      if (sequence.cursor >= sequence.rolls.length) {
        pendingRollsRef.current = null
        previewTimer.current = null
        setActiveDice(null)
        setDiceAwaitingClick(false)
        setResolvingRolls(false)
        sequence.commit()
        return
      }
      const next = sequence.rolls[sequence.cursor]
      setActiveDice(next)
      const playerMustClick = next.actorSide === 'player' && next.kind !== 'initiative'
      setDiceAwaitingClick(playerMustClick)
      if (!playerMustClick) scheduleRollStep()
    }, reducedMotion ? BATTLE_PRESENTATION.reducedMotionDieMs : BATTLE_PRESENTATION.queuedDieMs)
  }
  const releasePlayerDie = () => {
    if (!diceAwaitingClick || !pendingRollsRef.current) return
    setDiceAwaitingClick(false)
    scheduleRollStep()
  }
  const send = (command: Parameters<typeof submit>[0]) => {
    const initiative = command.type === 'rollInitiative'
    if (initiative ? battle.phase !== 'AwaitingInitiative' || !initiativeReady || Boolean(roundCurtain) : !isPlayerTurn) return
    setMenu(null)
    setPendingCommand(null)
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
        actorId: roll.actorId, targetId: actor?.side === 'enemy' ? player.id : target.id,
        action: roll.action, kind: 'damage' as const,
        actorName: actor?.name ?? 'Combatente', actorSide: actor?.side ?? 'enemy' as const,
      }]
    })
    if (!rolls.length) { submit(command); return }
    setResolvingRolls(true)
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
    if (!requireClick) scheduleRollStep()
  }
  const openMenu = (next: Menu) => {
    setPendingCommand(null)
    setMenu(menu === next ? null : next)
  }
  const confirmPending = () => {
    if (!pendingCommand || !isPlayerTurn) return
    if (pendingCommand.type === 'attack') send({ type: 'attack', targetId: target.id })
    else if (pendingCommand.type === 'skill') {
      const skill = content.combatSkills[pendingCommand.skillId]
      if (skill) send({ ...pendingCommand, targetId: skill.target === 'self' ? player.id : target.id })
    } else if (pendingCommand.type === 'item') {
      const item = save.inventory.find((candidate) => candidate.instanceId === pendingCommand.itemInstanceId)
      const definition = item ? content.items[item.definitionId] : undefined
      if (definition) send({ ...pendingCommand, targetId: definition.combatTarget === 'enemy' ? target.id : player.id })
    }
  }
  const end = (toCity: boolean) => {
    if (toCity) returnToTerran()
    else finishBattleIntoExpedition()
    if (!unified) navigate(toCity ? '/terran' : save.world.currentLocationId === FUNGAL_DUNGEON_ID ? '/dungeon' : '/expedition')
  }
  const button = (label: string, icon: React.ReactNode, onClick: () => void, disabled = false, selected = false) => (
    <button key={label} type="button"
      className={`pixel-battle__command ${label.startsWith('ATAQUE') ? 'is-primary' : ''} ${selected ? 'is-selected' : ''}`}
      disabled={disabled} aria-disabled={disabled} title={disabled ? `${label}: ação indisponível` : label}
      onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  )

  const scene = <section className={`pixel-battle ${activeDice ? "pixel-battle--dice-pending" : ""} ${diceAwaitingClick ? "pixel-battle--dice-awaiting" : ""}`} role="region" aria-label="Viewport unificada de combate">
    <header className="pixel-battle__header" aria-label="Encontro de combate">
      <strong>TERRÚNIA</strong>
      <div className="pixel-battle__encounter-label"><span>{battle.waveIndex ? 'PORTAL · ONDAS DA RUÍNA' : encounter?.locationLabel ?? 'ASTRAVÉL'}</span><h1>{encounter?.name ?? (battle.waveIndex ? 'ONDA ' + battle.waveIndex : 'COMBATE')}</h1></div>
      <small>{battle.waveIndex ? 'ONDA ' + battle.waveIndex + ' · ' : ''}RODADA {battle.round} · {turnCue ? 'TURNO DOS INIMIGOS' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : battle.phase === 'AwaitingInitiative' ? 'INICIATIVA PENDENTE' : 'TURNO DO JOGADOR'}</small>
    </header>
    <BattleTimeline battle={battle} playerAppearance={save.character.appearance} playerPortraitAssetId={save.character.portraitAssetId} />
    <main className="pixel-battle__arena" aria-label="Campo de batalha por turnos">
      <BattleArenaBackdrop dungeon={save.world.currentLocationId === FUNGAL_DUNGEON_ID} />
      <div className={`pixel-battle__hero ${hit === 'player' ? 'is-hit' : ''} ${!player.alive ? 'is-fallen' : ''} ${strikeFx?.actorId === player.id ? 'is-striking' : ''} ${strikeFx?.targetId === player.id ? 'is-strike-target' : ''}`}>
        <EquippedCharacter save={save} facing="right" alt={player.alive ? 'Terrírian voltado para os inimigos' : 'Terrírian derrotado'} />
      </div>
      <div className={`pixel-battle__enemies pixel-battle__enemies--${enemies.length}`}>
        {enemies.map((enemy, i) => <button type="button" key={enemy.id}
          className={`pixel-battle__enemy ${enemy.id === target.id ? 'is-target' : ''} ${!enemy.alive ? 'is-dead' : ''} ${hit === 'enemy' && enemy.id === target.id ? 'is-hit' : ''} ${strikeFx?.actorId === enemy.id ? 'is-striking' : ''} ${strikeFx?.targetId === enemy.id ? 'is-strike-target' : ''}`}
          onClick={() => enemy.alive && setTargetId(enemy.id)} disabled={!enemy.alive}
          onMouseEnter={() => setHoveredEnemyId(enemy.id)} onMouseLeave={() => setHoveredEnemyId(null)}
          onFocus={() => setHoveredEnemyId(enemy.id)} onBlur={() => setHoveredEnemyId(null)}
          aria-describedby={hoveredEnemyId === enemy.id ? 'enemy-status-' + i : undefined}
          aria-label={`Selecionar ${enemy.name} ${i + 1}, ${enemy.hp} de ${enemy.maxHp} de Vida`}
          aria-pressed={enemy.id === target.id}>
          {enemy.alive && enemy.id === target.id && <span className="pixel-battle__target-arrow" aria-hidden="true">◆</span>}
          <span className="pixel-battle__enemy-bar"><i style={{ width: clampPercent(enemy.hp, enemy.maxHp) + '%' }} /></span>
          <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} alt="" />
          <small>{enemy.name}</small>
          {hoveredEnemyId === enemy.id && <span className="pixel-battle__enemy-tooltip" role="tooltip"
            aria-label={'Status de ' + enemy.name} id={'enemy-status-' + i}>
            <strong>{enemy.name}</strong>
            <span>Vida: {enemy.hp}/{enemy.maxHp} · Mana: {enemy.mp}/{enemy.maxMp}</span>
            <span>Ataque: {enemy.attackPower} · Defesa: {enemy.mitigation}</span>
            <span>Iniciativa: {enemy.initiative} · Dado d{enemy.attackDie ?? 4}</span>
            <span>{enemy.statusEffects.length ? enemy.statusEffects.map((status) =>
              content.statusEffects[status.definitionId]?.name ?? status.definitionId).join(', ') : 'Sem efeitos ativos'}</span>
          </span>}
        </button>)}
      </div>
      {roundCurtain && !activeDice && <div className="pixel-battle__round-curtain" role="status" aria-label="Separador de turno">
        <span>✧</span><strong>{roundCurtain}</strong>
      </div>}
      {activeDice && <BattleDicePlatform key={activeDice.id} roll={activeDice} reducedMotion={reducedMotion}
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
            <label>VIDA <span>{player.hp} / {player.maxHp}</span></label>
            <div className="pixel-battle__meter hp"><i style={{ width: clampPercent(player.hp, player.maxHp) + '%' }} /></div>
            <label>MANA <span>{player.mp} / {player.maxMp}</span></label>
            <div className="pixel-battle__meter mp"><i style={{ width: clampPercent(player.mp, player.maxMp) + '%' }} /></div>
          </div>
        </div>
        <BattleEquipmentHud save={save} />
      </section>
      <section className="pixel-battle__panel pixel-battle__actions" aria-label="Ações de combate">
        <h2>{diceAwaitingClick ? 'LANCE SEU DADO' : battle.phase === 'AwaitingInitiative' ? 'ROLAGEM DE INICIATIVA' : battle.phase === 'AwaitingAction' ? 'ESCOLHA SUA AÇÃO' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : 'COMBATE'}</h2>
        {diceAwaitingClick && activeDice && <DraggableBattleDie key={activeDice.id} sides={activeDice.sides}
          onThrow={releasePlayerDie} ariaLabel={`Arrastar dado d${activeDice.sides} para cima para rolar`} />}
        {battle.phase === 'AwaitingInitiative' ? <div className="pixel-battle__initiative" aria-label="Preparar rolagem de iniciativa">
          <strong>{initiativeReady ? 'ROLAGEM DE INICIATIVA' : 'TURNO ' + battle.round}</strong>
          <DraggableBattleDie sides={player.initiativeDie ?? 4}
            disabled={!initiativeReady || resolvingRolls || Boolean(roundCurtain)} ariaLabel={`Arrastar dado de iniciativa d${player.initiativeDie ?? 4} para cima para rolar`}
            onThrow={() => send({ type: 'rollInitiative' })} />
          <small>Seu dado de Agilidade define a ordem junto à iniciativa-base. Monstros rolam automaticamente.</small>
        </div> : battle.phase === 'AwaitingAction' ? <>
          <div className="pixel-battle__commands">
            {button('ATAQUE · MAGIAS · HABILIDADES', <Swords />, () => openMenu('combat'),
              !isPlayerTurn || !target.alive, menu === 'combat')}
            {button('ARREMESSÁVEIS', <Bomb />, () => openMenu('throwables'),
              !isPlayerTurn || !hasUsefulSupplies('throwable'), menu === 'throwables')}
            {button('RUNAS', <Gem />, () => openMenu('runes'),
              !isPlayerTurn || !hasUsefulSupplies('rune'), menu === 'runes')}
            {button('ESSÊNCIAS', <Zap />, () => openMenu('essences'),
              !isPlayerTurn || !hasUsefulSupplies('essence'), menu === 'essences')}
            {button('ITENS / POÇÕES', <Backpack />, () => openMenu('items'),
              !isPlayerTurn || !hasUsableConsumable, menu === 'items')}
            {button('DEFENDER', <Shield />, () => send({ type: 'defend' }), !isPlayerTurn)}
            {/* The domain explicitly returns FLEE_NOT_IMPLEMENTED; never display it as actionable. */}
            {button('FUGIR', <Footprints />, () => {}, true)}
          </div>
          {menu && <div className="pixel-battle__submenu">
            <button type="button" aria-label="Voltar sem executar a ação" onClick={() => { setPendingCommand(null); setMenu(null) }}>VOLTAR</button>
            {pendingCommand && <div className="pixel-battle__pending-action" role="status">
              <strong>CONFIRMAR AÇÃO</strong>
              <small>{pendingCommand.type === 'attack' ? `Ataque básico em ${target.name}` :
                pendingCommand.type === 'skill' ? `${content.combatSkills[pendingCommand.skillId]?.name ?? 'Habilidade'} · ${content.combatSkills[pendingCommand.skillId]?.mpCost ?? 0} MP` :
                pendingCommand.type === 'item' ? `Usar ${content.items[save.inventory.find((item) => item.instanceId === pendingCommand.itemInstanceId)?.definitionId ?? '']?.name ?? 'Item'}` : 'Ação selecionada'}.
                Selecione o alvo e confirme; Voltar não gasta turno nem recursos.</small>
              <button type="button" disabled={!isPlayerTurn || (pendingCommand.type !== 'item' && pendingCommand.type !== 'skill' && !target.alive)}
                onClick={confirmPending}>CONFIRMAR AÇÃO</button>
            </div>}
            {menu === 'combat' && <>
              <strong className="pixel-battle__submenu-heading">ATAQUE · MAGIAS · HABILIDADES</strong>
              <button type="button" disabled={!isPlayerTurn || !target.alive}
                onClick={() => setPendingCommand({ type: 'attack', targetId: target.id })}><Swords size={17} /> ATAQUE BÁSICO · 0 MP</button>
              {skills.map((skill) => {
                const remaining = player.skillCooldowns?.[skill.id] ?? 0
                return <button key={skill.id}
                  disabled={!isPlayerTurn || remaining > 0 || player.mp < skill.mpCost || (skill.target === 'enemy' && !target.alive)}
                  title={remaining > 0 ? `${skill.name}: ${remaining} turno(s) para reutilizar` : `${skill.name}: ${skill.mpCost} MP, recarga ${skill.cooldownTurns ?? 0} turno(s)`}
                  onClick={() => setPendingCommand({ type: 'skill', skillId: skill.id, targetId: skill.target === 'self' ? player.id : target.id })}>
                  {isMagicSkill(skill.id) ? 'MAGIA' : 'HABILIDADE'} · {skill.name} · {skill.mpCost} MP ·
                  {remaining > 0 ? ` Recarga: ${remaining} turno(s)` : ` d+${skill.damageDieSteps ?? 0} · recarga ${skill.cooldownTurns ?? 0}`}
                </button>
              })}
              {skills.length === 0 && <small>Habilidades e magias serão liberadas pela progressão e pelo Vínculo.</small>}
            </>}
            {menu === 'items' ? consumables.length ? <><select aria-label="Selecionar consumível" value={selectedItem?.instanceId ?? ''}
              onChange={(event) => setSelectedConsumableId(event.target.value)}>
              {consumables.map((item) => <option key={item.instanceId} value={item.instanceId}>{content.items[item.definitionId].name} ×{item.quantity}</option>)}
            </select><button disabled={!itemUseful} onClick={() => selectedItem && setPendingCommand({ type: 'item', itemInstanceId: selectedItem.instanceId, targetId: player.id })}>SELECIONAR POÇÃO</button></> :
              <span>Sem consumíveis disponíveis.</span> : null}
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
                  onClick={() => setPendingCommand({ type: 'item', itemInstanceId: instance.instanceId, targetId: itemTargetId })}>
                  {item.name} ×{instance.quantity} · {item.combatTarget === 'enemy' ? target.name : 'Terrírian'}</button>
              }) : <span>Você não possui {kind === 'throwable' ? 'arremessáveis' : kind === 'rune' ? 'runas de campo' : 'essências de combate'}. Encontre suprimentos em Terran.</span>
            })() : null}

          </div>}
        </> : battle.phase === 'Victory' ? <div className="pixel-battle__result">
          <p>+{battle.rewards.characterXp} XP · +{battle.rewards.gold} Ouro · {drops.length} drops</p>
          {!battle.claimed ? <button type="button" onClick={claim}>RECOLHER TODOS OS ESPÓLIOS</button> : <>
            {battle.waveIndex ? <button onClick={nextWave}>PRÓXIMA ONDA · {battle.waveIndex + 1}</button> :
              battle.portalHuntId ? null : <button onClick={() => end(false)}>CONTINUAR EXPEDIÇÃO</button>}
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
          <div><strong>{target.name}</strong><span>{target.hp} / {target.maxHp} PV</span>
            <div className="pixel-battle__meter hp"><i style={{ width: clampPercent(target.hp, target.maxHp) + '%' }} /></div></div>
        </div>}
        <p className="pixel-battle__hint"><Crosshair size={14} /> {battle.phase === 'Victory' ? 'Recolha tudo de uma vez e continue.' : battle.phase === 'Defeat' ? 'A expedição foi interrompida.' : 'Selecione um inimigo e escolha sua ação.'}</p>
      </section>
    </div>
  </section>

  return unified ? scene : <GameShell fluid immersive>{scene}</GameShell>
}

export function BattleScreen() { return <BattleScene /> }
