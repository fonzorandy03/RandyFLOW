import ReactMarkdown from 'react-markdown'

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown components={{
      h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-semibold">{children}</h2>,
      h3: ({ children }) => <h3 className="mb-2 mt-4 font-semibold">{children}</h3>,
      p: ({ children }) => <p className="my-2 text-sm leading-7">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5 text-sm leading-7">{children}</ul>,
      ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5 text-sm leading-7">{children}</ol>,
    }}>{children}</ReactMarkdown>
  )
}
