import { cp, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const source = dirname(require.resolve('pdfjs-dist/package.json'))
const publicDir = resolve(import.meta.dirname, '../public')
await mkdir(publicDir, { recursive: true })
const studyKitDir = resolve(publicDir, 'study-kit')
await mkdir(studyKitDir, { recursive: true })
for (const file of ['STUDY_PACKAGE_SPEC.md', 'study-package-v1.schema.json']) {
  await cp(resolve(import.meta.dirname, '../docs', file), resolve(studyKitDir, file))
}
for (const [from, to] of [
  ['build/pdf.worker.min.mjs', 'pdf.worker.min.mjs'],
  ['cmaps', 'pdf-cmaps'],
  ['standard_fonts', 'pdf-fonts'],
  ['wasm', 'pdf-wasm'],
]) {
  await cp(resolve(source, from), resolve(publicDir, to), { recursive: true, force: true })
}
