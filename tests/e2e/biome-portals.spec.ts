import { expect, test } from '@playwright/test'

test('v0.5.10: Portal inicia Cerrado e Elduran, com exploração e combate por região', async ({ page }, testInfo) => {
  test.setTimeout(180_000)
  page.setDefaultTimeout(20_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Vela')
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()

  // Fixture: accepted Astravél victory is the only gate precondition. All
  // Portal navigation and combat start below go through actual player controls.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.world.trailNodeStates.astravel_boss_preview = 'completed'
    save.eventLog.push('CutsceneViewed:terran_arrival', 'CutsceneViewed:astravel_call')
    save.settings.reducedMotion = true
    useGameStore.setState({ save })
    window.history.pushState({}, '', '/portal-hub')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { name: 'Escolha seu destino' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Deserto de Elduran · Bloqueada/ })).toBeDisabled()
  await page.getByRole('button', { name: /Cerrado Místico · Iniciar/ }).click()
  await expect(page.locator('.world-scene[data-scene="expedition"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cerrado Místico' })).toBeVisible()
  await expect(page.getByLabel('Minimapa de Cerrado Místico: 4 encontros conectados')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('cerrado-world.png'), animations: 'disabled' })
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  const cerradoNode = page.getByRole('complementary', { name: 'Painel lateral: Sombras do Capim' })
  await expect(cerradoNode).toBeVisible({ timeout: 30_000 })
  await cerradoNode.locator('.expedition-node-detail__action').click()
  await expect(page.getByRole('heading', { name: 'Sombras do Capim' })).toBeVisible()
  const cerradoBattle = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save?.battle?.encounterId
  })
  expect(cerradoBattle).toBe('encounter_cerrado_shadow_01')

  // Fixture only for the SECOND route: it simulates a completed Cerrado
  // campaign. In gameplay the boss is completed by the existing claim flow.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.battle = null
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.world.trailNodeStates.cerrado_storm_04 = 'completed'
    save.vitals.hp = Math.max(1, save.vitals.hp)
    useGameStore.setState({ save })
    window.history.pushState({}, '', '/portal-hub')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.getByRole('button', { name: /Deserto de Elduran · Iniciar/ }).click()
  await expect(page.locator('.world-scene[data-scene="expedition"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Deserto de Elduran' })).toBeVisible()
  await expect(page.getByLabel('Minimapa de Deserto de Elduran: 4 encontros conectados')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('elduran-world.png'), animations: 'disabled' })
  await page.getByRole('button', { name: 'Seguir objetivo' }).click()
  const elduranNode = page.getByRole('complementary', { name: 'Painel lateral: Passagem dos Chacais' })
  await expect(elduranNode).toBeVisible({ timeout: 30_000 })
  await elduranNode.locator('.expedition-node-detail__action').click()
  await expect(page.getByRole('heading', { name: 'Passagem dos Chacais' })).toBeVisible()
  expect(await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save?.battle?.encounterId
  })).toBe('encounter_elduran_jackals_01')
  expect(errors).toEqual([])
})
