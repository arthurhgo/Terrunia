import { expect, test, type Page } from '@playwright/test'

async function visitTerran(page: Page, location: string) {
  const skip = page.getByRole('button', { name: 'Pular cena' })
  if (await skip.isVisible()) await skip.click()
  await page.getByRole('button', { name: `Ir para ${location}` }).click()
  await expect(page.getByRole('complementary', { name: `Painel lateral: ${location}` })).toBeVisible()
}

test('vertical slice: criação, combate, Essência, node e reload', async ({ page }) => {
  test.setTimeout(60_000)
  const visualQa = process.env.VISUAL_QA === '1'
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  await page.goto('/login')

  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await expect(page.getByRole('heading', { name: 'Criar Terrírian' })).toBeVisible()

  await page.getByPlaceholder('Ex.: Aron').fill('Aron')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: /Executar Vínculo da Arma/ }).click()

  await visitTerran(page, 'Casa de Eldamar')
  await page.getByRole('button', { name: 'Falar com Eldamar' }).click()
  await page.getByRole('button', { name: 'Aceitar missão' }).click()
  await visitTerran(page, 'Praça do Portal')
  await page.getByRole('button', { name: 'Entrar em Astravél' }).click()
  await page.getByRole('button', { name: 'Enfrentar Fungorro' }).click()

  await page.getByRole('button', { name: 'Atacar' }).click()
  await page.getByRole('button', { name: 'Atacar' }).click()
  await expect(page.getByRole('heading', { name: 'A rota foi preservada' })).toBeVisible()
  await page.getByRole('button', { name: 'Receber recompensas' }).click()
  await page.getByRole('button', { name: 'Retornar a Terran' }).click()
  await expect(page.getByText('TERRAN > PRAÇA DO PORTAL')).toBeVisible()
  await visitTerran(page, 'Oficina dos Vínculos')

  const lootSlot = page.locator('.inventory-slot').filter({ hasText: 'Núcleo Fúngico' }).first()
  await lootSlot.click()
  await expect(lootSlot).toHaveAttribute('aria-pressed', 'true')
  const convertButton = page.getByRole('button', { name: 'Converter em Essência' })
  await expect(convertButton).toBeEnabled()
  await convertButton.click()
  await page.getByRole('button', { name: 'Confirmar +100' }).click()
  await expect(page.getByText('Pontos').locator('..').getByText('1')).toBeVisible()

  await page.getByRole('button', { name: 'Abrir Evolução' }).click()
  const initialNode = page.locator('.terran-skill').filter({ hasText: 'Núcleo do Vínculo' })
  await initialNode.click()
  await expect(initialNode).toContainText('Desbloqueado')

  await page.reload()
  await page.getByRole('button', { name: 'Abrir Evolução' }).click()
  await expect(page.locator('.terran-skill').filter({ hasText: 'Núcleo do Vínculo' })).toContainText('Desbloqueado')
  await expect(page.getByText('0 ponto(s) disponíveis')).toBeVisible()

  await visitTerran(page, 'Praça do Portal')
  await page.getByRole('button', { name: 'Vasculhar acampamento' }).click()
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Tônico de Campo' })).toBeVisible()
  await page.getByRole('button', { name: 'Emboscada de Esporos' }).click()
  await expect(page.getByRole('button', { name: /Selecionar alvo/ })).toHaveCount(3)

  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await page.getByRole('button', { name: 'Tônico de Campo', exact: true }).click()
  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await expect(page.getByRole('heading', { name: 'A rota foi preservada' })).toBeVisible()
  await page.getByRole('button', { name: 'Receber recompensas' }).click()
  await page.getByRole('button', { name: 'Retornar a Terran' }).click()
  await page.getByRole('button', { name: 'Investigar o limiar' }).click()
  await expect(page.getByRole('button', { name: 'Enfrentar Colosso Micélio' })).toBeEnabled()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v03-portal-desktop.png', fullPage: true })

  await page.getByRole('button', { name: 'Enfrentar Colosso Micélio' }).click()
  await expect(page.getByText('Câmaras Fúngicas de Astravél')).toBeVisible()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v03-boss-desktop.png', fullPage: true })
  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await page.getByRole('button', { name: /Golpe Ressonante/ }).click()
  await page.getByRole('button', { name: 'Atacar' }).click()
  await expect(page.getByRole('heading', { name: 'O núcleo da Ruína cedeu' })).toBeVisible()
  await page.getByRole('button', { name: 'Receber recompensas' }).click()
  await page.getByRole('button', { name: 'Retornar a Terran' }).click()
  await visitTerran(page, 'Oficina dos Vínculos')
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Fragmento de Essência Micelial' })).toBeVisible()
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Esmeralda do Crescimento' })).toBeVisible()

  await page.getByRole('link', { name: 'Detalhes / Evoluir' }).first().click()
  await expect(page.getByRole('button', { name: 'Executar Rito G2' })).toBeEnabled()
  await page.getByRole('button', { name: 'Executar Rito G2' }).click()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v03-rite-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Confirmar Infusão' }).click()
  await expect(page.locator('.grade-seal')).toContainText('2')
  await expect(page.getByText('Essência Micelial', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Executar Rito G3' })).toBeEnabled()
  await page.getByRole('button', { name: 'Executar Rito G3' }).click()
  await expect(page.getByRole('heading', { name: 'Lapidar a primeira Joia' })).toBeVisible()
  await expect(page.getByText('Vida máxima +2')).toBeVisible()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v04-rite-grade3-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Confirmar Lapidação' }).click()
  await expect(page.locator('.grade-seal')).toContainText('3')
  await expect(page.getByText('Esmeralda do Crescimento', { exact: true })).toBeVisible()
  if (visualQa) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: '/tmp/terrunia-v04-grade3-mobile.png', fullPage: true })
    await page.setViewportSize({ width: 1280, height: 720 })
  }

  await page.getByRole('link', { name: 'Abrir Skill Tree' }).click()
  await expect(page.getByRole('button', { name: /Memória Micelial: Disponível/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Foco Lapidado: Disponível/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Memória Micelial: Disponível/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Foco Lapidado: Disponível/ })).toBeVisible()
  await expect(page.getByText('G3 · 300 R')).toBeVisible()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v04-skill-tree-desktop.png', fullPage: true })
  expect(browserErrors).toEqual([])
})
