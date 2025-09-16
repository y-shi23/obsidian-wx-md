// 拷贝并精简 defaultTheme
import type { Theme } from './types'

// 与原项目 shared/configs/theme.ts 保持一致的 default 主题（经典）
export const defaultTheme: Theme = {
  base: {
    '--md-primary-color': '#000000',
    'text-align': 'left',
    'line-height': '1.75',
  },
  block: {
    container: {},
    h1: {
      display: 'table',
      padding: '0 1em',
      'border-bottom': '2px solid var(--md-primary-color)',
      margin: '2em auto 1em',
      color: 'hsl(var(--foreground))',
      'font-size': '1.2em',
      'font-weight': 'bold',
      'text-align': 'center',
    },
    h2: {
      display: 'table',
      padding: '0 0.2em',
      margin: '4em auto 2em',
      color: '#fff',
      background: 'var(--md-primary-color)',
      'font-size': '1.2em',
      'font-weight': 'bold',
      'text-align': 'center',
    },
    h3: {
      'padding-left': '8px',
      'border-left': '3px solid var(--md-primary-color)',
      margin: '2em 8px 0.75em 0',
      color: 'hsl(var(--foreground))',
      'font-size': '1.1em',
      'font-weight': 'bold',
      'line-height': '1.2',
    },
    h4: { margin: '2em 8px 0.5em', color: 'var(--md-primary-color)', 'font-size': '1em', 'font-weight': 'bold' },
    h5: { margin: '1.5em 8px 0.5em', color: 'var(--md-primary-color)', 'font-size': '1em', 'font-weight': 'bold' },
    h6: { margin: '1.5em 8px 0.5em', 'font-size': '1em', color: 'var(--md-primary-color)' },
    p: { margin: '1.5em 8px', 'letter-spacing': '0.1em', color: 'hsl(var(--foreground))' },
    blockquote: {
      'font-style': 'normal',
      padding: '1em',
      'border-left': '4px solid var(--md-primary-color)',
      'border-radius': '6px',
      color: 'rgba(0,0,0,0.5)',
      background: 'var(--blockquote-background)',
      'margin-bottom': '1em',
    },
    blockquote_p: { display: 'block', 'font-size': '1em', 'letter-spacing': '0.1em', color: 'hsl(var(--foreground))' },
    code_pre: {
      'font-size': '90%',
      'overflow-x': 'auto',
      'border-radius': '8px',
      padding: '1em',
      'line-height': '1.5',
      margin: '10px 8px',
    },
    code: { margin: '0', 'white-space': 'nowrap', 'font-size': '90%', 'font-family': 'Menlo, Operator Mono, Consolas, Monaco, monospace' },
    image: { display: 'block', 'max-width': '100%', margin: '0.1em auto 0.5em', 'border-radius': '4px' },
    ol: { 'padding-left': '1em', 'margin-left': '0', color: 'hsl(var(--foreground))' },
    ul: { 'list-style': 'circle', 'padding-left': '1em', 'margin-left': '0', color: 'hsl(var(--foreground))' },
    footnotes: { margin: '0.5em 8px', 'font-size': '80%', color: 'hsl(var(--foreground))' },
    figure: { margin: '1.5em 8px', color: 'hsl(var(--foreground))' },
    hr: {
      'border-style': 'solid',
      'border-width': '2px 0 0',
      'border-color': 'rgba(0,0,0,0.1)',
      '-webkit-transform-origin': '0 0',
      '-webkit-transform': 'scale(1, 0.5)',
      'transform-origin': '0 0',
      transform: 'scale(1, 0.5)',
      height: '0.4em',
      margin: '1.5em 0',
    },
    block_katex: { 'max-width': '100%', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch', padding: '0.5em 0' },
  },
  inline: {
    listitem: { display: 'block', margin: '0.2em 8px', color: 'hsl(var(--foreground))' },
    codespan: { 'font-size': '90%', color: '#d14', background: 'rgba(27,31,35,.05)', padding: '3px 5px', 'border-radius': '4px' },
    em: { 'font-style': 'italic', 'font-size': 'inherit' },
    link: { color: '#576b95' },
    wx_link: { color: '#576b95', 'text-decoration': 'none' },
    strong: { color: 'var(--md-primary-color)', 'font-weight': 'bold', 'font-size': 'inherit' },
    table: { 'border-collapse': 'collapse', 'text-align': 'center', margin: '1em 8px', color: 'hsl(var(--foreground))' },
    thead: { 'font-weight': 'bold', color: 'hsl(var(--foreground))' },
    th: { border: '1px solid #dfdfdf', padding: '0.25em 0.5em', color: 'hsl(var(--foreground))', 'word-break': 'keep-all', background: 'rgba(0, 0, 0, 0.05)' },
    td: { border: '1px solid #dfdfdf', padding: '0.25em 0.5em', color: 'hsl(var(--foreground))', 'word-break': 'keep-all' },
    footnote: { 'font-size': '12px', color: 'hsl(var(--foreground))' },
    figcaption: { 'text-align': 'center', color: '#888', 'font-size': '0.8em' },
    inline_katex: { 'max-width': '100%', 'overflow-x': 'auto' },
  },
}

// 简单深拷贝与深合并工具
function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)) }
function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out = clone(base)
  for (const k in patch) {
    const pv = (patch as Record<string, unknown>)[k]
    const bv = (base as Record<string, unknown>)[k]
    if (pv && typeof pv === 'object' && !Array.isArray(pv)) {
      out[k] = deepMerge((bv as Record<string, unknown>) || {}, pv as Record<string, unknown>) as unknown as T[Extract<keyof T,string>]
    } else {
      out[k] = pv as T[Extract<keyof T,string>]
    }
  }
  return out
}

// grace (优雅) 主题：与原项目 graceTheme 一致
export const graceTheme: Theme = (() => {
  const t = clone(defaultTheme)
  t.block.h1 = deepMerge(t.block.h1, {
    padding: '0.5em 1em',
    'border-bottom': '2px solid var(--md-primary-color)',
    'font-size': '1.4em',
    'text-shadow': '2px 2px 4px rgba(0,0,0,0.1)',
  })
  t.block.h2 = deepMerge(t.block.h2, {
    padding: '0.3em 1em',
    'border-radius': '8px',
    'font-size': '1.3em',
    'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
  })
  t.block.h3 = deepMerge(t.block.h3, {
    'padding-left': '12px',
    'font-size': '1.2em',
    'border-left': '4px solid var(--md-primary-color)',
    'border-bottom': '1px dashed var(--md-primary-color)',
  })
  t.block.h4 = deepMerge(t.block.h4, { 'font-size': '1.1em' })
  t.block.h5 = deepMerge(t.block.h5, { 'font-size': '1em' })
  t.block.h6 = deepMerge(t.block.h6, { 'font-size': '1em' })
  t.block.blockquote = deepMerge(t.block.blockquote, {
    'font-style': 'italic',
    padding: '1em 1em 1em 2em',
    'border-left': '4px solid var(--md-primary-color)',
    'border-radius': '6px',
    color: 'rgba(0,0,0,0.6)',
    'box-shadow': '0 4px 6px rgba(0,0,0,0.05)',
  })
  t.block.code_pre = deepMerge(t.block.code_pre, { 'box-shadow': 'inset 0 0 10px rgba(0,0,0,0.05)' })
  t.block.code = deepMerge(t.block.code, { 'font-family': `'Fira Code', Menlo, Operator Mono, Consolas, Monaco, monospace` })
  t.block.image = deepMerge(t.block.image, {
    'border-radius': '8px',
    'box-shadow': '0 4px 8px rgba(0,0,0,0.1)',
  })
  t.block.ol = deepMerge(t.block.ol, { 'padding-left': '1.5em' })
  t.block.ul = deepMerge(t.block.ul, { 'list-style': 'none', 'padding-left': '1.5em' })
  t.block.hr = {
    height: '1px',
    border: 'none',
    margin: '2em 0',
    background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0))',
  }
  t.inline.listitem = deepMerge(t.inline.listitem, { margin: '0.5em 8px' })
  t.inline.table = deepMerge(t.inline.table, {
    'border-collapse': 'separate',
    'border-spacing': '0',
    'border-radius': '8px',
    margin: '1em 8px',
    'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  })
  t.inline.thead = deepMerge(t.inline.thead, { color: '#fff' })
  t.inline.td = deepMerge(t.inline.td, { padding: '0.5em 1em' })
  t.inline.footnote = deepMerge(t.inline.footnote, { color: 'rgba(0,0,0,0.5)' })
  return t
})()

// simple (简洁) 主题：与原项目 simpleTheme 一致
export const simpleTheme: Theme = (() => {
  const t = clone(defaultTheme)
  t.block.h1 = deepMerge(t.block.h1, {
    padding: '0.5em 1em',
    'font-size': '1.4em',
    'text-shadow': '1px 1px 3px rgba(0,0,0,0.05)',
  })
  t.block.h2 = deepMerge(t.block.h2, {
    padding: '0.3em 1.2em',
    'font-size': '1.3em',
    'border-radius': '8px 24px 8px 24px',
    'box-shadow': '0 2px 6px rgba(0,0,0,0.06)',
  })
  t.block.h3 = deepMerge(t.block.h3, {
    'padding-left': '12px',
    'font-size': '1.2em',
    'border-radius': '6px',
    'line-height': '2.4em',
    'border-left': '4px solid var(--md-primary-color)',
    'border-right': '1px solid color-mix(in srgb, var(--md-primary-color) 10%, transparent)',
    'border-bottom': '1px solid color-mix(in srgb, var(--md-primary-color) 10%, transparent)',
    'border-top': '1px solid color-mix(in srgb, var(--md-primary-color) 10%, transparent)',
    background: 'color-mix(in srgb, var(--md-primary-color) 8%, transparent)',
  })
  t.block.h4 = deepMerge(t.block.h4, { 'font-size': '1.1em', 'border-radius': '6px' })
  t.block.h5 = deepMerge(t.block.h5, { 'border-radius': '6px' })
  t.block.h6 = deepMerge(t.block.h6, { 'border-radius': '6px' })
  t.block.blockquote = deepMerge(t.block.blockquote, {
    'font-style': 'italic',
    padding: '1em 1em 1em 2em',
    color: 'rgba(0,0,0,0.6)',
    'border-bottom': '0.2px solid rgba(0, 0, 0, 0.04)',
    'border-top': '0.2px solid rgba(0, 0, 0, 0.04)',
    'border-right': '0.2px solid rgba(0, 0, 0, 0.04)',
  })
  t.block.code_pre = deepMerge(t.block.code_pre, { border: '1px solid rgba(0, 0, 0, 0.04)' })
  t.block.code = deepMerge(t.block.code, { 'font-family': `'Fira Code', Menlo, Operator Mono, Consolas, Monaco, monospace` })
  t.block.image = deepMerge(t.block.image, { 'border-radius': '8px', border: '1px solid rgba(0, 0, 0, 0.04)' })
  t.block.ol = deepMerge(t.block.ol, { 'padding-left': '1.5em' })
  t.block.ul = deepMerge(t.block.ul, { 'list-style': 'none', 'padding-left': '1.5em' })
  t.block.hr = {
    height: '1px',
    border: 'none',
    margin: '2em 0',
    background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0))',
  }
  t.inline.listitem = deepMerge(t.inline.listitem, { margin: '0.5em 8px' })
  return t
})()

// 主题映射（包含兼容别名 classic->default, elegant->grace）
export const THEME_VARIANTS: Record<string, Theme> = {
  default: defaultTheme,
  grace: graceTheme,
  simple: simpleTheme,
  // 兼容旧字段
  classic: defaultTheme,
  elegant: graceTheme,
}
