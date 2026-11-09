import { expect, test, type Page } from '@playwright/test'

async function meetRosetta(page: Page) {
  await page.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('npc:presence_rosetta')
  const guide = page.getByRole('dialog', { name: 'Orientações de Rosetta' })
  await expect(guide).toBeVisible({ timeout: 20_000 })
  return guide
}

async function leaveRoom(page: Page) {
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Sair do interior para as ruas de Terran', exact: true }).click()
}

test('Rosetta ensina compras, equipamento e reforço reais; histórico recolhido e caminhos dourados', async ({ page }) => {
  test.setTimeout(180_000)
  page.setDefaultTimeout(20_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  // Os seis pontos são aplicados durante o Vínculo, não na criação.
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  await page.getByRole('button', { name: 'Pular cena' }).click()

  const rosetta = page.getByRole('button', { name: 'Conversar com Rosetta', exact: true })
  await rosetta.hover()
  const paths = page.getByRole('img', { name: 'Caminhos dourados de Rosetta', exact: true })
  await expect(paths).toBeVisible()
  await expect(paths.locator('path[data-quest-ids~="vs_astravel_first_contact"]')).toHaveAttribute('d', /L /)
  await expect(paths).toHaveCSS('pointer-events', 'none')
  await page.screenshot({ path: '/tmp/terrunia-rosetta-gold-paths.png' })
  await page.getByRole('link', { name: 'Abrir Menu', exact: true }).hover()
  await expect(paths).toHaveCount(0)
  await rosetta.focus()
  await expect(paths).toBeVisible()
  await page.locator('.pixel-city__canvas').focus()
  await expect(paths).toHaveCount(0)

  let guide = await meetRosetta(page)
  await expect(guide.getByRole('heading', { name: 'Uma Primeira Proteção', exact: true })).toBeVisible()
  await expect(guide.getByText(/Visite o Mercado de Terran/)).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  const mobileLesson = await guide.boundingBox()
  expect(mobileLesson!.x).toBeGreaterThanOrEqual(0)
  expect(mobileLesson!.x + mobileLesson!.width).toBeLessThanOrEqual(390)
  expect(mobileLesson!.y).toBeGreaterThanOrEqual(0)
  expect(mobileLesson!.y + mobileLesson!.height).toBeLessThanOrEqual(844)
  await guide.getByRole('button', { name: 'Aceitar missão', exact: true }).scrollIntoViewIfNeeded()
  await guide.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.keyboard.press('Escape')
  // No starter armor exists until the player explicitly chooses the quest reward.
  expect(await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save!.inventory.filter((item) => item.definitionId.startsWith('equipment_')).length
  })).toBe(0)
  await page.getByRole('button', { name: 'Ir para Mercado', exact: true }).click()
  await page.getByRole('button', { name: 'Sair do interior para as ruas de Terran', exact: true }).click()
  guide = await meetRosetta(page)
  await expect(guide.getByRole('group', { name: 'Escolha um equipamento inicial' })).toBeVisible()
  const collectReward = guide.getByRole('button', { name: 'Receber equipamento escolhido', exact: true })
  await expect(collectReward).toBeDisabled()
  await guide.getByRole('radio').first().check()
  await collectReward.click()
  await expect(guide.getByRole('heading', { name: 'Comprar para se Preparar', exact: true })).toBeVisible()
  await guide.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await guide.getByRole('button', { name: 'Abrir mochila', exact: true }).click()
  const inventory = page.getByRole('region', { name: 'Mochila do personagem' })
  const tunicButton = inventory.getByRole('button', { name: /Túnica de Linho Gasta/ })
  await tunicButton.hover()
  await expect(page.getByRole('tooltip', { name: 'Status de Túnica de Linho Gasta' })).toContainText('Tier 1')
  await tunicButton.click()
  await inventory.getByRole('button', { name: 'Equipar Túnica de Linho Gasta', exact: true }).click()
  await page.getByRole('button', { name: 'Mostrar Equipamentos' }).click()
  const wornTunic = page.getByRole('button', { name: /Túnica \/ Armadura: Túnica de Linho Gasta/ })
  await expect(wornTunic).toHaveAttribute('title', /Túnica de Linho Gasta/)
  await expect(wornTunic.locator('img')).toHaveAttribute('src', /item_worn_linen_tunic/)
  await page.getByRole('button', { name: 'Mostrar Status' }).click()
  await page.locator('.terran-character-hud__backpack > button').click()
  await page.getByRole('button', { name: 'Ir para Mercado', exact: true }).click()
  await page.getByRole('button', { name: 'Falar com Edran dentro do local', exact: true }).click()
  let shop = page.getByRole('dialog', { name: 'Edran', exact: true })
  await shop.getByRole('button', { name: 'Comprar Tônico de Campo por 18 ouro', exact: true }).click()
  await leaveRoom(page)
  guide = await meetRosetta(page)
  await guide.getByRole('button', { name: 'Entregar lição', exact: true }).click()
  // Leather is an optional side quest: keep the chosen tunic and progress directly to the forge.
  await expect(guide.getByRole('heading', { name: 'O Primeiro Aprimoramento', exact: true })).toBeVisible()
  await guide.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Ir para Casa do Ferreiro', exact: true }).click()
  await page.getByRole('button', { name: 'Falar com Durnan dentro do local', exact: true }).click()
  const forge = page.getByRole('dialog', { name: 'Durnan · Casa do Ferreiro', exact: true })
  const refine = forge.getByRole('button', { name: 'Aprimorar Túnica de Linho Gasta para +1', exact: true })
  await refine.click()
  await expect(refine).toBeDisabled()
  await expect(forge.getByRole('heading', { name: 'Túnica de Linho Gasta +1', exact: true })).toBeVisible()
  await page.screenshot({ path: '/tmp/terrunia-tutorial-forge.png' })
  await leaveRoom(page)
  guide = await meetRosetta(page)
  await guide.getByRole('button', { name: 'Entregar lição', exact: true }).click()
  await expect(guide.getByText(/As três lições principais foram concluídas/)).toBeVisible()
  await guide.getByRole('button', { name: 'Consultar diário de missões', exact: true }).click()
  const journal = page.getByRole('region', { name: 'Diário de missões', exact: true })
  const history = journal.getByRole('button', { name: 'Expandir missões concluídas (3)', exact: true })
  const completedRows = journal.locator('.quest-journal-group--completed .quest-row')
  await expect(history).toHaveAttribute('aria-expanded', 'false')
  await expect(completedRows).toHaveCount(0)
  await page.screenshot({ path: '/tmp/terrunia-completed-collapsed.png' })
  await history.focus()
  await history.press('Enter')
  await expect(completedRows).toHaveCount(3)
  await journal.getByRole('button', { name: 'Recolher missões concluídas (3)', exact: true }).click()
  await expect(completedRows).toHaveCount(0)
  await page.getByRole('link', { name: 'Terran', exact: true }).click()

  await page.evaluate(async () => { const { flushPersistence } = await import('/src/state/gameStore.ts'); await flushPersistence() })
  await page.reload()
  await page.getByRole('button', { name: 'Continuar com Lysa', exact: true }).click()
  const persisted = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = useGameStore.getState().save!
    return { schema: save.schemaVersion, gold: save.wallet.gold,
      armor: save.equippedBasicArmor, equippedId: save.character.basicArmorInstanceId,
      lessons: Object.values(save.quests).filter((quest) => quest.questId.startsWith('rosetta_tutorial_')).map((quest) => quest.status),
      spareTunics: save.inventory.filter((item) => item.definitionId.includes('tunic')).length }
  })
  expect(persisted).toMatchObject({ schema: 17, gold: 11, armor: { definitionId: 'equipment_worn_linen_tunic', refinementLevel: 1 }, lessons: ['completed','completed','available','completed'], spareTunics: 0 })
  expect(persisted.equippedId).toBe(persisted.armor?.instanceId)

  // Only this extra offer is a visual fixture, to check a secondary route without replaying the story.
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.quests.side_street_arlen.status = 'available'
    useGameStore.setState({ save })
  })
  await rosetta.hover()
  await expect(paths.locator('path[data-quest-ids~="side_street_arlen"]')).toHaveAttribute('d', /L /)
  await expect(paths.locator('path[data-quest-ids*="rosetta_tutorial_"]')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  guide = await meetRosetta(page)
  await guide.getByRole('button', { name: 'Mostrar caminhos dourados para novas missões', exact: true }).click()
  await expect(paths).toBeVisible()
  await expect(paths).toHaveAttribute('viewBox', '0 0 768 512')
  await page.screenshot({ path: '/tmp/terrunia-rosetta-mobile-paths.png' })
  await page.getByRole('button', { name: 'Ocultar caminhos', exact: true }).click()
  await expect(paths).toHaveCount(0)
  expect(errors).toEqual([])
})
