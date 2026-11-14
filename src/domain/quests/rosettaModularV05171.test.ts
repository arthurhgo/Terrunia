import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { refreshTutorialQuestProgress } from './tutorialProgress'

const NOW = '2026-11-14T09:00:00.000Z'
const fresh = () => createNewSave('rosetta-owner', 'Explorador', 'character.terririan.default', content, NOW)

describe('Rosetta modular v0.5.17.1 — optional lessons and genuine evidence', () => {
  it('adds optional loot, Grade II, Grade III and Shield Bash missions without Essence Points', () => {
    const questIds = [
      'rosetta_modular_collect_v05171',
      'rosetta_modular_grade_two_v05171',
      'rosetta_modular_grade_three_v05171',
      'rosetta_modular_shield_v05171',
    ]
    const save = fresh()
    for (const id of questIds) {
      expect(content.quests[id], id).toBeDefined()
      expect(content.quests[id].category).toBe('secondary')
      expect(content.quests[id].rewards).toEqual([])
      expect(save.quests[id].status).toBe('locked')
    }
  })

  it('recognizes actual battle part collection and never double credits after reconciliation', () => {
    const save = fresh()
    const id = 'rosetta_modular_collect_v05171'
    save.quests[id].status = 'active'
    expect(refreshTutorialQuestProgress(save, content, NOW).quests[id].status).toBe('active')
    save.eventLog.push('ModularPartCollected:part_blade_body_t1:battle-test')
    const ready = refreshTutorialQuestProgress(save, content, NOW)
    expect(ready.quests[id].status).toBe('ready_to_turn_in')
    expect(refreshTutorialQuestProgress(ready, content, NOW)).toEqual(ready)
  })

  it('does not mistake basic armor refinement for modular weapon assembly', () => {
    const save = fresh()
    const id = 'rosetta_modular_03_v05171'
    save.quests[id].status = 'active'
    save.eventLog.push('BasicArmorRefined:tunic')
    const unchanged = refreshTutorialQuestProgress(save, content, NOW)
    expect(unchanged.quests[id].status).toBe('active')
    unchanged.eventLog.push('ModularAssembly:weapon:part_blade_body_t1')
    const completed = refreshTutorialQuestProgress(unchanged, content, NOW)
    expect(completed.quests[id].status).toBe('ready_to_turn_in')
  })

  it('requires actual grade evidence and shield bash evidence, not merely having a shield', () => {
    const save = fresh()
    const gradeTwo = 'rosetta_modular_grade_two_v05171'
    const gradeThree = 'rosetta_modular_grade_three_v05171'
    const shield = 'rosetta_modular_shield_v05171'
    save.quests[gradeTwo].status = 'active'
    save.quests[gradeThree].status = 'active'
    save.quests[shield].status = 'active'
    let progress = refreshTutorialQuestProgress(save, content, NOW)
    expect(progress.quests[gradeTwo].status).toBe('active')
    expect(progress.quests[gradeThree].status).toBe('active')
    expect(progress.quests[shield].status).toBe('active')
    progress.eventLog.push('ModularShieldBashUsed')
    progress = refreshTutorialQuestProgress(progress, content, NOW)
    expect(progress.quests[shield].status).toBe('ready_to_turn_in')
    expect(progress.quests[gradeTwo].status).toBe('active')
    expect(progress.quests[gradeThree].status).toBe('active')
  })
})
