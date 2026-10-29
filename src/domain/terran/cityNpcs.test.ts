import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getOutdoorCityNpcs, getVisibleNpcsInLocation, isNpcVisible } from './cityNpcs'
import { getCityCast } from '../../ui/terran/cityCast'
import { isCityWalkable } from '../../ui/terran/cityNavigation'

const createSave = () => createNewSave('owner', 'Teste', 'character.terririan.default', content, '2026-10-28T12:00:00Z')

describe('presença condicional de NPCs de Terran', () => {
  it('exibe residentes mas não libera visitantes e condicionais sem um evento', () => {
    const save = createSave()
    const vorren = getVisibleNpcsInLocation(save, 'location_terran_vorren_post').map((npc) => npc.presence.label)
    expect(vorren).toContain('Vorren')
    expect(vorren).not.toContain('Nerion')
    expect(vorren).not.toContain('Keldron')
    const nerion = content.terranLocations.location_terran_vorren_post.npcPresences.find((npc) => npc.id === 'presence_nerion')!
    expect(isNpcVisible(save, nerion)).toBe(false)
    save.world.worldFlags.push('npc_presence:presence_nerion')
    expect(isNpcVisible(save, nerion)).toBe(true)
  })

  it('não apresenta mestres de Classe antes da filiação', () => {
    const save = createSave()
    const members = getVisibleNpcsInLocation(save, 'location_terran_clan_hall').map((npc) => npc.presence.id)
    expect(members).not.toContain('presence_class_masters')
    expect(members).not.toContain('presence_main_lore_council')
    expect(getOutdoorCityNpcs(save)).toHaveLength(6)
    const cast = getCityCast(save)
    expect(cast).toHaveLength(6)
    expect(cast.every((npc) => npc.id.startsWith('presence_street_'))).toBe(true)
    expect(cast.every((npc) => isCityWalkable(npc.point))).toBe(true)
    expect(cast.every((npc) => content.npcs[npc.presence.npcId ?? '']?.questIds.some((id) =>
      content.quests[id]?.category === 'secondary'))).toBe(true)
  })
})
