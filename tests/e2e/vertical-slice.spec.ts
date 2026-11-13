import { expect, test, type Page } from '@playwright/test'
import { fightAndCollect } from './helpers/combatUi'

async function createExpedition(page: Page) {
  page.setDefaultTimeout(12_000)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Aron')
  // Pontos iniciais só são distribuídos ao vincular a arma.
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  // Setup through real domain actions. The browser then exercises movement,
  // battle, manual drop collection, continuation and persistence through the UI.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const store = () => useGameStore.getState()
    store().recordCutsceneViewed('terran_arrival')
    store().recordCutsceneViewed('astravel_call')
    store().travelInTerran('location_terran_eldamar_house')
    store().discoverEldamar()
    store().offerQuest('vs_astravel_first_contact')
    store().acceptQuest('vs_astravel_first_contact')
    store().travelInTerran('location_terran_portal_plaza')
    store().enterAstravel()
  })
  await expect(page.getByRole('heading', { name: 'Astravél', exact: true })).toBeVisible()
}

test('Astravél: câmera, dois combates, coleta manual de drops e retomada do save', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await createExpedition(page)
  await expect(page.locator('.astravel-minimap')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Trilha / 0 Entrada' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  // A aproximação abre o painel: o combate começa pela ação em primeiro plano.
  const firstEncounterPanel = page.getByRole('complementary', { name: 'Painel lateral: Presença Fungorra' })
  await expect(firstEncounterPanel).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Enfrentar Fungorro próximo' })).toBeHidden()
  await firstEncounterPanel.locator('.expedition-node-detail__action').click()
  await expect(page.getByRole('heading', { name: 'Borda Luminescente: Primeira Presença Fungorra', exact: true })).toBeVisible({ timeout: 20_000 })
  await fightAndCollect(page, 1)
  // v0.5.17: central navigation must stay visible even when reward summaries scroll.
  const victoryExit=page.getByRole('button',{name:'CONTINUAR EXPEDIÇÃO',exact:true})
  await expect(victoryExit).toBeInViewport()
  await expect(page.getByRole('navigation',{name:'Próximos passos após a vitória'})).toBeVisible()
  await expect(page.getByLabel('Mochila após a vitória')).toBeVisible()
  await expect(victoryExit).toBeInViewport()
  await victoryExit.click()
  await expect(page.getByRole('heading', { name: 'Astravél', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  // The encounter detail drawer opens on approach and is the foreground action.
  const encounterPanel = page.getByRole('complementary', { name: 'Painel lateral: Clareira Luminescente' })
  await expect(encounterPanel).toBeVisible({ timeout: 20_000 })
  await encounterPanel.getByRole('button', { name: 'Enfrentar Clareira Luminescente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Borda Luminescente: Clareira Luminescente', exact: true })).toBeVisible({ timeout: 20_000 })
  await fightAndCollect(page, 3)
  await page.getByRole('button', { name: 'CONTINUAR EXPEDIÇÃO', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir Mochila', exact: true }).click()
  // Loot stacks with the same definitionId occupy one slot but retain quantity.
  const gelSlot = page.locator('.inventory-slot').filter({ hasText: 'Gel Luminescente' })
  await expect(gelSlot).toHaveCount(1)
  await expect(gelSlot).toContainText('2')
  const gelQuantity = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save!.inventory
      .filter((item) => item.definitionId === 'drop_luminous_gel')
      .reduce((total, item) => total + item.quantity, 0)
  })
  expect(gelQuantity).toBe(2)
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Tônico de Campo' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click()
  // Both desktop and narrow layouts retain a visible viewport and reachable HUD.
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('button', { name: 'Seguir objetivo' })).toBeVisible()
    const canvas = page.locator('.astravel-field canvas')
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  await expect(page.locator('.world-scene-transition')).toHaveCount(0)
  await page.screenshot({ path: '/tmp/terrunia-astravel-remake.png' })
  await page.reload()
  await page.getByRole('button', { name: 'Continuar com Aron', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Astravél', exact: true })).toBeVisible()
  const routeProgress = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const states = useGameStore.getState().save!.world.trailNodeStates
    return { completed: Object.entries(states).filter(([id, state]) => id.startsWith('astravel_') && state === 'completed').length,
      next: states.astravel_moth_crossing_04 }
  })
  expect(routeProgress.completed).toBeGreaterThanOrEqual(2)
  expect(errors).toEqual([])
})


test('v0.5.13.1: cards de habilidade visíveis e quadrados sem scroll', async ({ page }) => {
  test.setTimeout(90_000)
  await createExpedition(page)
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  const drawer = page.getByRole('complementary', { name: 'Painel lateral: Presença Fungorra' })
  await expect(drawer).toBeVisible()
  await drawer.locator('.expedition-node-detail__action').click()
  const initiative = page.getByRole('button', { name: /^Arrastar dado de iniciativa d\d+ para cima para rolar$/ })
  await expect(initiative).toBeEnabled({ timeout: 15_000 })
  await initiative.press('Enter')
  const action = page.getByRole('button', { name: 'HABILIDADES', exact: true })
  await expect(action).toBeEnabled({ timeout: 25_000 })
  await action.click()
  const picker = page.locator('.pixel-battle__submenu--skill-picker')
  await expect(picker).toBeVisible()
  await expect(picker.locator('.pixel-battle__submenu-heading')).toHaveCount(0)
  const dimensions = await picker.evaluate((element) => {
    const host = element.getBoundingClientRect()
    const cards = Array.from(element.querySelectorAll('.pixel-battle__skill-card'))
      .map((node) => node.getBoundingClientRect())
    return {
      cards: cards.length,
      scrollFree: element.scrollHeight <= element.clientHeight + 1,
      allVisible: cards.every((card) => card.left >= host.left - 1 &&
        card.right <= host.right + 1 && card.top >= host.top - 1 &&
        card.bottom <= host.bottom + 1),
      square: cards.every((card) => Math.abs(card.width - card.height) <= 2),
    }
  })
  expect(dimensions.cards).toBeGreaterThan(0)
  expect(dimensions.scrollFree).toBe(true)
  expect(dimensions.allVisible).toBe(true)
  expect(dimensions.square).toBe(true)
  await page.getByRole('button', { name: 'Voltar sem executar a ação' }).click()
  await expect(picker).toHaveCount(0)
})

test('v0.5.13.1: revisitar Astravél pelo Portal preserva acesso ao encontro 15/15', async ({ page }) => {
  await createExpedition(page)
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const { content } = await import('/src/content/catalog.ts')
    const save = structuredClone(useGameStore.getState().save!)
    for (const node of content.trails.trail_astravel_entry.nodes) {
      save.world.trailNodeStates[node.id] = node.type === 'boss' ? 'bossCurrent' : 'completed'
    }
    save.character.clan.clanId = 'dunavar' // Affiliated character can re-enter the dungeon.
    // Re-entry test skips prior narrative presentation, not the actual dungeon gate.
    save.eventLog.push('CutsceneViewed:clan_oath', 'CutsceneViewed:ruins_threshold',
      'CutsceneViewed:fungal_descent', 'CutsceneViewed:home_claimed',
      'CutsceneViewed:class_awakening', 'CutsceneViewed:colossus_aftermath')
    save.world.currentLocationId = 'astravel_entry' // retorno pelo Portal
    save.quests.main_astravel_corruption.status = 'active'
    useGameStore.setState({ save })
  })
  // This legacy re-entry regression validates the real store/domain portal
  // transition. The interactive dungeon-entry drawer is tested separately in
  // ExpeditionScreen.test.tsx (and the dungeon gameplay browser test).
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    useGameStore.getState().enterFungalChambers()
    if (useGameStore.getState().save?.world.currentLocationId !== 'dungeon_fungal_chambers')
      throw new Error('Portal re-entry must preserve the 15/15 boss gate and enter the dungeon')
  })
  await expect(page.getByRole('heading', { name: 'Câmaras Fúngicas', exact: true })).toBeVisible({ timeout: 15_000 })
  const state = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = useGameStore.getState().save!
    return { location: save.world.currentLocationId, boss: save.world.trailNodeStates.astravel_boss_preview }
  })
  expect(state).toEqual({ location: 'dungeon_fungal_chambers', boss: 'bossCurrent' })
})

test('o próximo setor exige missão aceita e permite retornar sem iniciar combate', async ({ page }) => {
  await createExpedition(page)
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const { content } = await import('/src/content/catalog.ts')
    const save = structuredClone(useGameStore.getState().save!)
    for (const node of content.trails.trail_astravel_entry.nodes) {
      save.world.trailNodeStates[node.id] = node.index < 6 ? 'completed' : node.index === 6 ? 'current' : node.type === 'boss' ? 'boss' : 'locked'
    }
    save.world.currentLocationId = 'astravel_hunter_tracks_06'
    useGameStore.setState({ save })
  })
  await page.getByRole('button', { name: /Aproximar-se de Rastros dos Caçadores/ }).click()
  await expect(page.getByRole('complementary', { name: 'Painel lateral: Rastros dos Caçadores' })).toBeVisible({ timeout: 20_000 })
  // The gate explains the unmet predecessor rather than directing the player
  // to Vorren prematurely while O Primeiro Rastro is still active.
  await expect(page.getByText(/Conclua “O Primeiro Rastro” e entregue-a a Eldamar/).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Viewport unificada de combate' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click()
  await page.getByRole('button', { name: 'Retornar a Terran pelo Portal', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBeVisible()
})
