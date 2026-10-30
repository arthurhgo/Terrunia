import { expect, test } from '@playwright/test'

test('Terran é uma cidade pixelada com sete instituições e painéis sem trocar o cenário', async ({ page }) => {
  test.setTimeout(60_000)
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: /Executar Vínculo da Arma/ }).click()

  await expect(page.getByRole('heading', { name: 'Terran', exact: true })).toBeVisible()
  await expect(page.getByText('HOME · CIDADE-BASE DO JOGADOR')).toBeVisible()
  await expect(page.getByRole('dialog', { name: /TERRAN · O PRIMEIRO PASSO/ })).toBeVisible()
  await page.getByRole('button', { name: 'Pular cena' }).click()
  const city = page.getByRole('img', { name: /Terran vista superior 3\/4/ })
  await expect(city).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)

  // On desktop the contextual pane must occupy the empty area left of the
  // rail, never intercepting clicks or covering pixels of the game stage.
  const stage = page.getByRole('region', { name: 'Cenário contínuo de Terran' })
  const inventoryTab = page.getByRole('button', { name: 'Abrir Inventário e Nexo' })
  await inventoryTab.hover()
  const [stageBounds, tabBounds] = await Promise.all([stage.boundingBox(), inventoryTab.boundingBox()])
  expect(stageBounds).not.toBeNull()
  expect(tabBounds).not.toBeNull()
  expect(tabBounds!.x + tabBounds!.width).toBeLessThanOrEqual(stageBounds!.x + 1)
  await inventoryTab.click()
  const drawer = page.getByRole('complementary', { name: 'Painel lateral: Inventário e Nexo' })
  await expect(drawer).toBeVisible()
  await page.getByRole('button', { name: 'Nexo' }).click()
  await expect(drawer.getByRole('heading', { name: 'Status do personagem' })).toBeVisible()
  await page.getByRole('button', { name: 'Inventário' }).click()
  const drawerBounds = await drawer.boundingBox()
  expect(drawerBounds).not.toBeNull()
  expect(drawerBounds!.x + drawerBounds!.width).toBeLessThanOrEqual(stageBounds!.x)
  await expect(city).toBeVisible()
  await page.getByRole('button', { name: 'Fechar painel' }).click()

  const locations = [
    'Casa de Eldamar',
    'Posto de Vorren',
    'Oficina dos Vínculos',
    'Quartel de Zareth',
    'Salão dos Clãs',
    'Casa de Daeryn',
    'Praça do Portal',
  ]

  for (const location of locations) {
    await page.getByRole('button', { name: new RegExp(`Ir para ${location}`) }).click()
    await expect(page.getByRole('complementary', { name: `Painel lateral: ${location}` })).toBeVisible()
    await expect(page.getByText(`TERRAN > ${location.toUpperCase()}`)).toBeVisible()
    await expect(city).toBeVisible()
    await page.getByRole('button', { name: 'Fechar painel' }).click()
  }

  await expect(page.getByText('7/7 descobertos')).toBeVisible()
  expect(browserErrors).toEqual([])
})
