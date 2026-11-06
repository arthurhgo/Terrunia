import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import { createNewSave } from '../game/createSave'
import { effectiveCharacterXpReward, gainCharacterXp } from './attributeProgression'

describe('ritmo de XP e pontos de evolução v0.5.7', () => {
  it('dobra XP de missões e vitórias, sem gerar pontos de Essência diretamente', () => {
    const save = createNewSave('owner','Teri','character.terririan.default',content)
    const prevEssence = structuredClone(save.essence)
    const gained = gainCharacterXp(save.character, 150)
    expect(effectiveCharacterXpReward(150)).toBe(300)
    expect(gained.character.xp).toBe(save.character.xp + 300)
    expect(gained.levelsGained).toBeGreaterThanOrEqual(1)
    expect(gained.character.unspentAttributePoints).toBe(
      save.character.unspentAttributePoints + gained.levelsGained * BALANCE.attributePointsPerLevel)
    expect(save.essence).toEqual(prevEssence)
  })

  it('não multiplica XP retroativamente ao carregar um personagem', () => {
    const save = createNewSave('owner','Teri','character.terririan.default',content)
    save.character.xp = 78
    expect(gainCharacterXp(save.character,0).character.xp).toBe(78)
    expect(save.character.xp).toBe(78)
  })
})
