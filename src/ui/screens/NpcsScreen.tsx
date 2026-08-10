import { LockKeyhole, MessageCircle, Sparkles } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'

export function NpcsScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  const npc = content.npcs.npc_eldamar
  const relation = save.relationships[npc.id]
  return (
    <GameShell>
      <div className="content-screen">
        <header className="screen-heading"><p className="eyebrow">REDE VIVA DO PERSONAGEM</p><h1>NPCs e Relações</h1><p>Mestres, recrutadores e treinadores desbloqueiam caminhos sem substituir o protagonista.</p></header>
        <div className="npc-grid">
          <ArcanePanel title={relation.discovered ? npc.name : 'Desconhecido'} eyebrow={relation.discovered ? npc.title : 'AINDA NÃO ENCONTRADO'}>
            {relation.discovered ? <AssetImage assetId={npc.portraitAssetId} /> : <div className="unknown-portrait"><LockKeyhole size={35} /></div>}
            <dl className="relation-stats"><div><dt>Confiança</dt><dd>{relation.trust}</dd></div><div><dt>Afinidade</dt><dd>{relation.affinity}</dd></div></dl>
            <p className="npc-roles"><MessageCircle size={15} /> {relation.discovered ? npc.roles.join(' · ') : 'Explore Terran para revelar.'}</p>
          </ArcanePanel>
          {Array.from({ length: 3 }, (_, index) => (
            <ArcanePanel key={index} title="???" eyebrow="RELAÇÃO FUTURA"><div className="unknown-portrait"><Sparkles size={28} /></div><p>Conteúdo será revelado por gameplay e fontes canônicas.</p></ArcanePanel>
          ))}
        </div>
      </div>
    </GameShell>
  )
}
