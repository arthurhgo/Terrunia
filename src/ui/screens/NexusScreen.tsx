import { Activity, BookOpen, ShieldCheck, Sparkles, Swords, WandSparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { ATTRIBUTE_IDS } from '../../domain/game/types'
import { deriveCharacterStats, type DerivedStat } from '../../domain/character/derivedStats'
import { useGameStore } from '../../state/gameStore'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

const attributeLabels = { cunning: 'Astúcia', agility: 'Agilidade', strength: 'Força', vigor: 'Vigor', spirit: 'Espírito' }

function DerivedStatCard({ label, stat, icon: Icon }: { label: string; stat: DerivedStat; icon: typeof Activity }) {
  return (
    <details className="nexus-derived-stat">
      <summary><Icon size={18} /><span>{label}</span><strong>{stat.value}</strong></summary>
      <dl>{stat.contributions.map((entry) => <div key={entry.label}><dt>{entry.label}</dt><dd>+{entry.value}</dd></div>)}</dl>
    </details>
  )
}

export function NexusScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  const stats = deriveCharacterStats(save, content)
  const { character, essence } = save

  return (
    <GameShell fluid>
      <div className="nexus-screen">
        <header className="screen-heading nexus-heading"><p className="eyebrow">PERSONAGEM + VÍNCULOS</p><h1>Nexo</h1><p>Quem é seu Terrírian e como tudo que está vinculado a ele constrói sua força.</p></header>
        <div className="nexus-layout">
          <ArcanePanel title="Status do personagem" eyebrow="RESULTADO ATUAL DA BUILD" className="nexus-status-panel">
            <div className="nexus-identity">
              <AssetImage assetId={character.portraitAssetId} />
              <div><p className="eyebrow">TERRÍRIAN</p><h2>{character.name}</h2><strong>Nível {character.level}</strong><span>{character.clan.clanId ?? 'Sem Clã'} · Rank {character.clan.rank}</span><span>{character.classProgression.classId ?? 'Sem Classe'} · Mestria {character.classProgression.masteryLevel}</span></div>
            </div>
            <ProgressBar value={character.xp} max={character.xpRequired} label="Experiência" />
            <div className="nexus-attribute-grid">{ATTRIBUTE_IDS.map((id) => <div key={id}><span>{attributeLabels[id]}</span><strong>d{character.attributes[id].die}{character.attributes[id].bonus ? ` +${character.attributes[id].bonus}` : ''}</strong></div>)}</div>
            <div className="nexus-derived-grid">
              <DerivedStatCard label="Vida" stat={stats.life} icon={Activity} />
              <DerivedStatCard label="Mana" stat={stats.mana} icon={WandSparkles} />
              <DerivedStatCard label="Defesa" stat={stats.defense} icon={ShieldCheck} />
              <DerivedStatCard label="Ataque físico" stat={stats.physicalAttack} icon={Swords} />
              <DerivedStatCard label="Ataque mágico" stat={stats.magicalAttack} icon={Sparkles} />
            </div>
            <div className="nexus-essence"><ProgressBar value={essence.current} max={essence.required} label="Essência atual" tone="essence" /><strong>{essence.essencePoints} Ponto(s) de Essência</strong></div>
            <Link className="panel-link" to="/character">Abrir ficha detalhada <BookOpen size={16} /></Link>
          </ArcanePanel>
          <BoundItemsPanel save={save} />
        </div>
      </div>
    </GameShell>
  )
}
