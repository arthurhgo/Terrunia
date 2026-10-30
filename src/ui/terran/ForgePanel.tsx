import { Link } from 'react-router-dom'
import type { GameSave } from '../../domain/game/types'
import { content } from '../../content/catalog'
import { forgeRecipes } from '../../content/forge'
import { checkForgeRecipe, getForgeMaterialCount } from '../../domain/terran/forge'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { DialogueWindow } from './DialogueWindow'
import { checkBasicArmorRefinement } from '../../domain/inventory/basicArmor'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'

export function ForgePanel({ save, onClose, onQuest }: { save: GameSave; onClose: () => void; onQuest?: () => void }) {
  const forge = useGameStore((state) => state.forge)
  const refine = useGameStore((state) => state.refineArmor)
  return <DialogueWindow save={save} title="Durnan · Casa do Ferreiro" portraitAssetId="npc.durnan.portrait"
    eyebrow="PRODUÇÃO E TÊMPERA" lines={content.npcs.npc_durnan.dialogue} onClose={onClose}>
    <section className="forge-panel" aria-label="Serviços da Casa do Ferreiro">
      <p>{save.wallet.gold} Ouro · Materiais protegidos e favoritos são preservados.</p>
      <Link to="/skill-tree" className="panel-link" onClick={onClose}>Ver caminhos da arma na Skill Tree →</Link>
      {onQuest && <button type="button" className="terran-service-action" onClick={onQuest}>Consultar missão de Durnan</button>}
      {save.inventory.some((item) => content.items[item.definitionId]?.basicArmor) && <section className="forge-starter" aria-label="Reforçar proteções simples"><h3>Primeiro reforço · +1</h3>
        <p>Uma Linha de Linho e {ARMOR_REFINEMENT.gold} Ouro. A peça ganha 1 de Defesa.</p>
        {save.inventory.filter((item) => content.items[item.definitionId]?.basicArmor).map((item) => {
          const definition = content.items[item.definitionId]
          const permission = checkBasicArmorRefinement(save, item.instanceId, content)
          return <article key={item.instanceId} className="forge-recipe"><AssetImage assetId={definition.iconAssetId} />
            <div><h3>{definition.name}{item.refinementLevel ? ' +1' : ''}</h3><small>{!permission.ok ? permission.message : 'Pronta para reforçar'}</small></div>
            <button type="button" disabled={!permission.ok} aria-label={`Aprimorar ${definition.name} para +1`} onClick={() => refine(item.instanceId)}>Aprimorar +1</button></article>
        })}</section>}
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
