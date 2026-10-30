import { useEffect, useMemo, useRef, useState } from 'react'
import { Backpack, Bomb, Crosshair, Footprints, Gem, ScrollText, Shield, Sparkles, Swords, WandSparkles, Zap } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { boundSlotPreviewAssetIds } from '../../assets/assetRegistry'
import { BOUND_SLOTS } from '../../domain/shared/types'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { BattleArenaBackdrop } from '../battle/BattleArenaBackdrop'
import { BattleDicePlatform, type BattleDiceEvent } from '../battle/BattleDicePlatform'
import './battlePixel.css'

type Menu = 'skills' | 'items' | 'throwables' | 'magic' | 'runes' | 'essences' | null
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
  const [selectedConsumableId, setSelectedConsumableId] = useState('')
  const [collected, setCollected] = useState<number[]>([])
  const [hit, setHit] = useState<'player' | 'enemy' | null>(null)
  const [turnCue, setTurnCue] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [lastDice, setLastDice] = useState<BattleDiceEvent | null>(null)
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
    setCollected([])
    setMenu(null)
    setLastDice(null)
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
  const magicSkills = skills.filter((skill) =>
    /scepter|grimoire|staff|spore|arcane|magic|spell/i.test(skill.id))
  const selectedItem = consumables.find((item) => item.instanceId === selectedConsumableId) ?? consumables[0]
  const itemDefinition = selectedItem ? content.items[selectedItem.definitionId] : undefined
  const itemUseful = Boolean(itemDefinition?.combatEffects.some((effect) =>
    effect.type === 'restoreHp' && player.hp < player.maxHp
    || effect.type === 'restoreMp' && player.mp < player.maxMp
    || effect.type === 'cleanseHarmful' && player.statusEffects.some((status) => content.statusEffects[status.definitionId]?.tone === 'harmful'),
  ))
  const isPlayerTurn = battle.phase === 'AwaitingAction' && !turnCue
  const drops = battle.rewards.lootDefinitionIds
  const allPicked = collected.length === drops.length
  const activeWeapon = save.boundItems[save.character.bondedEquipment.weapon ?? '']

  const send = (command: Parameters<typeof submit>[0]) => {
    if (!isPlayerTurn) return
    const lastLogCount = battle.log.length
    setMenu(null)
    submit(command)
    if (command.type !== 'attack' && command.type !== 'skill') return
    const resolvedBattle = useGameStore.getState().save?.battle
    const playerDamage = resolvedBattle?.log.slice(lastLogCount).find((entry) =>
      entry.tone === 'damage' && entry.message.startsWith(`${player.name} causa `))
    const damage = playerDamage?.message.match(/ causa (\\d+) de dano /)
    if (!playerDamage || !damage) return
    const bondedWeapon = save.character.bondedEquipment.weapon
    const baseId = bondedWeapon ? save.boundItems[bondedWeapon]?.baseItemId : null
    const scaling = baseId ? content.boundItemBases[baseId]?.scalingAttribute ?? 'strength' : 'strength'
    const sides = save.character.attributes[scaling].die
    const face = playerDamage.id.split('').reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) % 2147483647, 17) % sides + 1
    setLastDice({
      id: playerDamage.id, sides, face, damage: Number(damage[1]),
      action: command.type === 'attack' ? 'Ataque da arma' : content.combatSkills[command.skillId]?.name ?? 'Habilidade',
    })
  }
  const end = (toCity: boolean) => {
    if (toCity) returnToTerran()
    else finishBattleIntoExpedition()
    if (!unified) navigate(toCity ? '/terran' : save.world.currentLocationId === FUNGAL_DUNGEON_ID ? '/dungeon' : '/expedition')
  }
  const button = (label: string, icon: React.ReactNode, onClick: () => void, disabled = false, selected = false) => (
    <button key={label} type="button" className={`pixel-battle__command ${selected ? 'is-selected' : ''}`} disabled={disabled} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  )

  const scene = <section className="pixel-battle" role="region" aria-label="Viewport unificada de combate">
    <header className="pixel-battle__header" aria-label="Encontro de combate">
      <strong>TERRÚNIA</strong>
      <div className="pixel-battle__encounter-label"><span>{battle.waveIndex ? 'PORTAL · ONDAS DA RUÍNA' : encounter?.locationLabel ?? 'ASTRAVÉL'}</span><h1>{encounter?.name ?? (battle.waveIndex ? 'ONDA ' + battle.waveIndex : 'COMBATE')}</h1></div>
      <small>{battle.waveIndex ? 'ONDA ' + battle.waveIndex + ' · ' : ''}RODADA {battle.round} · {turnCue ? 'TURNO DOS INIMIGOS' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : 'TURNO DO JOGADOR'}</small>
    </header>
    <main className="pixel-battle__arena" aria-label="Campo de batalha por turnos">
      <BattleArenaBackdrop dungeon={save.world.currentLocationId === FUNGAL_DUNGEON_ID} />
      <div className={`pixel-battle__hero ${hit === 'player' ? 'is-hit' : ''} ${!player.alive ? 'is-fallen' : ''}`}>
        <AssetImage assetId={save.character.portraitAssetId} alt={player.alive ? 'Terrírian em posição de batalha' : 'Terrírian derrotado'} />
      </div>
      <div className={`pixel-battle__enemies pixel-battle__enemies--${enemies.length}`}>
        {enemies.map((enemy, i) => <button type="button" key={enemy.id}
          className={`pixel-battle__enemy ${enemy.id === target.id ? 'is-target' : ''} ${!enemy.alive ? 'is-dead' : ''} ${hit === 'enemy' && enemy.id === target.id ? 'is-hit' : ''}`}
          onClick={() => enemy.alive && setTargetId(enemy.id)} disabled={!enemy.alive}
          aria-label={`Selecionar ${enemy.name} ${i + 1}, ${enemy.hp} de ${enemy.maxHp} de Vida`}
          aria-pressed={enemy.id === target.id}>
          {enemy.alive && enemy.id === target.id && <span className="pixel-battle__target-arrow" aria-hidden="true">◆</span>}
          <span className="pixel-battle__enemy-bar"><i style={{ width: clampPercent(enemy.hp, enemy.maxHp) + '%' }} /></span>
          <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} alt="" />
          <small>{enemy.name}</small>
        </button>)}
      </div>
      <div className="pixel-battle__turn-order" aria-label="Ordem de turnos">
        {battle.initiativeOrder.map((id) => {
          const actor = battle.combatants[id]
          return <span key={id} className={`${id === battle.actorId ? 'is-current' : ''} ${!actor.alive ? 'is-dead' : ''}`}
            title={actor.name}>{actor.side === 'player' ? '★' : '✦'}</span>
        })}
      </div>
      {lastDice && !defeated && <BattleDicePlatform roll={lastDice} reducedMotion={reducedMotion} />}
      {turnCue && !defeated && <div className="pixel-battle__turn-cue" role="status">TURNO DOS INIMIGOS</div>}
      {defeated && <div className="pixel-battle__death" role="status" aria-label="Terrírian derrotado">
        <div className="pixel-battle__death-aura" aria-hidden="true" />
        <div className="pixel-battle__death-character">
          <AssetImage assetId={save.character.portraitAssetId} alt="Personagem caindo ao perder toda a Vida" />
        </div>
        <strong>O TERRÍRIAN CAIU</strong>
        <small>Seu Nexo desperta na Base de Terran...</small>
        <button type="button" onClick={() => end(true)}>ACORDAR NA BASE</button>
      </div>}
      {battle.phase === 'Victory' && !battle.claimed && <div className="pixel-battle__drops" aria-label="Espólios disponíveis">
        <strong>CLIQUE PARA RECOLHER OS ESPÓLIOS</strong>
        {drops.map((id, index) => <button type="button" key={index} className={collected.includes(index) ? 'is-picked' : ''}
          onClick={() => setCollected((current) => current.includes(index) ? current : [...current, index])}
          disabled={collected.includes(index)} title={content.items[id]?.name ?? id}>
          <AssetImage assetId={content.items[id]?.iconAssetId ?? 'item.fungal-nucleus'} alt={content.items[id]?.name ?? id} />
          <span>{collected.includes(index) ? 'RECOLHIDO' : content.items[id]?.name ?? id}</span>
        </button>)}
      </div>}
    </main>
    <div className="pixel-battle__foot">
      <section className="pixel-battle__panel pixel-battle__stats">
        <h2>TERRÍRIAN</h2>
        <div className="pixel-battle__stat-body">
          <AssetImage assetId={save.character.portraitAssetId} alt="" className="pixel-battle__portrait" />
          <div>
            <strong>{player.name}</strong>
            <label>VIDA <span>{player.hp} / {player.maxHp}</span></label>
            <div className="pixel-battle__meter hp"><i style={{ width: clampPercent(player.hp, player.maxHp) + '%' }} /></div>
            <label>MANA <span>{player.mp} / {player.maxMp}</span></label>
            <div className="pixel-battle__meter mp"><i style={{ width: clampPercent(player.mp, player.maxMp) + '%' }} /></div>
          </div>
        </div>
        <div className="pixel-battle__equipment" aria-label="Cinco equipamentos vinculados">
          {BOUND_SLOTS.map((slot) => {
            const bondId = save.character.bondedEquipment[slot]
            const instance = bondId ? save.boundItems[bondId] : undefined
            const base = instance ? content.boundItemBases[instance.baseItemId] : undefined
            return <span key={slot} title={slot + (instance ? ' · grau ' + instance.grade : ' · vazio')}>
              <AssetImage assetId={base?.assetIdByGrade[instance?.grade ?? 1] ?? boundSlotPreviewAssetIds[slot]} alt={slot} />
            </span>
          })}
        </div>
        <small>Arma vinculada G{activeWeapon?.grade ?? 1} · {activeWeapon?.resonance ?? 0} R</small>
      </section>
      <section className="pixel-battle__panel pixel-battle__actions" aria-label="Ações de combate">
        <h2>{battle.phase === 'AwaitingAction' ? 'ESCOLHA SUA AÇÃO' : battle.phase === 'Victory' ? 'VITÓRIA' : battle.phase === 'Defeat' ? 'DERROTA' : 'COMBATE'}</h2>
        {battle.phase === 'AwaitingAction' ? <>
          <div className="pixel-battle__commands">
            {button('ATACAR', <Swords />, () => send({ type: 'attack', targetId: target.id }), !isPlayerTurn || !target.alive)}
            {button('HABILIDADES', <Sparkles />, () => setMenu(menu === 'skills' ? null : 'skills'), !isPlayerTurn, menu === 'skills')}
            {button('ARREMESSÁVEIS', <Bomb />, () => setMenu(menu === 'throwables' ? null : 'throwables'), !isPlayerTurn, menu === 'throwables')}
            {button('MAGIAS', <WandSparkles />, () => setMenu(menu === 'magic' ? null : 'magic'), !isPlayerTurn, menu === 'magic')}
            {button('RUNAS', <Gem />, () => setMenu(menu === 'runes' ? null : 'runes'), !isPlayerTurn, menu === 'runes')}
            {button('ESSÊNCIAS', <Zap />, () => setMenu(menu === 'essences' ? null : 'essences'), !isPlayerTurn, menu === 'essences')}
            {button('ITENS / POÇÕES', <Backpack />, () => setMenu(menu === 'items' ? null : 'items'), !isPlayerTurn, menu === 'items')}
            {button('DEFENDER', <Shield />, () => send({ type: 'defend' }), !isPlayerTurn)}
            {button('FUGIR', <Footprints />, () => send({ type: 'flee' }), !isPlayerTurn || !battle.canFlee)}
          </div>
          {menu && <div className="pixel-battle__submenu">
            <button type="button" aria-label="Fechar opções" onClick={() => setMenu(null)}>×</button>
            {menu === 'skills' ? skills.length ? skills.map((skill) =>
              <button key={skill.id} disabled={player.mp < skill.mpCost || (skill.target === 'enemy' && !target.alive)}
                onClick={() => send({ type: 'skill', skillId: skill.id, targetId: skill.target === 'self' ? player.id : target.id })}>
                {skill.name} · {skill.mpCost} MP</button>) : <span>Nenhuma habilidade desbloqueada.</span> : null}
            {menu === 'items' ? consumables.length ? <><select aria-label="Selecionar consumível" value={selectedItem?.instanceId ?? ''}
              onChange={(event) => setSelectedConsumableId(event.target.value)}>
              {consumables.map((item) => <option key={item.instanceId} value={item.instanceId}>{content.items[item.definitionId].name} ×{item.quantity}</option>)}
            </select><button disabled={!itemUseful} onClick={() => selectedItem && send({ type: 'item', itemInstanceId: selectedItem.instanceId, targetId: player.id })}>USAR POÇÃO</button></> :
              <span>Sem consumíveis disponíveis.</span> : null}
            {menu === 'magic' ? magicSkills.length ? magicSkills.map((skill) =>
              <button key={skill.id} disabled={player.mp < skill.mpCost || (skill.target === 'enemy' && !target.alive)}
                onClick={() => send({ type: 'skill', skillId: skill.id, targetId: skill.target === 'self' ? player.id : target.id })}>
                {skill.name} · {skill.mpCost} MP</button>) : <span>Desbloqueie habilidades mágicas pelo seu Vínculo para utilizá-las.</span> : null}
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
          {!battle.claimed ? <button disabled={!allPicked} onClick={claim}>{allPicked ? 'CONFIRMAR RECOMPENSAS' : 'RECOLHA TODOS OS ITENS'}</button> : <>
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
        <p className="pixel-battle__hint"><Crosshair size={14} /> {battle.phase === 'Victory' ? 'Recolha os espólios antes de sair.' : battle.phase === 'Defeat' ? 'A expedição foi interrompida.' : 'Selecione um inimigo e escolha sua ação.'}</p>
      </section>
    </div>
  </section>

  return unified ? scene : <GameShell fluid immersive>{scene}</GameShell>
}

export function BattleScreen() { return <BattleScene /> }
