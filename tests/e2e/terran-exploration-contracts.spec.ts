import { expect, test, type Page } from '@playwright/test'

async function fightAndCollect(page: Page, count: number) {
  for (let turn = 0; turn < 16; turn++) {
    if (await page.getByRole('heading', { name: 'VITÓRIA', exact: true }).isVisible()) break
    const attack = page.getByRole('button', { name: 'ATACAR', exact: true })
    await expect(attack).toBeEnabled()
    await attack.click()
  }
  await expect(page.getByRole('heading', { name: 'VITÓRIA', exact: true })).toBeVisible()
  const drops = page.locator('.pixel-battle__drops button')
  await expect(drops).toHaveCount(count)
  for (let index = 0; index < count; index++) await drops.nth(index).click()
  await page.getByRole('button', { name: 'CONFIRMAR RECOMPENSAS', exact: true }).click()
}

test('Terran: câmera, exploração, marcadores, drops reais e entrega de encomenda por ouro', async ({ page }) => {
  test.setTimeout(180_000)
  page.setDefaultTimeout(20_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: 'Aumentar Força', exact: true }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Vincular Espada Longa — Grau I', exact: true }).click()
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const { content } = await import('/src/content/catalog.ts')
    const { refreshQuestAvailability } = await import('/src/domain/quests/questEngine.ts')
    const { deriveCharacterStats } = await import('/src/domain/character/derivedStats.ts')
    const store = () => useGameStore.getState()
    store().recordCutsceneViewed('terran_arrival'); store().recordCutsceneViewed('astravel_call')
    let save = structuredClone(store().save!)
    // Campaign gates and attributes are fixtures; movement, acceptance, combat,
    // loot collection, inventory consumption and payment below use the real UI.
    for (const id of ['vs_astravel_first_contact','main_terran_first_home','main_vorren_bestiary','main_lithwynn_signs','side_street_arlen']) save.quests[id].status = 'completed'
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.character.attributes.strength.die = 12; save.character.attributes.vigor.die = 12
    const stats = deriveCharacterStats(save, content)
    save.vitals = { hp: stats.life.value, mp: stats.mana.value }
    save.wallet.gold = 0; save.settings.reducedMotion = true
    save = refreshQuestAvailability(save, content, save.updatedAt)
    useGameStore.setState({ save })
  })
  const field = page.locator('.pixel-city__canvas')
  await expect(field).toHaveAttribute('width', '384')
  await expect(field).toHaveAttribute('height', '256')
  await expect(page.getByLabel('Minimapa de Terran')).toBeVisible()
  await expect(page.locator('.npc-question-bubble')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Conversar com Rosetta', exact: true }).locator('.npc-question-bubble')).toHaveText('?')
  const originCamera = Number(await field.getAttribute('data-camera-x'))
  await page.screenshot({ path: '/tmp/terrunia-expanded-city.png' })
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('npc:presence_street_arlen')
  const arlen = page.getByRole('dialog', { name: 'Arlen', exact: true })
  await expect(arlen).toBeVisible({ timeout: 20_000 })
  expect(Number(await field.getAttribute('data-camera-x'))).toBeLessThan(originCamera)
  await expect(arlen.getByRole('heading', { name: '◇ Matéria para as Entregas', exact: true })).toBeVisible()
  await arlen.getByRole('button', { name: 'Ouvir a oferta', exact: true }).click()
  await arlen.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await expect(page.locator('[aria-label="Conversar com Arlen"] .npc-quest-marker')).toHaveText('◇')
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('landmark:city_contract_board')
  const board = page.getByRole('dialog', { name: 'Quadro de Encomendas', exact: true })
  await expect(board).toBeVisible({ timeout: 20_000 })
  await expect(board.locator('.city-contract')).toHaveCount(12)
  await expect(board.getByText('96 Ouro', { exact: true })).toBeVisible()
  const boardBounds = await board.boundingBox()
  expect(boardBounds!.y + boardBounds!.height).toBeLessThanOrEqual(720)
  await expect(board.getByRole('button', { name: 'Continuar explorando', exact: true })).toBeInViewport()
  await page.screenshot({ path: '/tmp/terrunia-town-contract-board.png' })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Ir para Posto de Vorren', exact: true }).click()
  await expect(page.getByRole('img', { name: /Interior pixelado de Posto de Vorren/ })).toBeVisible({ timeout: 20_000 })
  const vorren = page.getByRole('button', { name: 'Falar com Vorren dentro do local', exact: true })
  await expect(vorren.locator('.npc-quest-marker')).toHaveText('!')
  await expect(vorren.locator('.npc-quest-marker')).toHaveCSS('color', 'rgb(255, 218, 99)')
  await expect(page.locator('.pixel-interior__npc .npc-question-bubble')).toHaveCount(0)
  await page.screenshot({ path: '/tmp/terrunia-town-npc-markers.png' })
  await page.getByRole('button', { name: 'Sair do interior para as ruas de Terran', exact: true }).click()
  await page.getByRole('button', { name: 'Ir para Praça do Portal', exact: true }).click()
  await page.getByRole('button', { name: 'Entrar no Modo Ondas', exact: true }).click()
  for (let wave = 1; wave <= 3; wave++) {
    await fightAndCollect(page, wave === 3 ? 2 : 1)
    if (wave < 3) await page.getByRole('button', { name: `PRÓXIMA ONDA · ${wave + 1}`, exact: true }).click()
  }
  await page.getByRole('button', { name: 'RETORNAR A TERRAN', exact: true }).click()
  await page.getByRole('button', { name: 'Ir para Praça do Portal', exact: true }).click()
  await page.locator('.portal-hunts__entry').filter({ hasText: 'Vigília da Ruína' }).getByRole('button', { name: 'Enfrentar caçada', exact: true }).click()
  await fightAndCollect(page, 3)
  await page.getByRole('button', { name: 'VOLTAR AO PORTAL', exact: true }).click()
  const before = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = useGameStore.getState().save!
    return { gold: save.wallet.gold, fragments: save.inventory.filter((item) => item.definitionId === 'fragment_echo_crystal').length,
      status: save.quests.delivery_arlen_nuclei.status }
  })
  expect(before.fragments).toBe(1)
  expect(before.status).toBe('ready_to_turn_in')
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('npc:presence_street_arlen')
  await expect(arlen).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[aria-label="Conversar com Arlen"] .npc-quest-marker')).toHaveText('◆')
  await page.screenshot({ path: '/tmp/terrunia-town-ready-delivery.png' })
  await arlen.getByRole('button', { name: 'Entregar missão', exact: true }).click()
  await expect(page.locator('[aria-label="Conversar com Arlen"] .npc-quest-marker')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Continuar com Lysa', exact: true }).click()
  const persisted = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = useGameStore.getState().save!
    return { gold: save.wallet.gold, nuclei: save.inventory.filter((item) => item.definitionId === 'drop_fungal_nucleus').length,
      status: save.quests.delivery_arlen_nuclei.status, flags: save.world.worldFlags }
  })
  expect(persisted.gold).toBe(before.gold + 96)
  expect(persisted.nuclei).toBe(0)
  expect(persisted.status).toBe('completed')
  expect(persisted.flags).toContain('TerranLandmarkDiscovered:city_contract_board')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('combobox', { name: 'Destino em Terran' })).toBeInViewport()
  await expect(page.getByLabel('Minimapa de Terran')).toBeInViewport()
  const hudBounds = await page.getByRole('complementary', { name: 'Status permanente do personagem' }).boundingBox()
  expect(hudBounds!.x + hudBounds!.width).toBeLessThanOrEqual(390)
  const fieldBounds = await field.boundingBox()
  expect(fieldBounds!.x + fieldBounds!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '/tmp/terrunia-town-mobile.png' })
  expect(errors).toEqual([])
})
