import test from 'node:test'
import assert from 'node:assert/strict'
import { formatStudyText } from '../lib/study-text'

test('formats flattened imported text without losing words or page content', () => {
  const result = formatStudyText(
    'Adattiva = \u0010il mondo cambia\u0011. Trucco: Una distinzione. Possibile domanda d’esame Quali tipi? Come risponderei oralmente La pre- ventiva evita problemi. Da ricordare Quattro tipi.',
  )
  assert.ok(result.includes('“il mondo cambia”'))
  assert.ok(result.includes('## Possibile domanda d’esame'))
  assert.ok(result.includes('## Come risponderei oralmente'))
  assert.ok(result.includes('La preventiva evita problemi.'))
  assert.ok(result.includes('Quattro tipi.'))
})
test('keeps existing Markdown and fenced code intact', () => {
  const text = '## Una lezione\n\nUn testo **importante**.\n\n```text\nDa ricordare\n```'
  assert.equal(formatStudyText(text), text)
})
test('turns flattened diagram branches into readable lists', () => {
  const result = formatStudyText('Schema KITCHENHAM | +- CORRECTIVE → errore. `- ENHANCEMENTS → miglioramento.')
  assert.ok(result.includes('\n- CORRECTIVE'))
  assert.ok(result.includes('\n- ENHANCEMENTS'))
})
