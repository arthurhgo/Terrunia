import { expect, test, type Page } from '@playwright/test'

async function createExpedition(page: Page) {
  page.setDefaultTimeout(12_000)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Aron')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: 'Aumentar Força', exact: true }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Vincular Espada Longa — Grau I', exact: true }).click()
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

async function fightAndCollect(page: Page, expectedDropCount: number) {
  for (let turn = 0; turn < 12; turn++) {
    const attack = page.getByRole('button', { name: 'ATACAR', exact: true })
    if (await page.getByRole('heading', { name: 'VITÓRIA', exact: true }).isVisible()) break
    await expect(attack).toBeEnabled()
    await attack.click()
  }
  await expect(page.getByRole('heading', { name: 'VITÓRIA', exact: true })).toBeVisible()
  const drops = page.locator('.pixel-battle__drops button')
  await expect(drops).toHaveCount(expectedDropCount)
  for (let i = 0; i < expectedDropCount; i++) await drops.nth(i).click()
  await page.getByRole('button', { name: 'CONFIRMAR RECOMPENSAS', exact: true }).click()
}

test('Astravél: câmera, dois combates, coleta manual de drops e retomada do save', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await createExpedition(page)
  await expect(page.getByLabel('Minimapa de Astravél: 15 encontros conectados')).toBeVisible()
  await page.getByRole('button', { name: 'Abrir Trilha', exact: true }).click()
  const route = page.getByRole('complementary', { name: 'Painel lateral: Rota de Astravél' })
  await expect(route.locator('.expedition-route-sector')).toHaveCount(3)
  await expect(route.locator('.expedition-route-list__item')).toHaveCount(15)
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click()
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  await expect(page.getByRole('heading', { name: 'Primeira Presença Fungorra', exact: true })).toBeVisible({ timeout: 20_000 })
  await fightAndCollect(page, 1)
  await page.getByRole('button', { name: 'CONTINUAR EXPEDIÇÃO', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Astravél', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  await expect(page.getByRole('heading', { name: 'Clareira Luminescente', exact: true })).toBeVisible({ timeout: 20_000 })
  await fightAndCollect(page, 3)
  await page.getByRole('button', { name: 'CONTINUAR EXPEDIÇÃO', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir Mochila', exact: true }).click()
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Gel Luminescente' })).toHaveCount(2)
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
  await page.getByRole('button', { name: 'Abrir Trilha', exact: true }).click()
  await expect(page.locator('.expedition-route-list__item--completed')).toHaveCount(2)
  await expect(page.locator('.expedition-route-list__item--current')).toContainText('Travessia das Mariposas')
  expect(errors).toEqual([])
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
  await expect(page.getByRole('complementary', { name: 'Painel lateral: Rastros dos Caçadores' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/aceite “Caçadores Perdidos” com Vorren/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'ATACAR', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Retornar a Terran', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Terran', exact: true })).toBeVisible()
})
