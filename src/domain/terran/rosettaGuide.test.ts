import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getRosettaGuidance } from './rosettaGuide'

const fresh = () => createNewSave('guide-test', 'Terrírian', 'character.terririan.default', content, '2026-10-30T00:00:00Z')

describe('Rosetta orienta usando apenas dados do save', () => {
  it('mostra os responsáveis por missões realmente disponíveis sem liberar missões bloqueadas', () => {
    const save = fresh()
    const guide = getRosettaGuidance(save, content)
    expect(guide.available.some((entry) => entry.id === 'vs_astravel_first_contact')).toBe(true)
    expect(guide.available.find((entry) => entry.id === 'vs_astravel_first_contact')).toMatchObject({
      npcName: 'Eldamar', locationName: 'Casa de Eldamar',
    })
    expect(guide.available.some((entry) => entry.id === 'side_street_arlen')).toBe(false)
    expect(guide.next?.id).toBe('vs_astravel_first_contact')
  })

  it('prioriza próximo objetivo em andamento e entrega antes de outras ofertas', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'active'
    let guide = getRosettaGuidance(save, content)
    expect(guide.next?.instruction).toContain('Receba as instruções de Eldamar')
    expect(guide.available.some((entry) => entry.id === 'vs_astravel_first_contact')).toBe(false)
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    guide = getRosettaGuidance(save, content)
    expect(guide.next?.instruction).toContain('Retorne a Eldamar')
  })

  it('nunca sugere receber nova missão com os três espaços ocupados', () => {
    const save = fresh()
    for (const id of ['vs_astravel_first_contact', 'main_terran_first_home', 'main_vorren_bestiary']) {
      save.quests[id].status = 'active'
    }
    const guide = getRosettaGuidance(save, content)
    expect(guide.canReceive).toBe(false)
    expect(guide.activeCount).toBe(3)
    expect(guide.maxActive).toBe(3)
    expect(guide.next).not.toBeNull()
  })

  it('identifica a área real de um NPC de rua após desbloquear seu contrato', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'available'
    const guide = getRosettaGuidance(save, content)
    expect(guide.available.find((entry) => entry.id === 'side_street_arlen')).toMatchObject({
      npcName: 'Arlen', locationName: 'Ruas de Terran · Eldamar',
    })
  })
})
