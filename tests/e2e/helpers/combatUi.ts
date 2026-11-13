import { expect, type Page } from '@playwright/test'

/** Drive the real initiative, action, roll and reward UI without bypassing combat. */
export async function fightAndCollect(page: Page, expectedDropCount: number) {
  const started = Date.now()
  let phase: string | null = null
  const initiative = page.getByRole('button', { name: /^Arrastar dado de iniciativa d\d+ para cima para rolar$/ })
  const playerDie = page.getByRole('button', { name: /^Arrastar dado d\d+ para cima para rolar$/ })
  const attack = page.getByRole('button', { name: 'ATAQUE', exact: true })
  // v0.5.17: attack names depend on the bound weapon; first card is the primary strike.
  const single = page.locator('.pixel-battle__attack-grid .pixel-battle__skill-card').first()

  while (Date.now() - started < 65_000) {
    phase = await page.evaluate(async () => {
      const { useGameStore } = await import('/src/state/gameStore.ts')
      return useGameStore.getState().save?.battle?.phase ?? null
    })
    if (phase === 'Victory') break
    if (phase === 'Defeat' || !phase) throw new Error('Combat stopped without player victory: ' + phase)

    // During a cinematic preview the domain phase can still be AwaitingAction.
    // The player must release a die before a second command may be chosen.
    if (await playerDie.isVisible().catch(() => false)) {
      await playerDie.press('Enter')
      await page.waitForTimeout(120)
      continue
    }
    if (phase === 'AwaitingInitiative' && await initiative.isEnabled().catch(() => false)) {
      await initiative.press('Enter')
      await page.waitForTimeout(120)
      continue
    }
    if (phase === 'AwaitingAction' && await single.isVisible().catch(() => false)) {
      await single.click()
      await page.waitForTimeout(120)
      continue
    }
    if (phase === 'AwaitingAction' && await attack.isEnabled().catch(() => false)) {
      await attack.click()
      await page.waitForTimeout(120)
      continue
    }
    await page.waitForTimeout(120)
  }
  if (phase !== 'Victory') {
    const gate = await page.locator('.pixel-battle__actions').getAttribute('data-turn-gate').catch(() => null)
    throw new Error('Battle presentation did not finish: phase=' + phase + ', actionGate=' + gate)
  }

  await expect(page.getByRole('heading', { name: 'VITÓRIA', exact: true })).toBeVisible()
  const lootCounts = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const battle=useGameStore.getState().save?.battle
    return {all:battle?.rewards.lootDefinitionIds.length??0,
      modular:battle?.modularLootRollV05171?.itemIds.length??0}
  })
  expect(lootCounts.all).toBe(expectedDropCount+lootCounts.modular)
  // The historical drops are unchanged; new modular components are additive.
  await page.getByRole('button', { name: 'RECOLHER TODOS OS ESPÓLIOS', exact: true }).click()
  await expect(page.getByRole('button', { name: 'RECOLHER TODOS OS ESPÓLIOS', exact: true })).toHaveCount(0)
}
