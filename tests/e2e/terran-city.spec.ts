import { expect, test } from '@playwright/test'

test('Terran conserva os atalhos laterais; somente MENU abre a tela de progressão', async ({ page }) => {
  test.setTimeout(60_000)
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))

  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: /Executar Vínculo da Arma/ }).click()

  await expect(page.getByRole('heading', { name: 'Terran', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pular cena' }).click()
  const stage = page.getByRole('region', { name: 'Cenário contínuo de Terran' })
  await expect(stage).toBeVisible()
  const rail = page.getByRole('navigation', { name: 'Menu de Terran' })
  await expect(rail.getByRole('button')).toHaveCount(4)
  await expect(page.getByRole('link', { name: 'Abrir Menu' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)

  const inventoryTab = rail.getByRole('button', { name: 'Abrir Inventário e Nexo' })
  await inventoryTab.hover()
  const [stageBounds, tabBounds] = await Promise.all([stage.boundingBox(), inventoryTab.boundingBox()])
  expect(stageBounds).not.toBeNull()
  expect(tabBounds).not.toBeNull()
  expect(tabBounds!.x + tabBounds!.width).toBeLessThanOrEqual(stageBounds!.x + 1)

  await rail.getByRole('button', { name: 'Abrir Local' }).click()
  const map = page.getByRole('complementary', { name: 'Painel lateral: Mapa de Terran' })
  await expect(map).toBeVisible()
  await expect(map.getByRole('link', { name: 'Ampliar mapa do continente' })).toBeVisible()
  await expect(stage).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await inventoryTab.click()
  const drawer = page.getByRole('complementary', { name: 'Painel lateral: Inventário e Nexo' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('heading', { name: 'Status do personagem' })).toBeVisible()
  await expect(drawer.getByRole('heading', { name: 'Inventário' })).toBeVisible()
  await expect(drawer.getByRole('group', { name: 'Seções de Inventário e Nexo' })).toHaveCount(0)
  const drawerBounds = await drawer.boundingBox()
  expect(drawerBounds).not.toBeNull()
  expect(drawerBounds!.x + drawerBounds!.width).toBeLessThanOrEqual(stageBounds!.x + 1)
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await rail.getByRole('button', { name: 'Abrir Missões' }).click()
  await expect(page.getByRole('region', { name: 'Registro de missões em grid' })).toBeVisible()
  await expect(stage).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  await page.getByRole('link', { name: 'Abrir Menu' }).click()
  await expect(page).toHaveURL(/\/menu$/)
  await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible()
  await expect(page.getByRole('tablist', { name: 'Árvores de progressão' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Menu', exact: true })).toHaveClass(/active/)
  expect(browserErrors).toEqual([])
})
