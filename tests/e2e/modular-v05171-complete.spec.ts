import {expect,test,type Page} from '@playwright/test'
import {fightAndCollect} from './helpers/combatUi'

/** The legacy core Rosetta tutorial is exercised end-to-end by rosetta-tutorial.spec.ts.
 * This spec seeds ONLY that completed prerequisite and bonus test currency.
 * All modular lessons, NPC interactions, shopping, forges, combat actions and
 * victory collection here are driven through the real UI and production domain. */
async function createTerririan(page:Page) {
 await page.goto('/login')
 await page.getByRole('button',{name:'Continuar como convidado local'}).click()
 await page.getByPlaceholder('Ex.: Aron').fill('FerreiroE2E')
 await page.getByRole('button',{name:'Confirmar e continuar'}).click()
 await page.getByRole('button',{name:'Escolher Espada Longa',exact:true}).press('Enter')
 await page.getByRole('button',{name:'Distribuir pontos e vincular Espada Longa',exact:true}).click()
 for(const name of ['Força','Força','Astúcia','Agilidade','Vigor','Espírito'])
  await page.getByRole('button',{name:'Aumentar '+name}).click()
 await page.getByRole('button',{name:'Confirmar Vínculo de Espada Longa — Grau I',exact:true}).click()
 await page.getByRole('button',{name:'Pular cena'}).click()
}

async function rosetta(page:Page){
 await page.getByRole('combobox',{name:'Destino em Terran'}).selectOption('npc:presence_rosetta')
 const guide=page.getByRole('dialog',{name:'Orientações de Rosetta'})
 await expect(guide).toBeVisible()
 return guide
}
async function closeAndExit(page:Page){
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'Sair do interior para as ruas de Terran',exact:true}).click()
}
const snapshot=async(page:Page)=>page.evaluate(async()=>{
 const {useGameStore}=await import('/src/state/gameStore.ts')
 const {deriveCharacterStats}=await import('/src/domain/character/derivedStats.ts')
 const {content}=await import('/src/content/catalog.ts')
 const save=useGameStore.getState().save!
 const id=save.character.bondedEquipment.weapon!
 return {
  id,level:save.character.level,gold:save.wallet.gold,revision:save.revision,
  assembly:save.boundItems[id].assembly?.parts.body??null,
  grade:save.boundItems[id].grade,attack:deriveCharacterStats(save,content).primaryAttack.value,
  fragments:save.inventory.filter(i=>i.definitionId.startsWith('part_')).reduce((n,i)=>n+i.quantity,0),
  claim:save.battle?.claimed??false,saveSchema:save.schemaVersion,
  quests:{
   one:save.quests.rosetta_modular_01_v05171?.status,
   two:save.quests.rosetta_modular_02_v05171?.status,
   three:save.quests.rosetta_modular_03_v05171?.status,
  },
 }
})

test('Rosetta → Torvan → Durnan: montagem real, camadas visuais, navegação e save 18',async({page},testInfo)=>{
 test.setTimeout(210_000)
 page.setDefaultTimeout(20_000)
 const browserErrors:string[]=[]
 page.on('pageerror',e=>browserErrors.push(e.message))
 await page.setViewportSize({width:1366,height:768})
 await createTerririan(page)
 // The previous release's three core lessons have their own complete browser test.
 await page.evaluate(async()=>{
  const {useGameStore}=await import('/src/state/gameStore.ts')
  const {refreshQuestAvailability}=await import('/src/domain/quests/questEngine.ts')
  const {content}=await import('/src/content/catalog.ts')
  const save=structuredClone(useGameStore.getState().save!)
  for(const id of ['rosetta_tutorial_equip','rosetta_tutorial_supply','rosetta_tutorial_refine'])
   save.quests[id].status='completed'
  save.wallet.gold=400
  save.eventLog.push('TestFixture:CoreRosettaLessonsValidatedSeparately')
  useGameStore.setState({save:refreshQuestAvailability(save,content,save.updatedAt)})
 })
 const first=await snapshot(page)
 expect(first.id).toBeTruthy()
 let guide=await rosetta(page)
 const firstLesson=guide.getByRole('article',{name:'Lições de armas modulares de Rosetta'})
 await expect(firstLesson).toBeVisible()
 await firstLesson.getByRole('button',{name:'Aceitar: Uma Arma, Quatro Partes'}).click()
 expect((await snapshot(page)).quests.one).toBe('active')
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'Ir para Casa do Ferreiro',exact:true}).click()
 await closeAndExit(page)
 guide=await rosetta(page)
 await guide.getByRole('button',{name:'Entregar: Uma Arma, Quatro Partes'}).click()
 await guide.getByRole('button',{name:'Aceitar: A Peça do Seu Vínculo'}).click()
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'Ir para Mercado',exact:true}).click()
 await page.getByRole('button',{name:'Falar com Torvan dentro do local',exact:true}).click()
 const torvan=page.getByRole('dialog',{name:'Torvan'})
 const body=torvan.locator('.modular-shop__item').filter({hasText:'Corpo Bruto · Espada'})
 await expect(body).toHaveCount(1)
 await body.getByRole('button',{name:'Comprar · 12 Ouro'}).click()
 expect((await snapshot(page)).fragments).toBe(1)
 await closeAndExit(page)
 guide=await rosetta(page)
 await guide.getByRole('button',{name:'Entregar: A Peça do Seu Vínculo'}).click()
 await guide.getByRole('button',{name:'Aceitar: A Montagem do Vínculo'}).click()
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'Ir para Casa do Ferreiro',exact:true}).click()
 await page.getByRole('button',{name:'Falar com Durnan dentro do local',exact:true}).click()
 const forge=page.getByRole('dialog',{name:'Durnan · Casa do Ferreiro'})
 const bench=forge.getByRole('region',{name:'Minigame da mesa de montagem de Durnan'})
 await expect(bench.getByText('Prévia dos atributos reais')).toBeVisible()
 const before=await snapshot(page)
 await bench.getByRole('button',{name:/Corpo Bruto · Espada/}).last().click()
 const confirm=bench.getByRole('button',{name:'Confirmar montagem'})
 await expect(confirm).toBeEnabled()
 const actualPreview=bench.locator('.modular-bench__delta')
 await expect(actualPreview).toHaveCount(8)
 await expect(actualPreview.first()).toContainText(/Dano físico/)
 // A draft cancellation does not spend currency or mutate the Bond.
 await bench.getByRole('button',{name:'Cancelar prévia'}).click()
 expect(await snapshot(page)).toMatchObject({gold:before.gold,attack:before.attack,assembly:null})
 await bench.getByRole('button',{name:/Corpo Bruto · Espada/}).last().click()
 await confirm.click()
 const after=await snapshot(page)
 expect(after.id).toBe(before.id)
 expect(after.grade).toBe(before.grade)
 expect(after.attack).toBeGreaterThan(before.attack)
 expect(after.gold).toBeLessThan(before.gold)
 expect(after.assembly).toBe('part_blade_body_t1')
 expect(after.fragments).toBe(0)
 await expect(bench.locator('.modular-bench__sprite.is-forged')).toHaveCount(1)
 await expect(bench.locator('.modular-bench__layer--body')).toHaveCount(1)
 // The component art uses a shared 16x16 viewBox, not unrelated corner thumbnails.
 const geometry=await bench.locator('.modular-bench__sprite').evaluate(el=>{
  const root=el.getBoundingClientRect()
  const child=el.querySelector('.modular-bench__layer--body')!.getBoundingClientRect()
  return {ratio:child.width/root.width,offset:Math.abs(child.left-root.left)}
 })
 expect(geometry.ratio).toBeGreaterThan(.95)
 expect(geometry.offset).toBeLessThan(3)
 for(const [w,h] of [[1366,768],[820,720],[390,844]]){
  await page.setViewportSize({width:w,height:h})
  await bench.scrollIntoViewIfNeeded()
  const outside=await bench.evaluate((element)=>{
   const box=element.getBoundingClientRect()
   return box.left<0||box.right>window.innerWidth+1||
    document.documentElement.scrollWidth>window.innerWidth+2
  })
  expect(outside,'Horizontal forge overflow at '+w+'x'+h).toBe(false)
  const narrative=await forge.evaluate(dialog=>{
   const speech=dialog.querySelector('.vn-conversation')?.getBoundingClientRect()
   const details=dialog.querySelector('.vn-details')?.getBoundingClientRect()
   return {height:speech?.height??0,overlap:Boolean(speech&&details&&speech.bottom>details.top+1)}
  })
  expect(narrative.height,'Durnan dialogue must remain readable at '+w+'x'+h).toBeGreaterThanOrEqual(110)
  expect(narrative.overlap,'Durnan dialogue must not overlap forge at '+w+'x'+h).toBe(false)
  await page.screenshot({path:testInfo.outputPath('forge-'+w+'x'+h+'.png')})
 }
 await page.setViewportSize({width:1366,height:768})
 await closeAndExit(page)
 guide=await rosetta(page)
 await guide.getByRole('button',{name:'Entregar: A Montagem do Vínculo'}).click()
 expect((await snapshot(page)).quests.three).toBe('completed')
 await page.keyboard.press('Escape')
 await page.evaluate(async()=>{
  const {flushPersistence}=await import('/src/state/gameStore.ts')
  await flushPersistence()
 })
 await page.reload()
 await page.getByRole('button',{name:'Continuar com FerreiroE2E',exact:true}).click()
 const restored=await snapshot(page)
 expect(restored.id).toBe(after.id)
 expect(restored.assembly).toBe(after.assembly)
 expect(restored.grade).toBe(after.grade)
 expect(restored.attack).toBe(after.attack)
 expect(restored.quests.three).toBe('completed')
 expect(restored.saveSchema).toBe(18)
 expect(browserErrors).toEqual([])
})

test('combat and original + modular loot claim once, recover same result after reload',async({page})=>{
 test.setTimeout(180_000)
 page.setDefaultTimeout(20_000)
 await createTerririan(page)
 const fixture=await page.evaluate(async()=>{
  const {useGameStore}=await import('/src/state/gameStore.ts')
  const {content}=await import('/src/content/catalog.ts')
  const {createBattle}=await import('/src/domain/combat/engine.ts')
  const save=structuredClone(useGameStore.getState().save!)
  save.world.currentLocationId='astravel_fungorro_01'
  save.world.trailNodeStates.astravel_fungorro_01='current'
  save.battle=createBattle(save,content.encounters.encounter_fungorro_01,content,
   'v05171-e2e-seeded-encounter',{manualInitiative:true})
  const original=content.encounters.encounter_fungorro_01.rewards.lootDefinitionIds
  const reward=save.battle.rewards.lootDefinitionIds
  useGameStore.setState({save})
  return {expected:original.length,original,items:reward,
    lootRoll:save.battle.modularLootRollV05171}
 })
 expect(fixture.lootRoll?.itemIds.length).toBeGreaterThan(0)
 for(const item of fixture.original)expect(fixture.items).toContain(item)
 await fightAndCollect(page,fixture.expected)
 const claimed=await snapshot(page)
 expect(claimed.claim).toBe(true)
 const duplicate=await page.evaluate(async()=>{
  const {useGameStore}=await import('/src/state/gameStore.ts')
  const before=structuredClone(useGameStore.getState().save!)
  useGameStore.getState().claimBattleRewards()
  const after=useGameStore.getState().save!
  return {before:before.revision,after:after.revision,
    itemsBefore:before.inventory,itemsAfter:after.inventory}
 })
 expect(duplicate.after).toBe(duplicate.before)
 expect(duplicate.itemsAfter).toEqual(duplicate.itemsBefore)
 await page.evaluate(async()=>{
  const {flushPersistence}=await import('/src/state/gameStore.ts')
  await flushPersistence()
 })
 await page.reload()
 await page.getByRole('button',{name:'Continuar com FerreiroE2E',exact:true}).click()
 const persisted=await snapshot(page)
 expect(persisted.claim).toBe(true)
 expect(persisted.revision).toBe(claimed.revision)
 expect(persisted.saveSchema).toBe(18)
})
