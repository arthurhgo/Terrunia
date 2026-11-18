import { expect, test } from '@playwright/test'

test('v0.6 isométrico: movimentação, NPCs, interior e retorno preservam o save', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Mira')
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  await page.getByRole('button', { name: 'Pular cena' }).click()
  // Client-side navigation retains the guest GameBoot session in memory.
  await page.getByRole('link', { name: 'Abrir laboratório isométrico de Terran' }).click()
  await expect(page).toHaveURL(/\/visual-v06$/)
  await expect(page.getByRole('heading', { name: 'Terran isométrica · v0.6' })).toBeVisible()
  await expect(page.locator('.iso-preview__hero-token')).toHaveCount(1)
  await expect(page.locator('.iso-preview__building')).toHaveCount(8)
  await expect(page.locator('.iso-preview__npc-token').first()).toBeVisible()
  const before = await page.locator('.iso-preview__hero-token').evaluate((element) => element.style.left)
  await page.keyboard.down('d')
  await page.waitForTimeout(280)
  await page.keyboard.up('d')
  const after = await page.locator('.iso-preview__hero-token').evaluate((element) => element.style.left)
  expect(after).not.toBe(before)
  await page.getByRole('button', { name: 'Selecionar Casa de Eldamar' }).click()
  await expect(page.getByRole('heading', { name: 'Casa de Eldamar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Visualizar interior 3D' }).click()
  await expect(page.locator('.iso-context__room')).toBeVisible()
  await page.getByRole('link', { name: 'Continuar no jogo completo' }).click()
  await expect(page).toHaveURL(/\/play$/)
  expect(errors).toEqual([])
})
