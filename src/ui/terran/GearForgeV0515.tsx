import type { GameSave } from '../../domain/game/types'
import { gearOfferById, getGearGrade, getGearStatEntries, gearSpriteId, formatGearStats } from '../../content/equipmentV0515'
import { getWornGear } from '../../domain/inventory/equipmentV0515'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'

/** Read-only projected forge results. Costs and attribute deltas come exclusively from the catalog. */
export function GearForgeV0515({ save }: { save: GameSave }) {
  const refine = useGameStore(state => state.refineGear)
  const options = [...save.inventory, ...getWornGear(save)].filter(item => gearOfferById[item.definitionId])
  if (!options.length) return null
  return <section className="forge-starter" aria-label="Aprimorar equipamentos v0.5.15">
    <h3>Forja de Equipamentos · Grau 1 a 3</h3>
    <p>Compare os valores antes de forjar. O Tier não muda; a forja comercial G1–G3 não altera os cinco Vínculos permanentes G1–G7.</p>
    <p>Ouro disponível: <strong>{save.wallet.gold}</strong> · Materiais adicionais: OWNER_DECISION (não exigidos neste draft).</p>
    {options.map(item => {
      const offer = gearOfferById[item.definitionId]
      const grade = getGearGrade(item.refinementLevel)
      const next = grade < 3 ? (grade + 1) as 2 | 3 : null
      const price = grade === 1 ? offer.forgeG2 : grade === 2 ? offer.forgeG3 : 0
      const missingGold = Math.max(0, price - save.wallet.gold)
      const reasons = [
        grade === 3 ? 'Grau máximo alcançado' : '',
        item.locked || item.favorite ? 'Peça protegida ou favorita: desproteja para forjar' : '',
        save.battle ? 'Forja indisponível durante combate' : '',
        missingGold ? 'Faltam ' + missingGold + ' Ouro' : '',
      ].filter(Boolean)
      const currentStats = getGearStatEntries(offer, grade)
      const nextStats = next ? getGearStatEntries(offer, next) : []
      return <article key={item.instanceId} className="forge-recipe" data-gear-grade={grade}>
        <AssetImage assetId={gearSpriteId(offer, grade)} alt="" />
        <div>
          <h3>{offer.name} · T{offer.tier} G{grade}</h3>
          <small>{formatGearStats(offer, grade)}</small>
          {next && <div className="forge-recipe__projection" aria-label={'Prévia de forja G' + grade + ' para G' + next}>
            <strong>G{grade} → G{next} · {price} Ouro</strong>
            {currentStats.map((stat, index) => {
              const following = nextStats[index] ?? stat
              return <small key={stat.stat + index}>
                {stat.label}: {stat.value} → {following.value} ({following.value - stat.value > 0 ? '+' : ''}{following.value - stat.value})
              </small>
            })}
            <small>Saldo após forja: {save.wallet.gold - price} Ouro</small>
          </div>}
          <small role="status" className={reasons.length ? 'forge-recipe__requirement' : ''}>
            {reasons.join(' · ') || 'Requisitos atendidos · pronto para aprimorar'}
          </small>
        </div>
        <button type="button" disabled={reasons.length > 0}
          onClick={() => refine(item.instanceId)} aria-label={'Forjar ' + offer.name + ' até Grau ' + (grade + 1)}>
          {next ? 'Forjar G' + next + ' · ' + price + ' Ouro' : 'G3 máximo'}
        </button>
      </article>
    })}
  </section>
}
