import { expect, test } from '@playwright/test'

/**
 * v0.5.9: Portal as a deliberate activity selector. The game is booted with
 * a development-only local guest; the browser never touches production auth.
 */
test('Portal v0.5.9: buttons, level gates and progressive enemy sprite', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: 'Aumentar Força', exact: true }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Vincular Espada Longa — Grau I', exact: true }).click()

  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.world.trailNodeStates.astravel_entry = 'completed'
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.character.level = 3
    save.quests.vs_astravel_first_contact.status = 'completed'
    useGameStore.setState({ save })
    // BrowserRouter listens to popstate. Do not reload or bypass gameplay on action.
    window.history.pushState({}, '', '/portal-hub')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { name: 'Escolha seu destino' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Floresta de Astravél · Iniciar/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /Modo Ondas · Iniciar/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /Rastro Micelial · Bloqueada/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Guardiões do Limiar · Bloqueada/ })).toBeDisabled()
  await expect(page.locator('.portal-hub__choice')).toHaveCount(7)
  await expect(page.locator('.portal-hub__chapters .portal-hub__chapter')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/portal-v059-desktop.png' })

  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.character.level = 4
    save.quests.main_astravel_lost_hunters.status = 'completed'
    useGameStore.setState({ save })
  })
  const hunt = page.getByRole('button', { name: /Rastro Micelial · Iniciar/ })
  await expect(hunt).toBeEnabled()
  await hunt.click()
  await expect(page.getByRole('heading', { name: 'Rastro Micelial' })).toBeVisible()
  await expect(page.locator('.pixel-battle__enemy .enemy-motion-sprite')).toHaveCount(2)
  const sheets = await page.locator('.pixel-battle__enemy .enemy-motion-sprite').evaluateAll((elements) =>
    elements.map((el) => ({
      animation: getComputedStyle(el).animationName,
      background: getComputedStyle(el).backgroundImage,
    })),
  )
  expect(sheets.every((sheet) => sheet.background.includes('_motion.png'))).toBe(true)
  await page.screenshot({ path: 'test-results/portal-v059-combat.png' })
  expect(errors).toEqual([])
})
