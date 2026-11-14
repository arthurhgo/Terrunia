import { expect,test } from '@playwright/test'

test('Mercado v0.5.15.3: Neris só vende consumíveis, 3 NPCs vendem peças ilustradas',async({page})=>{
 test.setTimeout(180_000)
 page.setDefaultTimeout(20000)
 const errors:string[]=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto('/login')
 await page.getByRole('button',{name:'Continuar como convidado local'}).click()
 await page.getByPlaceholder('Ex.: Aron').fill('MercadorQA')
 await page.getByRole('button',{name:'Confirmar e continuar'}).click()
 await page.getByRole('button',{name:'Escolher Espada Longa',exact:true}).press('Enter')
 await page.getByRole('button',{name:'Distribuir pontos e vincular Espada Longa',exact:true}).click()
 for(const name of ['Força','Força','Astúcia','Agilidade','Vigor','Espírito'])
  await page.getByRole('button',{name:'Aumentar '+name}).click()
 await page.getByRole('button',{name:'Confirmar Vínculo de Espada Longa — Grau I',exact:true}).click()
 await page.getByRole('button',{name:'Pular cena'}).click()
 await page.evaluate(async()=>{
  const {useGameStore}=await import('/src/state/gameStore.ts')
  const save=structuredClone(useGameStore.getState().save!)
  save.wallet.gold=2500
  save.settings.reducedMotion=true
  useGameStore.setState({save})
 })
 await page.getByRole('button',{name:'Ir para Mercado',exact:true}).click()
 const marketNpcNames=['Neris','Torvan','Brenna','Ilyra'] as const
 for(const [index,name] of marketNpcNames.entries()){
  const npc=page.getByRole('button',{name:'Falar com '+name+' dentro do local',exact:true})
  await expect(npc).toBeVisible()
  await npc.click()
  const dialog=page.getByRole('dialog',{name,exact:true})
  await expect(dialog).toBeVisible()
  if(index===0){
   await expect(dialog.getByText('Tônico de Campo',{exact:true})).toBeVisible()
   await expect(dialog.getByRole('button',{name:'Comprar Poção Restauradora por 28 ouro'})).toBeVisible()
   await expect(dialog.getByRole('group',{name:'Conjuntos disponíveis'})).toHaveCount(0)
   const buy=dialog.getByRole('button',{name:'Comprar Tônico de Campo por 18 ouro'})
   const tonic=buy.locator('xpath=ancestor::article')
   await expect(tonic.locator('img')).toBeVisible()
   await buy.click()
   expect(await page.evaluate(async()=>{
    const {useGameStore}=await import('/src/state/gameStore.ts')
    const save=useGameStore.getState().save!
    return save.inventory.some(i=>i.definitionId==='consumable_minor_tonic')
   })).toBe(true)
  }else if(index===1){
   const modular=dialog.getByLabel('Peças estruturais de arma · Torvan')
   await expect(modular.locator('article')).toHaveCount(32)
   await expect(modular.getByText(/Não vendemos armas completas/)).toBeVisible()
   await expect(modular.getByRole('button',{name:/Comprar ·/}).first()).toBeEnabled()
   await expect(dialog.getByRole('group',{name:'Conjuntos disponíveis'})).toHaveCount(0)
  }else{
   const expected=[0,0,60,48][index]
   const list=dialog.getByLabel('Equipamentos individuais à venda')
   await expect(list.locator('article')).toHaveCount(expected)
   await expect(list.locator('article').first().locator('img')).toBeVisible()
   await expect(dialog.getByRole('combobox',{name:'Filtrar bônus de equipamento'})).toBeVisible()
   await expect(dialog.getByRole('button',{name:/Comprar .* ouro/}).first()).toBeEnabled()
   await expect(dialog.getByRole('group',{name:'Conjuntos disponíveis'})).toHaveCount(0)
   if(index===2){
    await expect(dialog.getByText(/Túnica de Linho Gasta · Tier 1/)).toBeVisible()
    const before=await page.evaluate(async()=>{
      const {useGameStore}=await import('/src/state/gameStore.ts')
      const {deriveCharacterStats}=await import('/src/domain/character/derivedStats.ts')
      const {content}=await import('/src/content/catalog.ts')
      const save=useGameStore.getState().save!
      return {gold:save.wallet.gold,defense:deriveCharacterStats(save,content).defense.value}
    })
    const buyAndWear=dialog.getByRole('button',{name:/Comprar e equipar Armadura Treino do Guarda/})
    await expect(buyAndWear).toBeEnabled()
    await buyAndWear.click()
    const after=await page.evaluate(async()=>{
      const {useGameStore}=await import('/src/state/gameStore.ts')
      const {deriveCharacterStats}=await import('/src/domain/character/derivedStats.ts')
      const {content}=await import('/src/content/catalog.ts')
      const save=useGameStore.getState().save!
      return {gold:save.wallet.gold,defense:deriveCharacterStats(save,content).defense.value,
        armor:save.equippedBasicArmor?.definitionId}
    })
    expect(after.gold).toBeLessThan(before.gold)
    expect(after.defense).toBeGreaterThan(before.defense)
    expect(after.armor).toMatch(/^eq_v0515_terran_/)
   }
  }
  await page.keyboard.press('Escape')
  await expect(page.locator('.terran-game__drawer')).toHaveCount(0)
 }
 expect(errors).toEqual([])
})
