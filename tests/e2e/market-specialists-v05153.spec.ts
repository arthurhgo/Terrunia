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
 const marketNpcNames=['Neris','Armeiro de Terran','Armadureiro de Terran','Artesão de Acessórios'] as const
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
  }else{
   const expected=[0,12,60,48][index]
   const list=dialog.getByLabel('Equipamentos individuais à venda')
   await expect(list.locator('article')).toHaveCount(expected)
   await expect(list.locator('article').first().locator('img')).toBeVisible()
   await expect(dialog.getByRole('combobox',{name:'Filtrar bônus de equipamento'})).toBeVisible()
   await expect(dialog.getByRole('button',{name:/Comprar .* ouro/}).first()).toBeEnabled()
   await expect(dialog.getByRole('group',{name:'Conjuntos disponíveis'})).toHaveCount(0)
   if(index===2)await expect(dialog.getByText(/Túnica de Linho Gasta · Tier 1/)).toBeVisible()
  }
  await page.keyboard.press('Escape')
 }
 expect(errors).toEqual([])
})
