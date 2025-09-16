// 简化版 markdown 渲染流程
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import type { RendererAPI } from './types'
import type { ReadTimeResults } from 'reading-time'

export function renderMarkdown(raw: string, renderer: RendererAPI) {
  const { markdownContent, readingTime } = renderer.parseFrontMatterAndContent(raw)
  const r = (renderer as unknown as { _renderer?: unknown })._renderer
  // 兼容我们简化的类型定义：通过函数调用形式传递 renderer
  let html: string
  if (r) {
    html = (marked as unknown as (src: string, opts: { renderer: unknown }) => string)(markdownContent, { renderer: r })
  } else {
    html = marked.parse(markdownContent) as string
  }
  html = DOMPurify.sanitize(html)
  return { html, readingTime }
}

export function postProcessHtml(baseHtml: string, reading: ReadTimeResults, renderer: RendererAPI) {
  let html = baseHtml
  html = renderer.buildReadingTime(reading) + html
  return renderer.createContainer(html)
}

export function convert(raw: string, renderer: RendererAPI) {
  const { html, readingTime } = renderMarkdown(raw, renderer)
  return postProcessHtml(html, readingTime, renderer)
}
