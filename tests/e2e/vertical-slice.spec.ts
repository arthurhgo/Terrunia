import { expect, test } from '@playwright/test'

test('vertical slice: criação, combate, Essência, node e reload', async ({ page }) => {
  test.setTimeout(60_000)
  const visualQa = process.env.VISUAL_QA === '1'
  await page.goto('/login')

  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await expect(page.getByRole('heading', { name: 'Criar Terrírian' })).toBeVisible()

  await page.getByPlaceholder('Ex.: Aron').fill('Aron')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await page.getByRole('button', { name: /Executar Vínculo da Arma/ }).click()

  await page.getByRole('button', { name: 'Falar com Eldamar' }).click()
  await page.getByRole('button', { name: 'Aceitar missão' }).click()
  await page.getByRole('button', { name: 'Entrar em Astravél' }).click()
  await page.getByRole('button', { name: 'Enfrentar Fungorro' }).click()

  await page.getByRole('button', { name: 'Atacar' }).click()
  await page.getByRole('button', { name: 'Atacar' }).click()
  await expect(page.getByRole('heading', { name: 'A rota foi preservada' })).toBeVisible()
  await page.getByRole('button', { name: 'Receber recompensas' }).click()
  await page.getByRole('button', { name: 'Retornar a Terran' }).click()

  const lootSlot = page.locator('.inventory-slot').filter({ hasText: 'Núcleo Fúngico' }).first()
  await lootSlot.click()
  await expect(lootSlot).toHaveAttribute('aria-pressed', 'true')
  const convertButton = page.getByRole('button', { name: 'Converter em Essência' })
  await expect(convertButton).toBeEnabled()
  await convertButton.click()
  await page.getByRole('button', { name: 'Confirmar +100' }).click()
  await expect(page.getByText('Pontos').locator('..').getByText('1')).toBeVisible()

  await page.getByRole('link', { name: 'Skill Tree', exact: true }).click()
  await page.getByRole('button', { name: /Núcleo do Vínculo: Disponível/ }).click()
  await page.getByRole('button', { name: 'Desbloquear node' }).click()
  await expect(page.getByRole('button', { name: 'Node ativo' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Núcleo do Vínculo: Desbloqueado/ })).toBeVisible()
  await expect(page.getByText('Pontos de Essência').locator('..').getByText('0')).toBeVisible()

  await page.getByRole('link', { name: 'Nexo', exact: true }).click()
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
  await expect(page.locator('.inventory-slot').filter({ hasText: 'Fragmento de Essência Micelial' })).toBeVisible()

  await page.getByRole('link', { name: 'Detalhes / Evoluir' }).first().click()
  await expect(page.getByRole('button', { name: 'Executar Rito G2' })).toBeEnabled()
  await page.getByRole('button', { name: 'Executar Rito G2' }).click()
  if (visualQa) await page.screenshot({ path: '/tmp/terrunia-v03-rite-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Confirmar Infusão' }).click()
  await expect(page.locator('.grade-seal')).toContainText('2')
  await expect(page.getByText('Essência Micelial', { exact: true })).toBeVisible()
  if (visualQa) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: '/tmp/terrunia-v03-grade2-mobile.png', fullPage: true })
    await page.setViewportSize({ width: 1280, height: 720 })
  }

  await page.getByRole('link', { name: 'Abrir Skill Tree' }).click()
  await expect(page.getByRole('button', { name: /Memória Micelial: Disponível/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Memória Micelial: Disponível/ })).toBeVisible()
  await expect(page.getByText('G2 · 104 R')).toBeVisible()
})
