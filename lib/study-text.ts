/** Presentation repair only: never supplies explanations absent from the imported JSON. */
export function formatStudyText(source: string): string {
  let text = source
    .replace(/\r\n?/g, '\n')
    .replace(/\u0010/g, '“')
    .replace(/\u0011/g, '”')
    .replace(/[\u0088\u2022]/g, '\n- ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\u00ad/g, '')
    .replace(/([\p{L}]{3,})-\s+([\p{Ll}]{2,})/gu, '$1$2')
    .replace(/\s*(?:\|\s*)?(?:\+|`|├|└)[─-]+\s+(?=[A-Z])/g, '\n- ')
  // Preserve authored Markdown. Repair flattened PDF text without guessing new content.
  {
    const labels =
      /(?:In parole semplici|Possibile domanda d[’']esame|Come risponderei oralmente|Come rispondere oralmente|Da ricordare|Esempio concreto|Collegamento con quanto gi[àa] studiato|Le \d+ categorie da ricordare|Che cos[’']è\?|Come funziona\?|Trucco:|Schema(?=\s+[A-Z]))/g
    let inCode = false
    text = text
      .split('\n')
      .map((line) => {
        if (/^\s*```/.test(line)) {
          inCode = !inCode
          return line
        }
        return inCode || /^\s{0,3}#{1,6}\s/.test(line)
          ? line
          : line.replace(labels, (label) => `\n\n## ${label.replace(/:$/, '')}\n\n`)
      })
      .join('\n')
    text = text.replace(
      /(?:^|\s)(\d{1,2})\s+((?:La classificazione|Cosa influenza|Che cosa|I tipi|Le fasi|La definizione)[^.!?\n]{0,90}?)(?=\s*\n|\s+(?:Che cos|Una visione))/g,
      '\n\n## $1 $2\n\n',
    )
  }
  let fenced = false
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced || /^\s*(?:#|>|[-*+] |\d+\. |\|)/.test(line) || line.length < 450) return line
      const sentences = line.split(/(?<=[.!?])\s+(?=[A-ZÀÈÉÌÒÙ“])/)
      const paragraphs: string[] = []
      let paragraph = ''
      for (const sentence of sentences) {
        if (paragraph.length > 350) {
          paragraphs.push(paragraph)
          paragraph = ''
        }
        paragraph += (paragraph ? ' ' : '') + sentence
      }
      if (paragraph) paragraphs.push(paragraph)
      return paragraphs.join('\n\n')
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
