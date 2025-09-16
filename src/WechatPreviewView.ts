import { ItemView, WorkspaceLeaf, TFile, MarkdownView, Notice } from 'obsidian'
import type MyPlugin from '../main'

export const WECHAT_PREVIEW_VIEW_TYPE = 'wechat-md-preview'

export class WechatPreviewView extends ItemView {
  private plugin: MyPlugin
  private container: HTMLDivElement
  private currentFile: TFile | null = null
  private detachHandler: (() => void) | null = null

  constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  getViewType() { return WECHAT_PREVIEW_VIEW_TYPE }
  getDisplayText() { return '公众号预览' }
  getIcon() { return 'layout' }

  async onOpen() {
    const root = this.containerEl.children[1] as HTMLElement
    root.empty()
    this.container = root.createDiv({ cls: 'wechat-md-preview-pane' })
    this.container.setAttr('style', 'padding:12px;overflow:auto;font-size:14px;line-height:1.6;')
    // 注入简易 highlight.js 样式（一次性）
    this.injectHighlightStyle()
    this.registerActiveFileListener()
    // 监听设置变化
  // 自定义事件：类型系统中无定义，使用 unknown 再断言
    const ref = (this.app.workspace.on as unknown as (name: string, cb: () => void) => unknown)('wechat-md-settings-changed', () => this.renderActive())
    // @ts-ignore Obsidian EventRef 类型内部声明，这里强制断言
    this.registerEvent(ref)
    await this.renderActive()
  }

  async onClose() {
    this.detachHandler?.()
  }

  private registerActiveFileListener() {
    const debounced = this.debounce(() => this.renderActive(), 300)

    const fileOpenCb = () => debounced()
    const leafChangeCb = () => debounced()
    this.app.workspace.on('file-open', fileOpenCb)
    this.app.workspace.on('active-leaf-change', leafChangeCb)

    // 监听 md 内容变化（metadataCache 有 changed 事件）
    this.registerEvent(this.app.metadataCache.on('changed', (_file) => {
      if (this.currentFile && _file.path === this.currentFile.path) debounced()
    }))

    // 监听通用 editor-change 事件（Obsidian 会触发）
    this.registerEvent(this.app.workspace.on('editor-change', () => debounced()))

    this.detachHandler = () => {
      this.app.workspace.off('file-open', fileOpenCb)
      this.app.workspace.off('active-leaf-change', leafChangeCb)
    }
  }

  private debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
    let t: number | null = null
    // @ts-ignore
    return function(this: unknown, ...args: unknown[]) {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => fn.apply(this, args), wait)
    } as T
  }

  private getActiveFile(): TFile | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView)
    return view?.file ?? null
  }

  async renderActive() {
  const file = this.getActiveFile()
    if (!file) {
      // 如果当前没有活动文件，继续显示最后一次内容（不清空）
      return
    }
    if (file.extension !== 'md') {
      return
    }
    const content = await this.app.vault.read(file)
    this.currentFile = file
    try {
      const html = this.plugin.convertRaw(content)
      this.container.innerHTML = this.wrap(html)
    } catch (e) {
      console.error(e)
      new Notice('渲染失败，请查看控制台')
    }
  }

  private wrap(html: string) {
    const width = this.plugin.settings.containerWidth || '760px'
    return `<div style="max-width:${width};margin:0 auto;">${html}</div>`
  }

  private injectHighlightStyle() {
    const exist = this.containerEl.querySelector('style[data-wx-hljs]') as HTMLStyleElement | null
    const tokens = this.plugin.renderer.getOpts().codeColorMap || {}
    const css = `pre code { display:block; padding:12px; border-radius:6px; background:${tokens.bg || '#2e3440'}; color:${tokens.text || '#eceff4'}; overflow:auto; }
code { background:rgba(0,0,0,0.08); padding:2px 4px; border-radius:4px; }
pre { background:${tokens.bg || '#2e3440'}; }
/* 关键字、字符串等 token 粗略映射 */
pre code .hljs-keyword { color:${tokens.keyword || tokens.text || '#81a1c1'}; }
pre code .hljs-string { color:${tokens.string || tokens.text || '#a3be8c'}; }
pre code .hljs-number { color:${tokens.number || tokens.text || '#b48ead'}; }
pre code .hljs-comment { color:${tokens.comment || '#616e88'}; font-style:italic; }
pre code .hljs-function, pre code .hljs-title { color:${tokens.func || tokens.keyword || tokens.text || '#88c0d0'}; }`
    if (exist) {
      exist.textContent = css
      return
    }
    const style = document.createElement('style')
    style.setAttribute('data-wx-hljs', '1')
    style.textContent = css
    this.containerEl.appendChild(style)
  }
}