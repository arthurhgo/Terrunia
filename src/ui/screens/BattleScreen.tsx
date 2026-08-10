import { Backpack, Footprints, Shield, Sparkles, Swords } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

export function BattleScreen() {
  const save = useGameStore((state) => state.save)
  const submit = useGameStore((state) => state.submitBattleCommand)
  const claim = useGameStore((state) => state.claimBattleRewards)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const navigate = useNavigate()

  if (!save?.battle) return <Navigate to="/terran" replace />
  const battle = save.battle
  const player = Object.values(battle.combatants).find((combatant) => combatant.side === 'player')
  const enemy = Object.values(battle.combatants).find((combatant) => combatant.side === 'enemy')
  if (!player || !enemy) return <Navigate to="/terran" replace />

  const leave = () => {
    returnToTerran()
    navigate('/terran')
  }

  return (
    <GameShell fluid>
      <div className="battle-screen">
        <header className="battle-topline">
          <div><span>Local</span><strong>Floresta de Astravél</strong></div>
          <div><span>Missão</span><strong>O Primeiro Rastro</strong></div>
          <div><span>Rodada</span><strong>{battle.round}</strong></div>
          <div><span>Estado</span><strong>{battle.phase}</strong></div>
        </header>

        <div className="battle-layout">
          <ArcanePanel title={player.name} eyebrow="TERRÍRIAN" className="combatant-panel combatant-panel--player">
            <AssetImage assetId={save.character.portraitAssetId} />
            <ProgressBar value={player.hp} max={player.maxHp} label="Vida" tone="health" />
            <dl className="combat-stats">
              <div><dt>Ataque</dt><dd>{player.attackPower}</dd></div>
              <div><dt>Mitigação</dt><dd>{player.mitigation}</dd></div>
              <div><dt>Iniciativa</dt><dd>{player.initiative}</dd></div>
            </dl>
            <div className="active-bound-mini"><Swords size={19} /><span>Arma vinculada<strong>Grau I · {save.boundItems[save.character.bondedEquipment.weapon ?? '']?.resonance ?? 0} R</strong></span></div>
          </ArcanePanel>

          <section className="battlefield" aria-label="Campo de batalha">
            <div className="battlefield__mist" aria-hidden="true" />
            <div className="battle-character battle-character--player">
              <AssetImage assetId={save.character.portraitAssetId} />
              <span>{player.name}</span>
            </div>
            <div className={`battle-character battle-character--enemy ${!enemy.alive ? 'defeated' : ''}`}>
              <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
              <span>{enemy.name}</span>
            </div>
            <div className="turn-orbit"><span>{battle.round}</span><small>RODADA</small></div>
          </section>

          <ArcanePanel title={enemy.name} eyebrow="INIMIGO · NÍVEL 1" className="combatant-panel combatant-panel--enemy">
            <AssetImage assetId={content.enemies[enemy.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} />
            <ProgressBar value={enemy.hp} max={enemy.maxHp} label="Vida" tone="health" />
            <dl className="combat-stats">
              <div><dt>Ataque</dt><dd>{enemy.attackPower}</dd></div>
              <div><dt>Mitigação</dt><dd>{enemy.mitigation}</dd></div>
              <div><dt>Fraqueza</dt><dd>Luz / Fogo</dd></div>
            </dl>
            <p className="enemy-note">Criatura documentada das Câmaras Fúngicas de Astravél.</p>
          </ArcanePanel>
        </div>

        {battle.phase === 'AwaitingAction' && (
          <div className="battle-command-bar">
            <GameButton variant="primary" onClick={() => submit({ type: 'attack', targetId: enemy.id })}>
              <Swords size={18} /> Atacar
            </GameButton>
            <GameButton variant="secondary" disabled><Sparkles size={18} /> Habilidade</GameButton>
            <GameButton variant="secondary" onClick={() => submit({ type: 'defend' })}><Shield size={18} /> Defender</GameButton>
            <GameButton variant="ghost" disabled><Backpack size={18} /> Item</GameButton>
            <GameButton variant="ghost" onClick={() => submit({ type: 'flee' })}><Footprints size={18} /> Fugir</GameButton>
          </div>
        )}

        {battle.phase === 'Victory' && (
          <div className="battle-result battle-result--victory">
            <Sparkles size={26} />
            <div><p className="eyebrow">VITÓRIA</p><h2>A rota foi preservada</h2><p>+{battle.rewards.characterXp} XP · +{battle.rewards.gold} Ouro · +{battle.rewards.boundResonance} Ressonância · 1 drop</p></div>
            {!battle.claimed ? (
              <GameButton variant="primary" onClick={claim}>Receber recompensas</GameButton>
            ) : (
              <GameButton variant="primary" onClick={leave}>Retornar a Terran</GameButton>
            )}
          </div>
        )}

        {battle.phase === 'Defeat' && (
          <div className="battle-result battle-result--defeat">
            <Shield size={26} />
            <div><p className="eyebrow">DERROTA</p><h2>Retirada necessária</h2><p>A punição final de derrota permanece OWNER_DECISION.</p></div>
            <GameButton variant="secondary" onClick={leave}>Retornar a Terran</GameButton>
          </div>
        )}

        <ArcanePanel title="Registro de batalha" eyebrow="MÁQUINA DE ESTADOS" className="battle-log-panel">
          <div className="battle-log">
            {battle.log.slice(-8).map((entry) => (
              <p key={entry.id} className={`battle-log__${entry.tone}`}><span>[R{entry.round}]</span> {entry.message}</p>
            ))}
          </div>
          <details>
            <summary>Inspecionar fases resolvidas</summary>
            <code>{battle.phaseHistory.join(' → ')}</code>
          </details>
        </ArcanePanel>
      </div>
    </GameShell>
  )
}
