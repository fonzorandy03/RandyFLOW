import test from 'node:test'
import assert from 'node:assert/strict'
import { beginLoading, loadingStore, withLoading } from '../lib/loading'

test('overlapping operations release independently and errors always dismiss loading', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  try {
    const first = beginLoading('PDF')
    const second = beginLoading('Salvataggio')
    assert.equal(loadingStore.getSnapshot(), 'Salvataggio')
    first()
    first()
    assert.equal(loadingStore.getSnapshot(), 'Salvataggio')
    second()
    assert.equal(loadingStore.getSnapshot(), '')
    await assert.rejects(withLoading('Importazione', async () => { throw new Error('File non valido') }))
    assert.equal(loadingStore.getSnapshot(), '')
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
