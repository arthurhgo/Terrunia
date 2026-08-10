import { useEffect, useMemo, useState } from 'react'
import {
  Backpack,
  Crosshair,
  Footprints,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { Combatant } from '../../domain/combat/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

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

export function BattleScreen() {
  const save = useGameStore((state) => state.save)
  const submit = useGameStore((state) => state.submitBattleCommand)
  const claim = useGameStore((state) => state.claimBattleRewards)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const navigate = useNavigate()

  const battle = save?.battle
  const enemies = useMemo(
    () => battle
      ? Object.values(battle.combatants).filter((combatant) => combatant.side === 'enemy')
      : [],
    [battle],
  )
  const firstLivingEnemyId = enemies.find((enemy) => enemy.alive)?.id ?? ''
  const [selectedTargetId, setSelectedTargetId] = useState(firstLivingEnemyId)

  useEffect(() => {
    const selected = enemies.find((enemy) => enemy.id === selectedTargetId)
    if (!selected?.alive && firstLivingEnemyId) setSelectedTargetId(firstLivingEnemyId)
  }, [enemies, firstLivingEnemyId, selectedTargetId])

  if (!save?.battle) return <Navigate to="/terran" replace />
  const activeBattle = save.battle
  const player = Object.values(activeBattle.combatants).find(
    (combatant) => combatant.side === 'player',
  )
  if (!player || enemies.length === 0) return <Navigate to="/terran" replace />

  const selectedEnemy = enemies.find((enemy) => enemy.id === selectedTargetId) ?? enemies[0]
  const encounter = content.encounters[activeBattle.encounterId]
  const activeWeapon = save.boundItems[save.character.bondedEquipment.weapon ?? '']
  const playerSkills = player.skillIds
    .map((skillId) => content.combatSkills[skillId])
    .filter((skill) => Boolean(skill))
  const activeSkill = playerSkills[0]
  const usableConsumables = save.inventory.filter((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.category === 'consumable' && definition.combatEffects.length > 0
  })
  const activeConsumable = usableConsumables[0]
  const activeConsumableDefinition = activeConsumable
    ? content.items[activeConsumable.definitionId]
    : undefined

  const leave = () => {
    returnToTerran()
    navigate('/terran')
  }

  const attack = () => {
    if (selectedEnemy?.alive) submit({ type: 'attack', targetId: selectedEnemy.id })
  }
  const useSkill = () => {
    if (activeSkill && selectedEnemy?.alive) {
      submit({ type: 'skill', skillId: activeSkill.id, targetId: selectedEnemy.id })
    }
  }
  const useItem = () => {
    if (activeConsumable) {
      submit({
        type: 'item',
        itemInstanceId: activeConsumable.instanceId,
        targetId: player.id,
      })
    }
  }

  return (
    <GameShell fluid>
      <div className="battle-screen">
        <header className="battle-topline">
          <div><span>Local</span><strong>{encounter?.locationLabel ?? 'Astravél'}</strong></div>
          <div><span>Encontro</span><strong>{encounter?.name ?? activeBattle.encounterId}</strong></div>
          <div><span>Rodada</span><strong>{activeBattle.round}</strong></div>
          <div><span>Estado</span><strong>{activeBattle.phase}</strong></div>
        </header>

        <div className="battle-layout">
          <ArcanePanel title={player.name} eyebrow="TERRÍRIAN" className="combatant-panel combatant-panel--player">
            <AssetImage assetId={save.character.portraitAssetId} />
            <ProgressBar value={player.hp} max={player.maxHp} label="Vida" tone="health" />
            <ProgressBar value={player.mp} max={player.maxMp} label="Mana" />
            <dl className="combat-stats">
              <div><dt>Ataque</dt><dd>{player.attackPower}</dd></div>
              <div><dt>Mitigação</dt><dd>{player.mitigation}</dd></div>
              <div><dt>Iniciativa</dt><dd>{player.initiative}</dd></div>
            </dl>
            <StatusList combatant={player} />
            <div className="active-bound-mini"><Swords size={19} /><span>Arma vinculada<strong>Grau {activeWeapon?.grade ?? 1} · {activeWeapon?.resonance ?? 0} R</strong></span></div>
          </ArcanePanel>

          <section className="battlefield" aria-label="Campo de batalha">
            <div className="battlefield__mist" aria-hidden="true" />
            <div className="battle-character battle-character--player">
              <AssetImage assetId={save.character.portraitAssetId} />
              <span>{player.name}</span>
            </div>
            <div className={`battle-enemy-party battle-enemy-party--${enemies.length}`}>
              {enemies.map((enemy, index) => (
                <button
                  key={enemy.id}
                  type="button"
                  className={`battle-enemy ${content.enemies[enemy.definitionId]?.boss ? 'battle-enemy--boss' : ''} ${!enemy.alive ? 'defeated' : ''} ${selectedEnemy?.id === enemy.id ? 'selected' : ''}`}
                  onClick={() => enemy.alive && setSelectedTargetId(enemy.id)}
                  disabled={!enemy.alive}
                  aria-label={`Selecionar alvo ${enemy.name} ${index + 1}`}
                  aria-pressed={selectedEnemy?.id === enemy.id}
                >
                  <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
                  <span>{enemy.name}</span>
                  <i><b style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} /></i>
                  {selectedEnemy?.id === enemy.id && enemy.alive && <Crosshair size={18} />}
                </button>
              ))}
            </div>
            <div className="turn-orbit"><span>{activeBattle.round}</span><small>RODADA</small></div>
          </section>

          <ArcanePanel title="Inimigos" eyebrow="ALVOS E INICIATIVA" className="combatant-panel enemy-roster-panel">
            <div className="enemy-roster">
              {enemies.map((enemy, index) => (
                <button
                  key={enemy.id}
                  type="button"
                  className={selectedEnemy?.id === enemy.id ? 'selected' : ''}
                  onClick={() => enemy.alive && setSelectedTargetId(enemy.id)}
                  disabled={!enemy.alive}
                >
                  <span>{index + 1}</span>
                  <div><strong>{enemy.name}</strong><small>{enemy.hp}/{enemy.maxHp} Vida</small></div>
                  {enemy.alive ? <Crosshair size={15} /> : <span>×</span>}
                </button>
              ))}
            </div>
            {selectedEnemy && (
              <div className="target-inspector">
                <AssetImage assetId={content.enemies[selectedEnemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
                <p className="eyebrow">ALVO SELECIONADO</p>
                <strong>{selectedEnemy.name}</strong>
                <ProgressBar value={selectedEnemy.hp} max={selectedEnemy.maxHp} label="Vida" tone="health" />
                <StatusList combatant={selectedEnemy} />
              </div>
            )}
            <div className="initiative-strip" aria-label="Ordem de iniciativa">
              {activeBattle.initiativeOrder.map((combatantId, index) => {
                const combatant = activeBattle.combatants[combatantId]
                return (
                  <span key={combatantId} className={activeBattle.actorId === combatantId ? 'active' : ''}>
                    {index + 1}. {combatant.name}
                  </span>
                )
              })}
            </div>
          </ArcanePanel>
        </div>

        {activeBattle.phase === 'AwaitingAction' && (
          <div className="battle-command-bar">
            <GameButton variant="primary" onClick={attack} disabled={!selectedEnemy?.alive}>
              <Swords size={18} /> Atacar
            </GameButton>
            <GameButton
              variant="secondary"
              onClick={useSkill}
              disabled={!activeSkill || player.mp < (activeSkill?.mpCost ?? 0) || !selectedEnemy?.alive}
              title={activeSkill?.description}
            >
              <Sparkles size={18} /> {activeSkill ? `${activeSkill.name} · ${activeSkill.mpCost} MP` : 'Habilidade bloqueada'}
            </GameButton>
            <GameButton variant="secondary" onClick={() => submit({ type: 'defend' })}>
              <Shield size={18} /> Defender
            </GameButton>
            <GameButton
              variant="ghost"
              onClick={useItem}
              disabled={!activeConsumable || player.hp >= player.maxHp}
              title={activeConsumableDefinition?.description}
            >
              <Backpack size={18} /> {activeConsumableDefinition?.name ?? 'Sem consumível'}
            </GameButton>
            <GameButton variant="ghost" onClick={() => submit({ type: 'flee' })} disabled={!activeBattle.canFlee}>
              <Footprints size={18} /> Fugir
            </GameButton>
          </div>
        )}

        {activeBattle.phase === 'Victory' && (
          <div className="battle-result battle-result--victory">
            <Sparkles size={26} />
            <div><p className="eyebrow">VITÓRIA</p><h2>{encounter?.victoryTitle ?? 'A rota foi preservada'}</h2><p>{encounter?.victorySummary}</p><p>+{activeBattle.rewards.characterXp} XP · +{activeBattle.rewards.gold} Ouro · +{activeBattle.rewards.boundResonance} Ressonância · {activeBattle.rewards.lootDefinitionIds.length} drop</p></div>
            {!activeBattle.claimed ? (
              <GameButton variant="primary" onClick={claim}>Receber recompensas</GameButton>
            ) : (
              <GameButton variant="primary" onClick={leave}>Retornar a Terran</GameButton>
            )}
          </div>
        )}

        {activeBattle.phase === 'Defeat' && (
          <div className="battle-result battle-result--defeat">
            <Shield size={26} />
            <div><p className="eyebrow">DERROTA</p><h2>Retirada necessária</h2><p>A punição final de derrota permanece OWNER_DECISION.</p></div>
            <GameButton variant="secondary" onClick={leave}>Retornar a Terran</GameButton>
          </div>
        )}

        <ArcanePanel title="Registro de batalha" eyebrow="MÁQUINA DE ESTADOS" className="battle-log-panel">
          <div className="battle-log" aria-live="polite">
            {activeBattle.log.slice(-10).map((entry) => (
              <p key={entry.id} className={`battle-log__${entry.tone}`}><span>[R{entry.round}]</span> {entry.message}</p>
            ))}
          </div>
          <details>
            <summary>Inspecionar fases resolvidas</summary>
            <code>{activeBattle.phaseHistory.join(' → ')}</code>
          </details>
        </ArcanePanel>
      </div>
    </GameShell>
  )
}
