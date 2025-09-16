// 精简的类型定义，来自 @md/shared/types
// 临时类型（若无 @types 依赖）
export interface ReadTimeResults { text: string; minutes: number; time: number; words: number }

export type Block = 'container' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'blockquote' | 'blockquote_p' | 'code_pre' | 'code' | 'image' | 'ol' | 'ul' | 'footnotes' | 'figure' | 'hr' | 'block_katex'
export type Inline = 'listitem' | 'codespan' | 'link' | 'wx_link' | 'strong' | 'table' | 'thead' | 'th' | 'td' | 'footnote' | 'figcaption' | 'em' | 'inline_katex'

export interface Theme {
  base: Record<string, string>
  block: Record<Block, Record<string, string>>
  inline: Record<Inline, Record<string, string>>
}

export interface IOpts {
  theme: Theme
  fonts: string
  size: string
  isUseIndent: boolean
  isUseJustify: boolean
  legend?: string
  citeStatus?: boolean
  countStatus?: boolean
  isMacCodeBlock?: boolean
  isShowLineNumber?: boolean
  codeThemeName?: string
  codeColorMap?: Record<string, string>
}

export interface RendererAPI {
  reset: (newOpts: Partial<IOpts>) => void
  setOptions: (newOpts: Partial<IOpts>) => void
  getOpts: () => IOpts
  parseFrontMatterAndContent: (markdown: string) => { yamlData: Record<string, unknown>; markdownContent: string; readingTime: ReadTimeResults }
  buildReadingTime: (reading: ReadTimeResults) => string
  buildFootnotes: () => string
  buildAddition: () => string
  createContainer: (html: string) => string
  // 内部：暴露底层 marked Renderer
  _renderer: unknown
}
