import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getNpcQuestMarker, getOutdoorCityNpcs, getVisibleNpcsInLocation, isNpcVisible } from './cityNpcs'
import { getCityCast } from '../../ui/terran/cityCast'
import { isCityWalkable } from '../../ui/terran/cityNavigation'

const createSave = () => createNewSave('owner', 'Teste', 'character.terririan.default', content, '2026-10-28T12:00:00Z')

describe('presença condicional de NPCs de Terran', () => {
  it('reserva ? a Rosetta, usa ! para missão e losangos para sidequests, sem marcar NPCs sem missão', () => {
    const save = createSave()
    const rosetta = { id: 'guide', npcId: 'npc_rosetta', label: 'Rosetta', presence: 'resident' as const, roleLabel: 'Guia' }
    const arlen = { ...rosetta, id: 'arlen', npcId: 'npc_street_arlen' }
    const eldamar = { ...rosetta, id: 'eldamar', npcId: 'npc_eldamar' }
    expect(getNpcQuestMarker(save, rosetta)).toBe('?')
    expect(getNpcQuestMarker(save, arlen)).toBeNull()
    expect(getNpcQuestMarker(save, eldamar)).toBe('!')
    save.quests.side_street_arlen.status = 'available'
    expect(getNpcQuestMarker(save, arlen)).toBe('◇')
    save.quests.side_street_arlen.status = 'active'
    expect(getNpcQuestMarker(save, arlen)).toBe('◇')
    save.quests.side_street_arlen.status = 'ready_to_turn_in'
    expect(getNpcQuestMarker(save, arlen)).toBe('◆')
    save.quests.side_street_arlen.status = 'completed'
    expect(getNpcQuestMarker(save, arlen)).toBeNull()
    expect(getNpcQuestMarker(save, { ...arlen, npcId: undefined })).toBeNull()
  })
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
    expect(cast).toHaveLength(7)
    expect(cast.filter((npc) => npc.id.startsWith('presence_street_'))).toHaveLength(6)
    expect(cast.find((npc) => npc.id === 'presence_rosetta')?.marker).toBe('?')
    expect(cast.every((npc) => isCityWalkable(npc.point))).toBe(true)
    expect(cast.filter((npc) => npc.id.startsWith('presence_street_')).every((npc) =>
      content.npcs[npc.presence.npcId ?? '']?.questIds.some((id) =>
        content.quests[id]?.category === 'secondary'))).toBe(true)
  })
})
