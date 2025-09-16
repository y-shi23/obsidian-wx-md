// 精简版公众号富文本复制处理
// 参考原项目 md/apps/web/src/utils/index.ts 中的 processClipboardContent / solveWeChatImage / mergeCss / modifyHtmlStructure
// 目标：对已经转换完成的 HTML 进行结构与样式微调，然后复制为同时含 text/html 与 text/plain 的富文本，方便直接粘贴到公众号后台。

// NOTE: 为避免引入 juice 额外依赖，当前版本暂不做外部 CSS -> inline 的再次整合（我们 renderer 已输出大量 inline 样式）。
// 若后续需要，可添加 juice（npm i juice）并启用 mergeCss。

interface CopyOptions {
  html: string
  primaryColor?: string // 主题主色，默认 #4a9dff
  blockquoteBg?: string // 引用背景（用于变量替换）
}

function modifyHtmlStructure(htmlString: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlString
  // li > ul/ol 移出到 li 之后，兼容公众号列表渲染
  tempDiv.querySelectorAll('li > ul, li > ol').forEach((nested) => {
    const parent = nested.parentElement
    if (parent) parent.insertAdjacentElement('afterend', nested)
  })
  return tempDiv.innerHTML
}

function solveWeChatImage(root: HTMLElement) {
  const images = root.getElementsByTagName('img')
  Array.from(images).forEach((img) => {
    const width = img.getAttribute('width')
    const height = img.getAttribute('height')
    if (width) {
      img.removeAttribute('width')
      img.style.width = width
    }
    if (height) {
      img.removeAttribute('height')
      img.style.height = height
    }
  })
}

function createEmptyNode(): HTMLElement {
  const node = document.createElement('p')
  node.style.fontSize = '0'
  node.style.lineHeight = '0'
  node.style.margin = '0'
  node.innerHTML = '&nbsp;'
  return node
}

// Mermaid/SVG 兼容处理：
// 1) 去除 .nodeLabel/.edgeLabel 内部多余 p 包裹；
// 2) 将包含 .nodeLabel 的父 <g> 提升为 <section>，并替换其祖父层内容（与原项目一致）。
function normalizeMermaid(root: HTMLElement) {
  // 去除 p 包裹
  root.innerHTML = root.innerHTML
    .replace(/<span class="nodeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g, '<span class="nodeLabel"$1>$2<\/span>')
    .replace(/<span class="edgeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g, '<span class="edgeLabel"$1>$2<\/span>')

  const nodes = root.querySelectorAll('.nodeLabel')
  nodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent) return
    const grand = parent.parentElement
    if (!grand) return
    const section = document.createElement('section')
    const xmlns = parent.getAttribute('xmlns') || ''
    const style = parent.getAttribute('style') || ''
    if (xmlns) section.setAttribute('xmlns', xmlns)
    if (style) section.setAttribute('style', style)
    section.innerHTML = parent.innerHTML
    grand.innerHTML = ''
    grand.appendChild(section)
  })
}

function htmlTweaks(html: string, primaryColor: string): string {
  return html
    // top: x em -> transform 以兼容公众号
    .replace(/([^\-])top:(.*?)em/g, '$1transform: translateY($2em)')
    // 一些常见 CSS 变量替换为固定颜色
    .replace(/hsl\(var\(--foreground\)\)/g, '#3f3f3f')
    .replace(/var\(--blockquote-background\)/g, '#f7f7f7')
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/--md-primary-color:.+?;/g, '')
}

function tryExecCommandCopy(element: HTMLElement): boolean {
  try {
    const selection = window.getSelection()
    if (!selection) return false
    selection.removeAllRanges()
    const range = document.createRange()
    range.selectNodeContents(element)
    selection.addRange(range)
    // 使用 execCommand 复制 HTML（在非安全上下文下更可靠）
    const ok = document.execCommand('copy')
    selection.removeAllRanges()
    return ok
  } catch {
    return false
  }
}

function legacyCopyPlain(text: string): boolean {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

function copyViaCopyEvent(html: string, plain: string): boolean {
  let copied = false
  const onCopy = (e: ClipboardEvent) => {
    try {
      e.clipboardData?.setData('text/html', html)
      e.clipboardData?.setData('text/plain', plain)
      e.preventDefault()
      copied = true
    } catch { /* noop */ }
  }
  document.addEventListener('copy', onCopy, true)
  try { document.execCommand('copy') } catch { /* noop */ }
  document.removeEventListener('copy', onCopy, true)
  return copied
}

export interface CopyResult { method: string }

export async function copyWeChatRich(options: CopyOptions): Promise<CopyResult> {
  const { html, primaryColor = '#4a9dff', blockquoteBg = '#f7f7f7' } = options
  console.debug('[wechat-copy] start', { htmlLength: html.length })
  // 构建一个离屏容器（可编辑，便于 execCommand 复制）
  const container = document.createElement('div')
  container.id = 'wechat-md-tmp-copy'
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  container.style.width = '800px'
  container.style.maxWidth = '800px'
  // 不拦截指针事件，确保可聚焦；用透明隐藏
  container.style.opacity = '0'
  container.contentEditable = 'true'
  container.spellcheck = false

  // 预处理 HTML：结构、样式变量替换
  let processed = modifyHtmlStructure(html)
  processed = htmlTweaks(processed, primaryColor)
    .replace(/var\(--blockquote-background\)/g, blockquoteBg)
  container.innerHTML = processed

  // 处理图片尺寸
  solveWeChatImage(container)
  // Mermaid/SVG 兼容
  normalizeMermaid(container)

  // 添加前后空节点，提高某些内嵌 SVG/公式复制兼容性
  const beforeNode = createEmptyNode()
  const afterNode = createEmptyNode()
  container.insertBefore(beforeNode, container.firstChild)
  container.appendChild(afterNode)

  document.body.appendChild(container)
  // 聚焦窗口与容器，提升 execCommand 可靠性
  try { window.focus() } catch { /* ignore focus error */ }
  try { container.focus() } catch { /* ignore focus error */ }

  const htmlContent = container.innerHTML
  const plain = container.textContent || ''

  // 预选中容器内容，提高某些环境下 copy 事件触发概率
  let success = false
  let method = ''
  try {
    const sel = window.getSelection()
    sel?.removeAllRanges()
    const r = document.createRange()
    r.selectNodeContents(container)
    sel?.addRange(r)
  } catch { /* ignore selection error */ }

  try {
    // 优先使用 Clipboard API（安全上下文更稳）
    const clip: unknown = navigator.clipboard
    if (clip && typeof (clip as Clipboard).write === 'function') {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
        await (clip as Clipboard).write([item])
        success = true
        method = 'Clipboard.write'
        console.debug('[wechat-copy] success via Clipboard.write')
        return { method }
      } catch {
        console.debug('[wechat-copy] Clipboard.write failed, fallback...')
        // ignore and fallback
      }
    }

    // 回退一：使用 copy 事件直接写入剪贴板（无需安全上下文）
  if (copyViaCopyEvent(htmlContent, plain)) { success = true; method = 'copy-event'; console.debug('[wechat-copy] success via copy event'); return { method } }

    // 回退二：选择容器 + execCommand 复制 HTML
  if (tryExecCommandCopy(container)) { success = true; method = 'execCommand-range'; console.debug('[wechat-copy] success via execCommand element copy'); return { method } }

    // 回退三：仅复制纯文本（textarea + execCommand）
  if (legacyCopyPlain(plain)) { success = true; method = 'legacy-plain'; console.debug('[wechat-copy] success via legacy plain copy'); return { method } }

    // 回退四：尝试 navigator.clipboard.writeText（若可用）
    if (navigator.clipboard && 'writeText' in navigator.clipboard) {
      await (navigator.clipboard as Clipboard).writeText(plain)
      success = true
      method = 'writeText-plain'
      console.debug('[wechat-copy] success via writeText(plain)')
      return { method }
    }
  } finally {
    // 清理
    container.remove()
    const sel = window.getSelection()
    sel?.removeAllRanges()
  }
  if (!success) throw new Error('复制失败：无法访问剪切板')
  else {
    console.debug('[wechat-copy] end success (unmarked path)', { method })
    return { method: method || 'unknown' }
  }
}
