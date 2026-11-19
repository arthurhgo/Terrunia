import { expect, test } from '@playwright/test'
import { projectTerran } from '../../src/ui/terran/terranProjection'

test('Terran opens in 3D with live controls, quests and interiors', async ({ page }) => {
  test.setTimeout(80_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Aren')
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa' }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  await page.getByRole('button', { name: 'Pular cena' }).click()

  const city = page.locator('.pixel-city')
  const canvas = city.locator('canvas')
  await expect(city).toHaveAttribute('data-city-visual', '3d')
  await expect(city.getByRole('button', { name: 'Ver em 2D' })).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-player-y', '292')
  await canvas.focus()
  await page.keyboard.down('w')
  const playerY = async () => Number(await canvas.getAttribute('data-player-y'))
  try {
    await expect.poll(playerY).toBeLessThan(283)
  } finally {
    await page.keyboard.up('w')
  }
  // The south face of the Portal collision footprint is y=279.
  expect(await playerY()).toBeGreaterThanOrEqual(279)

  const ground = { x: 336, y: 306 }
  const projected = projectTerran(ground)
  const click = await canvas.evaluate((element, point) => {
    const rect = element.getBoundingClientRect()
    const surface = element as HTMLCanvasElement
    return {
      x: (point.x - Number(surface.dataset.cameraX)) * rect.width / surface.width,
      y: (point.y - Number(surface.dataset.cameraY)) * rect.height / surface.height,
    }
  }, projected)
  await canvas.click({ position: click })
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-player-x')) - ground.x)).toBeLessThan(3)
  await expect.poll(async () => Math.abs(await playerY() - ground.y)).toBeLessThan(3)

  await city.getByRole('button', { name: 'Conversar com Rosetta', exact: true }).click()
  const guide = page.getByRole('dialog', { name: 'Orientações de Rosetta' })
  await guide.getByRole('button', { name: 'Aceitar missão', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Diário de missões' })
    .getByRole('button', { name: /rastrear missão em destaque: Uma Primeira Proteção/i })).toBeVisible()
  await guide.getByRole('button', { name: 'Encerrar diálogo' }).click()
  await city.getByRole('combobox', { name: 'Destino em Terran' }).selectOption('location_terran_bond_workshop')
  await expect(page.getByRole('img', { name: /Interior pixelado de Mercado/ })).toBeVisible({ timeout: 24_000 })
  await expect(page.locator('.pixel-interior')).toHaveAttribute('data-interior-visual', '3d')
  await expect(page.getByRole('button', { name: 'Ver em 2D' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Sair do interior para as ruas de Terran' }).click()
  await expect(city).toHaveAttribute('data-city-visual', '3d', { timeout: 15_000 })
  expect(errors).toEqual([])
})
