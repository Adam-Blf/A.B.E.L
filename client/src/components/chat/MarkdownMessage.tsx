import { cn } from '@/utils/cn'

interface MarkdownMessageProps {
  content: string
  className?: string
}

// Parse inline markdown: bold, italic, code, links
function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }

    const raw = match[0]
    const key = match.index

    if (raw.startsWith('**')) {
      result.push(<strong key={key} className="text-white font-semibold">{match[2]}</strong>)
    } else if (raw.startsWith('*')) {
      result.push(<em key={key} className="text-white/80 italic">{match[3]}</em>)
    } else if (raw.startsWith('`')) {
      result.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-neon-cyan text-xs border border-white/10"
        >
          {match[4]}
        </code>
      )
    } else if (raw.startsWith('[')) {
      result.push(
        <a
          key={key}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon-cyan underline underline-offset-2 hover:text-neon-cyan/80 transition-colors"
        >
          {match[5]}
        </a>
      )
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }

  return result
}

// Parse a single block into a React element
function parseBlock(block: string, blockIndex: number): React.ReactNode {
  // Fenced code block
  const codeBlockMatch = block.match(/^```(\w*)\n?([\s\S]*?)```$/)
  if (codeBlockMatch) {
    const lang = codeBlockMatch[1] || 'code'
    const code = codeBlockMatch[2].trim()
    return (
      <div key={blockIndex} className="relative group my-2">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/10 rounded-t-lg">
          <span className="text-xs text-neon-cyan font-mono">{lang}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            Copier
          </button>
        </div>
        <pre className="p-4 bg-black/40 border border-white/10 border-t-0 rounded-b-lg overflow-x-auto">
          <code className="text-sm font-mono text-white/90 leading-relaxed">{code}</code>
        </pre>
      </div>
    )
  }

  // Horizontal rule
  if (block.match(/^---+$/)) {
    return <hr key={blockIndex} className="border-white/10 my-3" />
  }

  // Headers
  const headerMatch = block.match(/^(#{1,6})\s+(.+)$/)
  if (headerMatch) {
    const level = headerMatch[1].length
    const content = headerMatch[2]
    const sizeClass = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-xs'][level - 1]
    const colorClass = level === 1 ? 'text-neon-cyan' : level === 2 ? 'text-white' : 'text-white/90'
    return (
      <p key={blockIndex} className={cn('font-semibold mt-3 mb-1', sizeClass, colorClass)}>
        {parseInline(content)}
      </p>
    )
  }

  // Blockquote
  if (block.startsWith('>')) {
    const content = block.replace(/^>\s*/gm, '')
    return (
      <blockquote
        key={blockIndex}
        className="border-l-2 border-neon-violet/50 pl-3 py-0.5 my-2 text-white/60 italic"
      >
        {parseInline(content)}
      </blockquote>
    )
  }

  // Unordered list
  if (block.match(/^[-*•]\s/m)) {
    const items = block.split('\n').filter((l) => l.trim())
    return (
      <ul key={blockIndex} className="space-y-1 my-2 ml-2">
        {items.map((item, i) => {
          const content = item.replace(/^[-*•]\s+/, '')
          return (
            <li key={i} className="flex items-start gap-2 text-white/90">
              <span className="text-neon-cyan mt-1 text-xs">▸</span>
              <span>{parseInline(content)}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  // Ordered list
  if (block.match(/^\d+\.\s/m)) {
    const items = block.split('\n').filter((l) => l.trim())
    return (
      <ol key={blockIndex} className="space-y-1 my-2 ml-2">
        {items.map((item, i) => {
          const content = item.replace(/^\d+\.\s+/, '')
          return (
            <li key={i} className="flex items-start gap-2 text-white/90">
              <span className="text-neon-cyan font-mono text-xs min-w-[16px] mt-0.5">{i + 1}.</span>
              <span>{parseInline(content)}</span>
            </li>
          )
        })}
      </ol>
    )
  }

  // Table (simple)
  if (block.includes('|') && block.split('\n').length >= 2) {
    const lines = block.split('\n').filter((l) => l.trim() && !l.match(/^\|[-: |]+\|$/))
    if (lines.length >= 2) {
      const headers = lines[0].split('|').filter((c) => c.trim())
      const rows = lines.slice(1)
      return (
        <div key={blockIndex} className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-neon-cyan border border-white/10 bg-white/5 font-medium">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.split('|').filter((c) => c.trim()).map((cell, j) => (
                    <td key={j} className="px-3 py-2 border border-white/10 text-white/80">
                      {parseInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }

  // Regular paragraph
  if (block.trim()) {
    return (
      <p key={blockIndex} className="text-white/90 leading-relaxed">
        {parseInline(block)}
      </p>
    )
  }

  return null
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  // Split into blocks by double newlines, but preserve code blocks
  const blocks: string[] = []
  let remaining = content
  const codeBlockPattern = /```[\s\S]*?```/g
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = codeBlockPattern.exec(content)) !== null) {
    // Add text before code block (split by double newlines)
    const before = content.slice(lastIndex, match.index)
    if (before.trim()) {
      before.split(/\n\n+/).forEach((b) => { if (b.trim()) blocks.push(b.trim()) })
    }
    // Add code block as single unit
    blocks.push(match[0])
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  const after = content.slice(lastIndex)
  if (after.trim()) {
    after.split(/\n\n+/).forEach((b) => { if (b.trim()) blocks.push(b.trim()) })
  }

  // If no blocks found, use the whole content
  if (blocks.length === 0 && content.trim()) {
    content.split(/\n\n+/).forEach((b) => { if (b.trim()) blocks.push(b.trim()) })
  }

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {blocks.map((block, i) => parseBlock(block, i))}
    </div>
  )
}
