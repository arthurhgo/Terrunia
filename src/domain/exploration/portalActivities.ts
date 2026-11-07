import { canEnterBiome } from './biomeAccess'
import { biomeRegistry } from '../../content/biomeRegistry'
import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { canStartPortalHunt, PORTAL_HUNT_IDS } from '../combat/portalHunts'

export type PortalActivity = {
  id: string
  kind: 'trail' | 'waves' | 'hunt'
  title: string
  description: string
  detail: string
  unlocked: boolean
  requirement: string
}

/** Single source of truth for Portal buttons; never mutates the save or auto-enters an instance. */
export function getPortalActivities(save: GameSave, catalog: ContentCatalog): PortalActivity[] {
  const firstCompleted = save.world.trailNodeStates.astravel_fungorro_01 === 'completed'
  const entryCompleted = save.world.trailNodeStates.astravel_entry === 'completed'
  const questActive = save.quests.vs_astravel_first_contact?.status === 'active'
  const cleared = catalog.trails.trail_astravel_entry.nodes.filter(
    (node) => node.type !== 'entry' && save.world.trailNodeStates[node.id] === 'completed',
  ).length
  const canWalk = entryCompleted || questActive
  const canFight = firstCompleted && save.vitals.hp > 0 && !save.battle
  return [
    {
      id: 'astravel', kind: 'trail', title: 'Floresta de Astravél',
      description: 'Campanha e exploração · entrada pelo marco 0',
      detail: `${cleared}/15 encontros concluídos`,
      unlocked: canWalk,
      requirement: canWalk ? 'Continue a jornada pela trilha.' : 'Aceite O Primeiro Rastro com Eldamar.',
    },
    {
      id: 'waves', kind: 'waves', title: 'Modo Ondas',
      description: 'Combates consecutivos com inimigos progressivos',
      detail: `Recorde: ${save.world.portalWaveBest ?? 0} onda(s)`,
      unlocked: canFight,
      requirement: !firstCompleted
        ? 'Conclua o primeiro combate de Astravél.'
        : save.vitals.hp <= 0 ? 'Recupere Vida antes de enfrentar as ondas.'
          : save.battle ? 'Termine o combate atual.' : 'Modo repetível disponível.',
    },
    ...biomeRegistry.filter((biome) => biome.playable && biome.id !== 'biome_astravel').map((biome) => {
      const gate = canEnterBiome(save, biome.id, catalog)
      const trail = catalog.trails[biome.trailIds[0]]
      const cleared = trail?.nodes.filter((node) =>
        node.type !== 'entry' && save.world.trailNodeStates[node.id] === 'completed').length ?? 0
      return {
        id: biome.id, kind: 'trail' as const, title: biome.name,
        description: 'Nova expedição · criaturas e cenários do bioma',
        detail: cleared + '/' + ((trail?.nodes.length ?? 1) - 1) + ' encontros concluídos · CONTENT_DRAFT',
        unlocked: gate.ok,
        requirement: gate.ok ? 'Entrada disponível no Portal.' : gate.message,
      }
    }),
    ...PORTAL_HUNT_IDS.map((id) => {
      const encounter = catalog.encounters[id]
      const gate = canStartPortalHunt(save, id, catalog)
      const enemies = encounter.enemyDefinitionIds.map((enemyId) => catalog.enemies[enemyId]?.name ?? enemyId)
      return {
        id, kind: 'hunt' as const, title: encounter.name,
        description: enemies.join(' · '),
        detail: `Nível ${Math.min(...encounter.enemyDefinitionIds.map((id) => catalog.enemies[id].level))}–${Math.max(...encounter.enemyDefinitionIds.map((id) => catalog.enemies[id].level))} · +${encounter.rewards.characterXp} XP · +${encounter.rewards.gold} Ouro`,
        unlocked: gate.ok,
        requirement: gate.ok ? 'Caçada repetível disponível.' :
          gate.message,
      }
    }),
  ]
}
