import { LockKeyhole, Map, Trees } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameShell } from '../components/GameShell'

export function WorldScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  const trail = content.trails.trail_astravel_entry
  const completedNodes = trail.nodes.filter(
    (node) => save.world.trailNodeStates[node.id] === 'completed',
  ).length
  const thresholdDiscovered = save.world.worldFlags.includes(
    'fungal_chambers_threshold_discovered',
  )
  return (
    <GameShell>
      <div className="content-screen">
        <header className="screen-heading"><p className="eyebrow">ROTAS E RUÍNAS</p><h1>Mundo</h1><p>Portal é uma área funcional: nem toda viagem representa teletransporte literal.</p></header>
        <div className="world-cards">
          <ArcanePanel title="Terran" eyebrow="HUB PRINCIPAL"><Map size={31} /><p>NPCs, serviços, preparação e evolução dos Vínculos.</p><strong>DESBLOQUEADO</strong></ArcanePanel>
          <ArcanePanel title="Floresta de Astravél" eyebrow="PRIMEIRA ROTA"><Trees size={31} /><p>Trilha sequencial com encontros, acampamento e efeitos Fungorros.</p><strong>{save.world.unlockedLocationIds.includes('astravel_entry') ? `${completedNodes}/${trail.nodes.length - 1} NÓS CONCLUÍDOS` : 'BLOQUEADO POR MISSÃO'}</strong></ArcanePanel>
          <ArcanePanel title="Câmaras Fúngicas" eyebrow="RUÍNA I"><LockKeyhole size={31} /><p>O limiar pode ser descoberto; o boss aguarda conteúdo aprovado.</p><strong>{thresholdDiscovered ? 'LIMIAR DESCOBERTO · BOSS BLOQUEADO' : 'NÃO DESCOBERTO'}</strong></ArcanePanel>
        </div>
      </div>
    </GameShell>
  )
}
