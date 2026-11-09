import { GearForgeV0515 } from './GearForgeV0515'
import { Link } from 'react-router-dom'
import type { GameSave } from '../../domain/game/types'
import { content } from '../../content/catalog'
import { forgeRecipes, goldForgeOffers } from '../../content/forge'
import { checkForgeRecipe, checkGoldForgeUpgrade, getForgeMaterialCount } from '../../domain/terran/forge'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { DialogueWindow } from './DialogueWindow'
import { checkBasicArmorRefinement } from '../../domain/inventory/basicArmor'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import { BOUND_SLOT_LABELS } from '../../domain/shared/types'

export function ForgePanel({ save, onClose, onQuest }: { save: GameSave; onClose: () => void; onQuest?: () => void }) {
  const forge = useGameStore((state) => state.forge)
  const goldForge = useGameStore((state) => state.goldForge)
  const refine = useGameStore((state) => state.refineArmor)
  return <DialogueWindow save={save} title="Durnan · Casa do Ferreiro" portraitAssetId="npc.durnan.portrait"
    eyebrow="PRODUÇÃO E TÊMPERA" lines={content.npcs.npc_durnan.dialogue} onClose={onClose}>
    <section className="forge-panel" aria-label="Serviços da Casa do Ferreiro">
      <p>{save.wallet.gold} Ouro · Materiais protegidos e favoritos são preservados.</p>
      <Link to="/skill-tree" className="panel-link" onClick={onClose}>Ver caminhos da arma na Skill Tree →</Link>
      {onQuest && <button type="button" className="terran-service-action" onClick={onQuest}>Consultar missão de Durnan</button>}
      {[...save.inventory, ...(save.equippedBasicArmor ? [save.equippedBasicArmor] : [])].some((item) => content.items[item.definitionId]?.basicArmor) && <section className="forge-starter" aria-label="Reforçar proteções simples"><h3>Primeiro reforço · +1</h3>
        <p>Uma Linha de Linho e {ARMOR_REFINEMENT.gold} Ouro. A peça ganha 1 de Defesa.</p>
        {[...save.inventory, ...(save.equippedBasicArmor ? [save.equippedBasicArmor] : [])].filter((item) => content.items[item.definitionId]?.basicArmor).map((item) => {
          const definition = content.items[item.definitionId]
          const permission = checkBasicArmorRefinement(save, item.instanceId, content)
          return <article key={item.instanceId} className="forge-recipe"><AssetImage assetId={definition.iconAssetId} />
            <div><h3>{definition.name}{item.refinementLevel ? ' +1' : ''}</h3><small>{item.instanceId === save.equippedBasicArmor?.instanceId ? 'Equipada · ' : ''}{!permission.ok ? permission.message : 'Pronta para reforçar'}</small></div>
            <button type="button" disabled={!permission.ok} aria-label={`Aprimorar ${definition.name} para +1`} onClick={() => refine(item.instanceId)}>Aprimorar +1</button></article>
        })}</section>}
      <GearForgeV0515 save={save} />
      <section className="forge-premium" aria-label="Melhorias permanentes em Ouro">
        <h3>Forja Magistral · Melhorias por Ouro</h3>
        <p>Uma melhoria cara por Vínculo, sem substituição de arma, escudo, armadura, colar ou pulseira. Custos e bônus: BALANCE_DRAFT.</p>
        {goldForgeOffers.map((offer) => {
          const permission = checkGoldForgeUpgrade(save, offer.slot)
          const itemId = save.character.bondedEquipment[offer.slot]
          const item = itemId ? save.boundItems[itemId] : null
          const definition = item ? content.boundItemBases[item.baseItemId] : null
          const details = [
            offer.attackPower ? `Ataque +${offer.attackPower}` : '',
            offer.mitigation ? `Defesa +${offer.mitigation}` : '',
            offer.maxHp ? `Vida máxima +${offer.maxHp}` : '',
            offer.maxMp ? `Mana máxima +${offer.maxMp}` : '',
          ].filter(Boolean).join(' · ')
          return <article className="forge-recipe" key={offer.id}>
            <AssetImage assetId={definition?.assetIdByGrade[item?.grade ?? 1] ?? 'item.weapon-core'} />
            <div><h3>{offer.name}</h3><small>{BOUND_SLOT_LABELS[offer.slot]} · {definition?.name ?? 'Vínculo ainda vazio'}</small>
              <p>{details} · {offer.gold} Ouro</p>
              {!permission.ok && <small className="forge-recipe__requirement">{permission.message}</small>}
            </div>
            <button type="button" disabled={!permission.ok} onClick={() => goldForge(offer.slot)} aria-label={`Aprimorar ${BOUND_SLOT_LABELS[offer.slot]} por ${offer.gold} Ouro`}>Aprimorar · {offer.gold} Ouro</button>
          </article>
        })}
      </section>
      {forgeRecipes.map((recipe) => {
        const permission = checkForgeRecipe(save, recipe.id, content)
        return <article key={recipe.id} className="forge-recipe">
          <AssetImage assetId={recipe.outputItemId ? content.items[recipe.outputItemId].iconAssetId : 'item.weapon-core'} />
          <div><h3>{recipe.name}</h3><p>{recipe.description}</p>
            <small>{recipe.inputs.map((input) => `${content.items[input.itemId].name} ${getForgeMaterialCount(save, input.itemId)}/${input.quantity}`).join(' · ')} · {recipe.gold} Ouro</small>
            {!permission.ok && <small className="forge-recipe__requirement">{permission.message}</small>}</div>
          <button type="button" aria-label={`Forjar: ${recipe.name}`} disabled={!permission.ok} onClick={() => forge(recipe.id)}>{recipe.upgradeId ? 'Aprimorar' : 'Produzir'}</button>
        </article>
      })}
    </section>
  </DialogueWindow>
}
