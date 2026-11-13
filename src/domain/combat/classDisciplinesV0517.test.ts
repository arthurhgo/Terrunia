import {describe,expect,it} from 'vitest'
import {classDefinitions} from '../../content/progression'
import {CLASS_DISCIPLINE_SKILLS_V0517,classDisciplineSkillDefinitionsV0517,classDisciplineCatalogIsCompleteV0517} from '../../content/classDisciplinesV0517'
import {content} from '../../content/catalog'
import {createNewSave} from '../game/createSave'
import {createBattle} from './engine'
import {gameSaveSchema} from '../../persistence/saveSchema'

const NOW='2026-11-13T18:00:00.000Z'
const newcomer=()=>createNewSave('class-qa','Terrírian','character.terririan.default',content,NOW)
const battleWith=(save:ReturnType<typeof newcomer>)=>
  createBattle(save,content.encounters.encounter_fungorro_01,content,'qa-class-'+(save.character.classProgression.classId??'raw'),{manualInitiative:true})

describe('v0.5.17 — doze disciplinas de Classe (sem seleção no prólogo)',()=>{
 it('o catálogo contempla exatamente as 12 Classes já definidas no jogo',()=>{
  expect(classDisciplineCatalogIsCompleteV0517()).toBe(true)
  expect(classDisciplineSkillDefinitionsV0517).toHaveLength(classDefinitions.length)
  const unique=new Set(classDisciplineSkillDefinitionsV0517.map(skill=>skill.id))
  expect(unique.size).toBe(12)
  for(const skill of classDisciplineSkillDefinitionsV0517)
   expect(content.combatSkills[skill.id]).toBeDefined()
 })
 it('Terrírian cru não ganha habilidade exclusiva, mesmo com arma mágica',()=>{
  const save=newcomer()
  expect(save.character.clan.clanId).toBeNull()
  expect(save.character.classProgression.classId).toBeNull()
  const player=battleWith(save).combatants.combatant_player
  for(const id of Object.values(CLASS_DISCIPLINE_SKILLS_V0517))
   expect(player.skillIds).not.toContain(id)
 })
 it('uma Classe confirmada pela prova possui apenas a sua disciplina, sem invadir outro Clã',()=>{
  for(const classDef of classDefinitions){
   const save=newcomer()
   save.character.clan.clanId=classDef.clanId
   save.character.classProgression.classId=classDef.id
   save.character.classProgression.masteryLevel=1
   save.quests[classDef.trialQuestId].status='completed'
   const player=battleWith(save).combatants.combatant_player
   const id=CLASS_DISCIPLINE_SKILLS_V0517[classDef.id]
   expect(player.skillIds).toContain(id)
   expect(player.skillIds.filter(skillId=>Object.values(CLASS_DISCIPLINE_SKILLS_V0517).includes(skillId))).toEqual([id])
   expect(gameSaveSchema.safeParse({...save,battle:battleWith(save)}).success).toBe(true)
  }
 })
 it('classe inválida, grau sem maestria e clã incompatível não concedem habilidades',()=>{
  const sample=classDefinitions[0]
  const save=newcomer()
  save.character.classProgression.classId=sample.id
  save.character.classProgression.masteryLevel=1
  expect(battleWith(save).combatants.combatant_player.skillIds).not.toContain(CLASS_DISCIPLINE_SKILLS_V0517[sample.id])
  save.character.clan.clanId=sample.clanId
  expect(battleWith(save).combatants.combatant_player.skillIds).not.toContain(CLASS_DISCIPLINE_SKILLS_V0517[sample.id]) // missing completed trial
  save.quests[sample.trialQuestId].status='completed'
  save.character.classProgression.masteryLevel=0
  expect(battleWith(save).combatants.combatant_player.skillIds).not.toContain(CLASS_DISCIPLINE_SKILLS_V0517[sample.id])
 })
})
