import ReactMarkdown from 'react-markdown'
import { formatStudyText } from '@/lib/study-text'

export function LessonContent({ text }: { text: string }) {
  return (
    <div className="academic-lesson">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          pre: ({ children }) => <pre>{children}</pre>,
        }}
      >
        {formatStudyText(text)}
      </ReactMarkdown>
    </div>
  )
}
