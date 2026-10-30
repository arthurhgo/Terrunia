import { expect, test } from '@playwright/test'

test('primeiro Vínculo mantém atributos e arsenal lado a lado em zoom 100%, inclusive janelas baixas', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await expect(page.getByRole('heading', { name: 'O primeiro Vínculo' })).toBeVisible()

  const stats = page.getByRole('region', { name: 'Distribuição de atributos' })
  const weapons = page.locator('.prologue-arsenal')
  await expect(stats).toBeVisible()
  await expect(weapons).toBeVisible()

  // A short browser window must NEVER trigger the mobile stacked layout.
  for (const viewport of [{ width: 1360, height: 580 }, { width: 1024, height: 640 }, { width: 800, height: 700 }]) {
    await page.setViewportSize(viewport)
    const layout = await page.locator('.prologue-screen--enhanced').evaluate((main) => {
      const left = main.querySelector('.prologue-copy')!.getBoundingClientRect()
      const right = main.querySelector('.prologue-arsenal')!.getBoundingClientRect()
      return {
        leftRight: left.right,
        rightLeft: right.left,
        gridColumns: getComputedStyle(main).gridTemplateColumns.split(' ').length,
        mainWidth: main.getBoundingClientRect().width,
      }
    })
    expect(layout.gridColumns, `Colunas em ${viewport.width}x${viewport.height}`).toBe(2)
    expect(layout.leftRight, `Atributos ficam à esquerda em ${viewport.width}x${viewport.height}`).toBeLessThan(layout.rightLeft)
    expect(layout.mainWidth).toBeLessThanOrEqual(viewport.width)
  }

  // A real mobile width still stacks panels without horizontal clipping.
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await page.locator('.prologue-screen--enhanced').evaluate((main) => {
    const left = main.querySelector('.prologue-copy')!.getBoundingClientRect()
    const right = main.querySelector('.prologue-arsenal')!.getBoundingClientRect()
    return { leftBottom: left.bottom, rightTop: right.top }
  })
  expect(mobile.rightTop).toBeGreaterThan(mobile.leftBottom)

  // Selecting a weapon anchors a proportional, motionless sprite at the actor's hand.
  await page.getByRole('button', { name: 'Escolher Machado de Guerra' }).click()
  const characterPreview = page.getByRole('region', { name: 'Prévia do personagem com arma selecionada' })
  const heroSprite = characterPreview.getByRole('img', { name: 'Terrírian Lysa' })
  const weaponSprite = characterPreview.getByRole('img', { name: 'Machado de Guerra na mão do personagem (prévia)' })
  await expect(heroSprite).toBeVisible()
  await expect(weaponSprite).toBeVisible()

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 800, height: 700 },
    { width: 1024, height: 640 },
    { width: 1360, height: 580 },
  ]) {
    await page.setViewportSize(viewport)
    const placement = await characterPreview.evaluate((root) => {
      const character = root.querySelector('.prologue-hero-preview__character')!.getBoundingClientRect()
      const weapon = root.querySelector('.prologue-hero-preview__equipped-weapon')!.getBoundingClientRect()
      const css = getComputedStyle(root.querySelector('.prologue-hero-preview__equipped-weapon')!)
      return { character: { x: character.x, y: character.y, width: character.width, height: character.height },
        weapon: { x: weapon.x, y: weapon.y, width: weapon.width, height: weapon.height },
        animationName: css.animationName }
    })
    const hero = placement.character
    const equipped = placement.weapon
    expect(equipped.width, `Arma proporcional em ${viewport.width}x${viewport.height}`).toBeLessThan(hero.width * .72)
    expect(equipped.x, `Arma na área da mão em ${viewport.width}x${viewport.height}`).toBeLessThan(hero.x + hero.width)
    expect(equipped.x + equipped.width).toBeGreaterThan(hero.x + hero.width * .45)
    expect(equipped.y).toBeLessThan(hero.y + hero.height)
    expect(equipped.y + equipped.height).toBeGreaterThan(hero.y + hero.height * .3)
    expect(placement.animationName).toBe('none')
  }

  // The Long Sword has its own smaller silhouette and stays BEHIND the hand,
  // so the character's fist visually covers the weapon handle.
  await page.getByRole('button', { name: 'Escolher Espada Longa' }).click()
  const sword = characterPreview.getByRole('img', { name: 'Espada Longa na mão do personagem (prévia)' })
  await expect(sword).toBeVisible()
  const handRig = await characterPreview.evaluate((root) => {
    const actor = root.querySelector('.prologue-hero-preview__actor')!
    const hero = root.querySelector('.prologue-hero-preview__character')!
    const weapon = root.querySelector('.prologue-hero-preview__equipped-weapon')!
    const style = getComputedStyle(weapon)
    return {
      ratio: weapon.getBoundingClientRect().width / actor.getBoundingClientRect().width,
      characterZ: Number(getComputedStyle(hero).zIndex),
      weaponZ: Number(style.zIndex),
      animationName: style.animationName,
      weaponSize: style.getPropertyValue('--weapon-size').trim(),
      gripX: style.getPropertyValue('--grip-x').trim(),
    }
  })
  expect(handRig.ratio).toBeLessThan(.45)
  expect(handRig.weaponZ).toBeLessThan(handRig.characterZ)
  expect(handRig.animationName).toBe('none')
  expect(handRig.weaponSize).toBe('27%')
  expect(handRig.gripX).toBe('61%')
})
