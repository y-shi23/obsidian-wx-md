// 极简渲染器：保留必要逻辑（不含所有扩展，后续可增量添加）
import frontMatter from 'front-matter'
import readingTime, { ReadTimeResults } from 'reading-time'
import { marked } from 'marked'
import hljs from 'highlight.js'

// 轻量替代 es-toolkit：深拷贝 + 合并
function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}
function toMerged<A extends object, B extends object>(a: A, b: B): A & B {
  return Object.assign({}, a, b)
}
import type { IOpts, RendererAPI, Theme } from './types'
import { defaultTheme } from './theme'

interface ThemeStyles { [k: string]: Record<string, string> }

function styleString(style: Record<string, string> | undefined): string {
  if (!style) return ''
  return Object.entries(style).map(([k, v]) => `${k}: ${v}`).join('; ')
}

function buildTheme({ theme: _theme, fonts, size, isUseIndent, isUseJustify }: IOpts): ThemeStyles {
  const theme = cloneDeep(_theme)
  const base = toMerged(theme.base, { 'font-family': fonts, 'font-size': size })

  if (isUseIndent) {
    theme.block.p = { 'text-indent': '2em', ...theme.block.p }
  }
    
  if (isUseJustify) {
    theme.block.p = { 'text-align': 'justify', ...theme.block.p }
  }

  const merge = (styles: Record<string, Record<string, string>>) => Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, toMerged(base, v)]))
  return { ...merge(theme.block), ...merge(theme.inline) }
}

export function initRenderer(opts: IOpts): RendererAPI {
  let _opts = opts
  let stylesCache: ThemeStyles = buildTheme(_opts)
  const footnotes: [number, string, string][] = []
  let footIndex = 0

  function getOpts() { return _opts }
  function setOptions(newOpts: Partial<IOpts>) {
    _opts = { ..._opts, ...newOpts }
    stylesCache = buildTheme(_opts)
  }
  function reset(newOpts: Partial<IOpts>) { footnotes.length = 0; footIndex = 0; setOptions(newOpts) }

  function parseFrontMatterAndContent(markdownText: string): { yamlData: Record<string, unknown>; markdownContent: string; readingTime: ReadTimeResults } {
    try {
      const parsed = frontMatter(markdownText)
      const yamlData = parsed.attributes as Record<string, unknown>
      const markdownContent = parsed.body
      const stats = readingTime(markdownContent)
      return { yamlData, markdownContent, readingTime: stats }
    } catch {
      return { yamlData: {}, markdownContent: markdownText, readingTime: readingTime(markdownText) }
    }
  }

  function themed(tag: string, html: string, realTag?: string, extra = ''): string {
    const style = styleString(stylesCache[tag])
    const finalTag = realTag || tag
    return `<${finalTag} style="${style}${extra}">${html}</${finalTag}>`
  }

  function addFootnote(title: string, link: string): number {
    footnotes.push([++footIndex, title, link])
    return footIndex
  }

  // 运行时依赖的 minimal 接口

  type MkRendererCtor = new () => Record<string, unknown>
  const BaseRenderer: MkRendererCtor = (marked as unknown as { Renderer: MkRendererCtor }).Renderer
  const renderer = new BaseRenderer()
  renderer.heading = (text: string, level: number) => {
    return themed(`h${level}`, text)
  }
  renderer.paragraph = (text: string) => {
    if (text.includes('<img')) return text
    return themed('p', text)
  }
  renderer.blockquote = (quote: string) => {
    const inner = quote.replace(/<p(.*?)>/g, `<p style="${styleString(stylesCache.blockquote_p)}">`)
    return themed('blockquote', inner)
  }
  renderer.code = (code: string, language?: string) => {
    const lang = language && hljs.getLanguage(language) ? language : 'plaintext'
    const highlighted = hljs.highlight(code, { language: lang }).value
    return `<pre style="${styleString(stylesCache.code_pre)}"><code style="${styleString(stylesCache.code)}" class="language-${lang}">${highlighted}</code></pre>`
  }
  renderer.codespan = (code: string) => themed('codespan', code, 'code')
  renderer.strong = (text: string) => themed('strong', text)
  renderer.em = (text: string) => themed('em', text, 'span')
  renderer.link = (href: string | null, title: string | null, text: string) => {
    if (!href) return text
    if (_opts.citeStatus && href !== text) {
      const ref = addFootnote(title || text, href)
      return `<span style="${styleString(stylesCache.link)}">${text}<sup>[${ref}]</sup></span>`
    }
    return `<a href="${href}" target="_blank" rel="noopener" style="${styleString(stylesCache.link)}">${text}</a>`
  }
  renderer.image = (href: string | null, title: string | null, text: string) => {
    if (!href) return text
    const fig = styleString(stylesCache.figure)
    const imgStyle = styleString(stylesCache.image)
    return `<figure style="${fig}"><img src="${href}" alt="${text}" title="${title || ''}" style="${imgStyle}"/>${themed('figcaption', text || '', 'figcaption')}</figure>`
  }
  renderer.list = (body: string, ordered: boolean) => {
    return themed(ordered ? 'ol' : 'ul', body)
  }
  renderer.listitem = (text: string) => {
    return themed('listitem', text, 'li')
  }
  renderer.table = (header: string, body: string) => {
    return `<section style="padding:0 8px;overflow:auto;">` +
      `<table style="${styleString(stylesCache.table)}"><thead style="${styleString(stylesCache.thead)}">${header}</thead><tbody>${body}</tbody></table>` +
      `</section>`
  }
  renderer.hr = () => `<hr style="${styleString(stylesCache.hr)}"/>`
  // 必须实现 text，否则 marked 解析纯文本 token 时会抛出 renderer.text is not a function
  ;(renderer as unknown as { text: (s: string) => string }).text = (text: string) => text

  function buildReadingTime(r: ReadTimeResults) {
    if (!_opts.countStatus || !r.words) return ''
    return `<blockquote style="${styleString(stylesCache.blockquote)}"><p style="${styleString(stylesCache.blockquote_p)}">字数 ${r.words}，阅读大约需 ${Math.ceil(r.minutes)} 分钟</p></blockquote>`
  }
  function buildFootnotes() {
    if (!footnotes.length) return ''
    const body = footnotes.map(([i, title, link]) => `<div style="font-size:12px;opacity:.65">[${i}] ${title}: <i>${link}</i></div>`).join('')
    return themed('footnotes', body, 'section')
  }
  function buildAddition() { return '' }
  function createContainer(html: string) { return `<section style="${styleString(stylesCache.container)}">${html}</section>` }

  return { reset, setOptions, getOpts, parseFrontMatterAndContent, buildReadingTime, buildFootnotes, buildAddition, createContainer, _renderer: renderer as unknown }
}

export function createDefaultRenderer(): RendererAPI {
  const theme: Theme = defaultTheme
  return initRenderer({
    theme,
    fonts: 'inherit',
    size: '14px',
    isUseIndent: false,
    isUseJustify: false,
    legend: 'alt-title',
    citeStatus: false,
    countStatus: true,
    isMacCodeBlock: true,
    isShowLineNumber: false,
  })
}
