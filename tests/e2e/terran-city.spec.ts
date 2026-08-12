import { expect, test } from '@playwright/test'

test('Terran é a Home e as sete áreas possuem interface e localização persistente', async ({ page }) => {
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
    await page.getByRole('link', { name: new RegExp(`Ir para ${location}`) }).click()
    await expect(page.getByRole('heading', { name: location, exact: true })).toBeVisible()
    await expect(page.getByText(`TERRAN > ${location.toUpperCase()}`)).toBeVisible()
    await page.getByRole('link', { name: 'Mapa de Terran', exact: true }).click()
  }

  await expect(page.getByText('7/7 locais')).toBeVisible()
  expect(browserErrors).toEqual([])
})
