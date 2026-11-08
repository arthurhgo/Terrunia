import { expect, test } from '@playwright/test'

test('Terran conserva os atalhos laterais; somente MENU abre a tela de progressão', async ({ page }) => {
  test.setTimeout(60_000)
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))

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

  await expect(page.getByRole('region', { name: 'Cenário contínuo de Terran' })).toBeVisible()
  await page.getByRole('button', { name: 'Pular cena' }).click()
  const stage = page.getByRole('region', { name: 'Cenário contínuo de Terran' })
  await expect(stage).toBeVisible()
  // Modern unified city: permanent status HUD + compact inventory,
  // without the retired four-button Terran rail/drawer system.
  const hud = page.getByRole('complementary', { name: 'Status permanente do personagem' })
  await expect(hud).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Diário de missões' })).toBeVisible()
  const rosettaNameplate = page.getByRole('button', { name: 'Conversar com Rosetta', exact: true })
  const icon = await rosettaNameplate.locator('.npc-question-bubble').boundingBox()
  const npcName = await rosettaNameplate.locator('.npc-nameplate__name').boundingBox()
  expect(icon).not.toBeNull()
  expect(npcName).not.toBeNull()
  expect(icon!.x + icon!.width).toBeLessThanOrEqual(npcName!.x + 2)

  await expect(page.getByRole('button', { name: 'MENU / LOCAL', exact: true })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Menu geral' }).locator('a')).toHaveCount(1)
  await hud.getByRole('button', { name: 'Mostrar Equipamentos' }).click()
  await expect(hud.locator('.equipment-grid__slot')).toHaveCount(9)
  await hud.getByRole('button', { name: 'Mostrar Status' }).click()
  await expect(hud.getByRole('progressbar', { name: 'Vida' })).toBeVisible()
  const backpack = hud.locator('.terran-character-hud__backpack > button')
  await backpack.click()
  await expect(hud.getByRole('heading', { name: 'Mochila' })).toBeVisible()
  await expect(stage).toBeVisible()
  await backpack.click()
  await expect(hud.getByRole('heading', { name: 'Mochila' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Abrir Menu' })).toBeVisible()

  await page.getByRole('link', { name: 'Abrir Menu' }).click()
  await expect(page).toHaveURL(/\/menu$/)
  await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible()
  await expect(page.getByRole('tablist', { name: 'Árvores de progressão' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Menu', exact: true })).toHaveClass(/active/)
  expect(browserErrors).toEqual([])
})
