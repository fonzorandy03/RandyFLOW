import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownContent } from '../components/common/markdown-content'
import { parseStudyPackage } from '../lib/study-package'

const source = readFileSync('docs/STUDY_PACKAGE_EXAMPLE.study', 'utf8')

test('normalizes page classification and supports old packages', () => {
  const current = parseStudyPackage(source)
  assert.equal(current.topics[0].pageType, 'cover')
  assert.equal(current.topics[0].studyable, false)
  const old = JSON.parse(source)
  old.topics = [old.topics.find((topic: { id: string }) => topic.id === 'economia-costi')]
  delete old.topics[0].pageType
  delete old.topics[0].studyable
  const parsed = parseStudyPackage(JSON.stringify(old))
  assert.equal(parsed.topics[0].pageType, 'content')
  assert.equal(parsed.topics[0].studyable, true)
})

test('renders headings, emphasis and lists from package Markdown', () => {
  const html = renderToStaticMarkup(
    createElement(MarkdownContent, null, '## Titolo\n\nTesto **importante**\n\n- Primo\n- Secondo'),
  )
  assert.match(html, /<h2/)
  assert.match(html, /<strong/)
  assert.match(html, /<ul/)
})
