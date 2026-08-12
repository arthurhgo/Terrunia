import { ArrowRight, Compass, MapPinned, Sparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import {
  getDiscoveredTerranLocationIds,
  getTerranQuestDestination,
} from '../../domain/terran/cityEngine'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'
import { TerranMinimap } from '../terran/TerranMinimap'

const statusLabels = {
  active: 'Em andamento',
  ready_to_turn_in: 'Retorno necessário',
}

export function TerranScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />

  const discovered = getDiscoveredTerranLocationIds(save)
  const guidance = getTerranQuestDestination(save, content)
  const guidedQuest = guidance ? content.quests[guidance.questId] : null
  const destination = guidance ? content.terranLocations[guidance.locationId] : null
  const currentLocation = content.terranLocations[save.world.currentLocationId]

  return (
    <GameShell fluid>
      <div className="terran-home">
        <header className="terran-home__heading">
          <div>
            <p className="eyebrow">HOME · CIDADE-BASE DO JOGADOR</p>
            <h1>Terran</h1>
            <p>Seis instituições orbitam a Praça do Portal. Missões nascem na cidade, circulam pelos serviços necessários e só então seguem para uma instância.</p>
          </div>
          <div className="location-readout" aria-label="Localização atual">
            <MapPinned size={18} />
            <span>VOCÊ ESTÁ EM<strong>TERRAN &gt; {currentLocation?.name.toUpperCase() ?? 'MAPA DA CIDADE'}</strong></span>
          </div>
        </header>

        <div className="terran-home__layout">
          <ArcanePanel
            title="Mapa de Terran"
            eyebrow="CIDADE VIVA"
            subtitle="Selecione uma instituição para caminhar até ela. Sua posição e seus objetivos permanecem visíveis."
            action={<span className="panel-metric"><Compass size={15} /> {discovered.length}/{TERRAN_LOCATION_IDS.length} locais</span>}
            className="terran-map-panel"
          >
            <TerranMinimap save={save} />
          </ArcanePanel>

          <aside className="terran-home__sidebar">
            <ArcanePanel title="Próximo passo" eyebrow="ORIENTAÇÃO DE MISSÃO" className="journey-panel">
              {guidedQuest && destination && guidance ? (
                <>
                  <div className={`journey-status journey-status--${guidance.status}`}>
                    <Sparkles size={18} />
                    <span>{statusLabels[guidance.status]}<strong>{guidedQuest.title}</strong></span>
                  </div>
                  <p>{guidedQuest.summary}</p>
                  <div className="journey-destination">
                    <span>DESTINO EM TERRAN</span>
                    <strong>{destination.name}</strong>
                    <small>{destination.verb} · {destination.role}</small>
                  </div>
                  <Link className="panel-link" to={`/terran/${destination.id}`}>
                    Ir ao objetivo <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <div className="city-complete-state">
                  <Sparkles size={26} />
                  <strong>Sem destino obrigatório</strong>
                  <p>Explore Terran e consulte as instituições disponíveis.</p>
                </div>
              )}
            </ArcanePanel>

            <ArcanePanel title={save.character.name} eyebrow="NEXO DO JOGADOR" className="terran-character-card">
              <div className="terran-character-card__identity">
                <AssetImage assetId={save.character.portraitAssetId} />
                <div>
                  <strong>Nível {save.character.level}</strong>
                  <span>{save.character.clan.clanId ?? 'Sem Clã'}</span>
                  <span>{save.character.classProgression.classId ?? 'Sem Classe'}</span>
                </div>
              </div>
              <ProgressBar value={save.character.xp} max={save.character.xpRequired} label="Experiência" />
              <ProgressBar value={save.essence.current} max={save.essence.required} label="Essência" tone="essence" />
              <dl className="terran-resource-list">
                <div><dt>Pontos de Essência</dt><dd>{save.essence.essencePoints}</dd></div>
                <div><dt>Ouro</dt><dd>{save.wallet.gold.toLocaleString('pt-BR')}</dd></div>
                <div><dt>Locais descobertos</dt><dd>{discovered.length}/{TERRAN_LOCATION_IDS.length}</dd></div>
              </dl>
              <Link className="panel-link" to="/nexus">Abrir Nexo completo <ArrowRight size={16} /></Link>
            </ArcanePanel>
          </aside>
        </div>
      </div>
    </GameShell>
  )
}
