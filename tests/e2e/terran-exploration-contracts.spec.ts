import { expect, test } from '@playwright/test'
import { fightAndCollect } from './helpers/combatUi'

test('Terran: câmera, exploração, marcadores, drops reais e entrega de encomenda por ouro', async ({ page }, testInfo) => {
  test.setTimeout(240_000)
  page.setDefaultTimeout(20_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  // Pontos iniciais só são distribuídos ao vincular a arma.
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const { content } = await import('/src/content/catalog.ts')
    const { refreshQuestAvailability } = await import('/src/domain/quests/questEngine.ts')
    const { deriveCharacterStats } = await import('/src/domain/character/derivedStats.ts')
    const { equipmentOffersV0515 } = await import('/src/content/equipmentV0515.ts')
    const store = () => useGameStore.getState()
    store().recordCutsceneViewed('terran_arrival'); store().recordCutsceneViewed('astravel_call')
    let save = structuredClone(store().save!)
    // Campaign gates and attributes are fixtures; movement, acceptance, combat,
    // loot collection, inventory consumption and payment below use the real UI.
    for (const id of ['vs_astravel_first_contact','main_terran_first_home','main_vorren_bestiary','main_lithwynn_signs','side_street_arlen']) save.quests[id].status = 'completed'
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.character.attributes.strength.die = 12; save.character.attributes.vigor.die = 12
    // This E2E checks movement, real initiative, battle UI, loot and quests;
    // it already uses a prepared d12 character. Give it real neutral G3 gear
    // so the rebudgeted Wave fights do not incorrectly test a naked endgame run.
    const options = equipmentOffersV0515.filter(offer =>
      offer.channel === 'PUBLIC_TERRAN' && offer.tier === 1 &&
      offer.recommendedClassId === 'sentinela_da_luz')
    for (const slot of ['weapon','armor','helmet','pants','boots','accessoryA','accessoryB'] as const) {
      const offer = options.find(candidate => candidate.slot === slot)!
      const equipped = {
        instanceId: 'ui-qa-' + slot, definitionId: offer.id, quantity: 1,
        rarity: 'common' as const, locked: false, favorite: false,
        acquiredAt: '2026-11-10T12:00:00Z', refinementLevel: 2,
      }
      if (slot === 'weapon') save.equippedGearStyles = { weapon: equipped }
      else if (slot === 'armor') {
        save.equippedBasicArmor = equipped
        save.character.basicArmorInstanceId = equipped.instanceId
      } else save.equippedComplementary = { ...save.equippedComplementary, [slot]: equipped }
    }
    const stats = deriveCharacterStats(save, content)
    save.vitals = { hp: stats.life.value, mp: stats.mana.value }
    save.wallet.gold = 0; save.settings.reducedMotion = true
    save = refreshQuestAvailability(save, content, save.updatedAt)
    useGameStore.setState({ save })
  })
  const field = page.locator('.pixel-city__canvas')
  // The responsive camera expands its logical world area rather than stretching
  // the old 384×256 view. Pointer mapping and minimap use this same canvas.
  await expect.poll(() => field.evaluate((node) => (node as HTMLCanvasElement).width)).toBeGreaterThan(384)
  await expect.poll(() => field.evaluate((node) => (node as HTMLCanvasElement).height)).toBeGreaterThan(256)
  await expect(page.getByLabel('Minimapa de Terran')).toBeVisible()
  await expect(page.locator('.npc-question-bubble')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Conversar com Rosetta', exact: true }).locator('.npc-question-bubble')).toHaveText('?')
  const originCamera = Number(await field.getAttribute('data-camera-x'))
  await page.screenshot({ path: testInfo.outputPath('terrunia-expanded-city.png') })
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('npc:presence_street_arlen')
  const arlen = page.getByRole('dialog', { name: 'Arlen', exact: true })
  await expect(arlen).toBeVisible({ timeout: 20_000 })
  expect(Number(await field.getAttribute('data-camera-x'))).toBeLessThan(originCamera)
  await expect(arlen.getByRole('heading', { name: '◇ Matéria para as Entregas', exact: true })).toBeVisible()
  await arlen.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await expect(page.locator('[aria-label="Conversar com Arlen"] .npc-quest-marker')).toHaveText('◇')
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('landmark:city_contract_board')
  const board = page.getByRole('dialog', { name: 'Quadro de Encomendas', exact: true })
  await expect(board).toBeVisible({ timeout: 20_000 })
  await expect(board.locator('.city-contract')).toHaveCount(12)
  await expect(board.getByText('96 Ouro', { exact: true })).toBeVisible()
  const boardBounds = await board.boundingBox()
  expect(boardBounds!.y + boardBounds!.height).toBeLessThanOrEqual(720)
  await expect(board.getByRole('button', { name: 'Continuar explorando', exact: true })).toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath('terrunia-town-contract-board.png') })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Ir para Posto de Vorren', exact: true }).click()
  await expect(page.getByRole('img', { name: /Interior pixelado de Posto de Vorren/ })).toBeVisible({ timeout: 20_000 })
  const vorren = page.getByRole('button', { name: 'Falar com Vorren dentro do local', exact: true })
  await expect(vorren.locator('.npc-quest-marker')).toHaveText('!')
  await expect(vorren.locator('.npc-quest-marker')).toHaveCSS('color', 'rgb(255, 218, 99)')
  await expect(page.locator('.pixel-interior__npc .npc-question-bubble')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('terrunia-town-npc-markers.png') })
  await page.getByRole('button', { name: 'Sair do interior para as ruas de Terran', exact: true }).click()
  // Movement/camera are covered above. For repeatable combat, enter the Portal
  // through a domain travel fixture and SPA route, never a full-page reload.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    window.history.pushState({}, '', '/portal-hub')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('region', { name: 'Atividades da Praça do Portal' })).toBeVisible()
  await page.getByRole('button', { name: /Modo Ondas · Iniciar/ }).click()
  for (let wave = 1; wave <= 3; wave++) {
    await fightAndCollect(page, wave === 3 ? 2 : 1)
    if (wave < 3) await page.getByRole('button', { name: `PRÓXIMA ONDA · ${wave + 1}`, exact: true }).click()
  }
  await page.getByRole('button', { name: 'RETORNAR A TERRAN', exact: true }).click()
  // Movement/camera are covered above. For repeatable combat, enter the Portal
  // through a domain travel fixture and SPA route, never a full-page reload.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    window.history.pushState({}, '', '/portal-hub')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('region', { name: 'Atividades da Praça do Portal' })).toBeVisible()
  await page.getByRole('button', { name: /Vigília da Ruína · Iniciar/ }).click()
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
  await page.screenshot({ path: testInfo.outputPath('terrunia-town-ready-delivery.png') })
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
  // In compact viewport the status rail is intentionally collapsed into a
  // side tab; opening the tab must place the full HUD inside the viewport.
  const statusToggle = page.getByRole('button', { name: 'Abrir ou fechar aba de status' })
  await expect(statusToggle).toBeVisible()
  await statusToggle.click()
  const hudBounds = await page.getByRole('complementary', { name: 'Status permanente do personagem' }).boundingBox()
  expect(hudBounds).not.toBeNull()
  expect(hudBounds!.x).toBeGreaterThanOrEqual(0)
  expect(hudBounds!.x + hudBounds!.width).toBeLessThanOrEqual(390)
  await statusToggle.click()
  const fieldBounds = await field.boundingBox()
  expect(fieldBounds!.x + fieldBounds!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: testInfo.outputPath('terrunia-town-mobile.png') })
  // v0.5.10: full-screen layout contract and visual snapshots at all seven
  // supported review sizes. Real guest campaign & persisted save established above.
  for (const { width, height } of [
    { width: 1366, height: 768 }, { width: 1920, height: 1080 },
    { width: 1440, height: 900 }, { width: 1024, height: 768 },
    { width: 2560, height: 1080 }, { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width, height })
    await expect(page.locator('.immersive-controls')).toBeVisible()
    await expect(page.locator('.game-footer')).toHaveCount(0)
    await expect(field).toBeVisible()
    // Wait for the ResizeObserver to settle before inspecting camera geometry.
    await expect.poll(() => field.evaluate((node) => (node as HTMLCanvasElement).width)).toBeGreaterThan(0)
    const bounds = await field.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(-1)
    expect(bounds!.y).toBeGreaterThanOrEqual(-1)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1)
    await page.screenshot({ path: testInfo.outputPath(`terran-${width}x${height}.png`), animations: 'disabled' })
  }
  expect(errors).toEqual([])
})
