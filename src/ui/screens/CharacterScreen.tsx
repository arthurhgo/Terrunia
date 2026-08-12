import { Award, BookHeart, History, Shield, Trophy } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'

export function CharacterScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  const character = save.character
  const memories = Object.values(save.boundItems).flatMap((item) => item.memories)
  return (
    <GameShell>
      <div className="content-screen character-sheet-screen">
        <header className="screen-heading"><p className="eyebrow">FICHA DETALHADA E HISTÓRICO</p><h1>{character.name}</h1><p>Registro profundo do Terrírian. A leitura rápida de combate permanece no Nexo.</p></header>
        <div className="character-sheet-grid">
          <ArcanePanel title="Identidade" eyebrow="REGISTRO DO TERRÍRIAN"><div className="character-sheet-identity"><AssetImage assetId={character.portraitAssetId} /><dl><div><dt>Raça</dt><dd>Terrírian</dd></div><div><dt>Nível</dt><dd>{character.level}</dd></div><div><dt>Clã</dt><dd>{character.clan.clanId ?? 'Não filiado'}</dd></div><div><dt>Classe</dt><dd>{character.classProgression.classId ?? 'Não desenvolvida'}</dd></div></dl></div></ArcanePanel>
          <ArcanePanel title="Progressão geral" eyebrow="JORNADA"><div className="character-record-list"><span><Shield /><strong>Rank de Clã</strong><b>{character.clan.rank}</b></span><span><Award /><strong>Maestria de Classe</strong><b>{character.classProgression.masteryLevel}</b></span><span><Trophy /><strong>Títulos</strong><b>{character.titleIds.length}</b></span></div></ArcanePanel>
          <ArcanePanel title="Memórias" eyebrow="MARCAS DA JORNADA" className="character-history-panel"><BookHeart size={24} />{memories.length ? memories.map((memory) => <article key={memory.id}><strong>{memory.title}</strong><p>{memory.description}</p></article>) : <p>Nenhuma Memória foi inscrita nos Vínculos.</p>}</ArcanePanel>
          <ArcanePanel title="Crônica" eyebrow="HISTÓRICO DO SAVE" className="character-history-panel"><History size={24} /><div className="event-chronicle">{save.eventLog.slice(-12).reverse().map((event, index) => <span key={`${event}-${index}`}>{event}</span>)}</div></ArcanePanel>
        </div>
      </div>
    </GameShell>
  )
}
