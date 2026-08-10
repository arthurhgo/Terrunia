import { LockKeyhole, Map, Trees } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameShell } from '../components/GameShell'

export function WorldScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  return (
    <GameShell>
      <div className="content-screen">
        <header className="screen-heading"><p className="eyebrow">ROTAS E RUÍNAS</p><h1>Mundo</h1><p>Portal é uma área funcional: nem toda viagem representa teletransporte literal.</p></header>
        <div className="world-cards">
          <ArcanePanel title="Terran" eyebrow="HUB PRINCIPAL"><Map size={31} /><p>NPCs, serviços, preparação e evolução dos Vínculos.</p><strong>DESBLOQUEADO</strong></ArcanePanel>
          <ArcanePanel title="Floresta de Astravél" eyebrow="PRIMEIRA ROTA"><Trees size={31} /><p>Entrada para o conteúdo Fungorro e as Câmaras Fúngicas.</p><strong>{save.world.unlockedLocationIds.includes('astravel_entry') ? 'DESBLOQUEADO' : 'BLOQUEADO POR MISSÃO'}</strong></ArcanePanel>
          <ArcanePanel title="Câmaras Fúngicas" eyebrow="RUÍNA I"><LockKeyhole size={31} /><p>Boss e rota profunda permanecem para a próxima fase.</p><strong>BLOQUEADO</strong></ArcanePanel>
        </div>
      </div>
    </GameShell>
  )
}
