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
  await expect(page.getByRole('heading', { name: 'Primeira Presença Fungorra', exact: true })).toBeVisible({ timeout: 20_000 })
  await fightAndCollect(page, 1)
  await page.getByRole('button', { name: 'CONTINUAR EXPEDIÇÃO', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Astravél', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  // The encounter detail drawer opens on approach and is the foreground action.
  const encounterPanel = page.getByRole('complementary', { name: 'Painel lateral: Clareira Luminescente' })
  await expect(encounterPanel).toBeVisible({ timeout: 20_000 })
  await encounterPanel.getByRole('button', { name: 'Enfrentar Clareira Luminescente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Clareira Luminescente', exact: true })).toBeVisible({ timeout: 20_000 })
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
  await expect(page.getByText(/aceite “Caçadores Perdidos” com Vorren/).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Viewport unificada de combate' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click()
  await page.getByRole('button', { name: 'Retornar a Terran pelo Portal', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBeVisible()
})
