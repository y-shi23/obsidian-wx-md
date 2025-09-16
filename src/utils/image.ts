import type MyPlugin from '../../main'
import { TFile } from 'obsidian'

// 解析 Obsidian 内部图片语法: ![[path|alt]] / ![[path|400]] / ![[path|400x300]]
export function preprocessObsidianImages(markdown: string, plugin: MyPlugin, currentFilePath: string | null): string {
  const app = plugin.app
  return markdown.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, rawTarget: string, tail: string | undefined) => {
    const target = rawTarget.trim()
    const dest = app.metadataCache.getFirstLinkpathDest(target, currentFilePath || '') as TFile | null
    if (!dest) return _m // 保留原样，避免失真
    let alt = ''
    let style = ''
    if (tail) {
      const t = tail.trim()
      if (/^\d+x\d+$/.test(t)) {
        const [w, h] = t.split('x')
        style = `width:${w}px;height:${h}px;`
      } else if (/^\d+$/.test(t)) {
        style = `width:${t}px;`
      } else {
        alt = t
      }
    }
    const src = dest.path // 保留 vault 内部相对路径（含空格，用 <> 包裹，避免被 markdown 截断）
    // 转换为标准 markdown 图片，宽高通过后处理注入；用 <> 包裹可兼容空格
    if (style) {
      // 临时用 alt 传递 style 编码，复制/预览阶段再解析（避免破坏 markdown）
      return `![${alt}|STYLE:${encodeURIComponent(style)}](<${src}>)`
    }
    return `![${alt}](<${src}>)`
  })
}

// 复制前：将 HTML 中指向 vault 内部的 <img src="..."> 转为 data URI (base64)
export async function embedLocalImagesAsData(html: string, plugin: MyPlugin): Promise<string> {
  const div = document.createElement('div')
  div.innerHTML = html
  const imgs = Array.from(div.querySelectorAll('img')) as HTMLImageElement[]
  const promises = imgs.map(async (img) => {
    const src = img.getAttribute('src') || ''
    if (!src || /^https?:\/\//i.test(src) || src.startsWith('data:')) return
    const file = plugin.app.vault.getAbstractFileByPath(src)
    if (!(file instanceof TFile)) return
    try {
      const mime = guessMime(src)
      // SVG 需读取文本，其余读取二进制
      let base64: string
      if (mime === 'image/svg+xml') {
        const txt = await plugin.app.vault.read(file)
        base64 = btoa(unescape(encodeURIComponent(txt)))
      } else {
        const bin = await plugin.app.vault.adapter.readBinary(file.path)
        base64 = arrayBufferToBase64(bin)
      }
      img.setAttribute('src', `data:${mime};base64,${base64}`)
      img.setAttribute('data-filename', file.name)
    } catch (e) {
      console.error('[wechat-md] embed image failed', src, e)
    }
  })
  await Promise.all(promises)
  return div.innerHTML
}

// 将 alt 中的 |STYLE:... 信息应用到 style 属性，并清理 alt
export function applyImageStyleFromAlt(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  const imgs = Array.from(div.querySelectorAll('img')) as HTMLImageElement[]
  imgs.forEach(img => {
    const alt = img.getAttribute('alt') || ''
    const match = alt.match(/^(.*)\|STYLE:(.+)$/)
    if (match) {
      const realAlt = match[1]
      const styleEncoded = match[2]
      try {
        const styleDecoded = decodeURIComponent(styleEncoded)
        // 合并旧 style
        const existing = img.getAttribute('style') || ''
        img.setAttribute('style', existing ? existing + ';' + styleDecoded : styleDecoded)
        img.setAttribute('alt', realAlt)
      } catch { /* ignore decode errors */ }
    }
  })
  return div.innerHTML
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buf)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function guessMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    case 'svg': return 'image/svg+xml'
    case 'avif': return 'image/avif'
    default: return 'image/png'
  }
}

// 预览阶段：将图片 src 从 vault 路径转换为 Obsidian 资源 URL，保留 data-original 以便调试
export function rewritePreviewImageSrc(container: HTMLElement, plugin: MyPlugin) {
  const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
  imgs.forEach(img => {
    const src = img.getAttribute('src') || ''
    if (!src || /^https?:\/\//i.test(src) || src.startsWith('data:')) return
    const file = plugin.app.vault.getAbstractFileByPath(src)
    if (file instanceof TFile) {
      const r = plugin.app.vault.getResourcePath(file)
      img.setAttribute('data-original', src)
      img.setAttribute('src', r)
    }
  })
}
